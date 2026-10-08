import {
  Component, ElementRef, HostListener, computed, effect, forwardRef, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { buildTree } from './location-tree';
import { TranslatePipe } from '@ngx-translate/core';
import { LocationStore } from './location-store';

interface LocationNode {
  id: number;
  name: string;
  children?: LocationNode[];
}

interface FlatNode {
  id: number;
  name: string;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-location-tree-select',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => LocationTreeSelect),
    multi: true,
  }],
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="toggle()"
        [disabled]="disabled()"
        class="h-10 w-full flex items-center justify-between gap-2 border border-outline rounded-md px-3 bg-container text-default focus:outline-none focus:border-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <span class="truncate text-left" [class.text-neutral]="!selectedName()">
          {{ selectedName() || ('MONITORING.PLACEHOLDERS.SELECT_LOCATION' | translate) }}
        </span>
        <i class="fa-solid fa-chevron-down text-xs text-neutral transition-transform"
           [class.rotate-180]="open()"></i>
      </button>

      @if (open()) {
        <div class="absolute z-30 mt-1 w-full min-w-72 bg-container border border-outline rounded-md shadow-lg overflow-hidden">
          <div class="p-2 border-b border-outline">
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral"></i>
              <input
                #searchInput
                type="text"
                [value]="search()"
                (input)="onSearch($event)"
                [placeholder]="'MONITORING.PLACEHOLDERS.FIND_LOCATION' | translate"
                class="w-full h-9 pl-8 pr-3 text-sm border border-outline rounded-md bg-container text-default focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <ul class="max-h-72 overflow-auto py-1">
            @if (visibleNodes().length === 0) {
              <li class="px-3 py-4 text-sm text-neutral text-center">
                {{ 'MONITORING.FILTERS.EMPTY' | translate }}
              </li>
            }
            @for (node of visibleNodes(); track node.id) {
              <li>
                <button
                  type="button"
                  [attr.data-id]="node.id"
                  (click)="select(node)"
                  [style.paddingLeft.px]="node.depth * 16 + 8"
                  class="w-full flex items-center gap-1.5 pr-3 py-1.5 text-sm text-left cursor-pointer transition-colors"
                  [class.bg-secondary]="value() === node.id"
                  [class.text-secondary-foreground]="value() === node.id"
                  [class.font-medium]="value() === node.id"
                  [class.hover:bg-secondary/10]="value() !== node.id"
                >
                  <span
                    class="w-5 h-5 flex items-center justify-center rounded shrink-0 hover:bg-black/10"
                    [class.invisible]="!node.hasChildren"
                    (click)="toggleExpand($event, node)"
                  >
                    <i class="fa-solid text-[10px] transition-transform"
                       [class.fa-chevron-right]="!node.expanded"
                       [class.fa-chevron-down]="node.expanded"></i>
                  </span>
                  <i class="fa-solid fa-location-dot text-xs opacity-60"></i>
                  <span class="truncate">{{ node.name }}</span>
                  @if (value() === node.id) {
                    <i class="fa-solid fa-check text-xs ml-auto"></i>
                  }
                </button>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class LocationTreeSelect implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly store = inject(LocationStore);

  readonly open = signal(false);
  readonly search = signal('');
  readonly value = signal<number | null>(null);
  readonly disabled = signal(false);
  readonly expandedIds = signal<Set<number>>(new Set());

  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly treeData = computed(() => {
    const tree = buildTree(this.store.items()) as LocationNode[];

    const nodesById = new Map<number, LocationNode>();
    const parentsById = new Map<number, number>();
    const childrenById = new Map<number, number[]>();

    const index = (nodes: LocationNode[], parentId: number | null): void => {
      for (const n of nodes) {
        nodesById.set(n.id, n);
        if (parentId != null) parentsById.set(n.id, parentId);
        if (n.children?.length) {
          childrenById.set(n.id, n.children.map((c) => c.id));
          index(n.children, n.id);
        }
      }
    };
    index(tree, null);

    return { tree, nodesById, parentsById, childrenById };
  });

  constructor() {
    // Auto-expande ancestrais quando o valor muda (inclusive via writeValue)
    effect(() => {
      const id = this.value();
      if (id == null) return;
      this.expandAncestors(id);
      if (this.open()) {
        queueMicrotask(() => this.scrollToSelected(id));
      }
    });

    // Ao abrir, garante expansão + scroll até o selecionado
    effect(() => {
      if (!this.open()) return;
      const id = this.value();
      if (id == null) return;
      this.expandAncestors(id);
      queueMicrotask(() => this.scrollToSelected(id));
    });

    // Limpa ids "órfãos" do expandedIds quando a árvore muda
    // (ex.: local removido). treeData não depende de expandedIds,
    // então não há loop.
    effect(() => {
      const valid = new Set(this.treeData().nodesById.keys());
      this.expandedIds.update((set) => {
        const next = new Set([...set].filter((id) => valid.has(id)));
        return next.size === set.size ? set : next;
      });
    });
  }

  /** Adiciona todos os ancestrais do nó ao set de expandidos. */
  private expandAncestors(id: number): void {
    const { parentsById } = this.treeData();

    const ancestors: number[] = [];
    let current = id;
    while (parentsById.has(current)) {
      current = parentsById.get(current)!;
      ancestors.push(current);
    }
    if (ancestors.length === 0) return;

    this.expandedIds.update((set) => {
      let changed = false;
      const next = new Set(set);
      for (const a of ancestors) {
        if (!next.has(a)) {
          next.add(a);
          changed = true;
        }
      }
      return changed ? next : set;
    });
  }

  private scrollToSelected(id: number): void {
    const container = this.el.nativeElement.querySelector('ul');
    const item = this.el.nativeElement.querySelector(
      `[data-id="${id}"]`
    ) as HTMLElement | null;
    if (!container || !item) return;
    item.scrollIntoView({ block: 'nearest' });
  }

  readonly selectedName = computed(() => {
    const id = this.value();
    if (id == null) return '';
    return this.treeData().nodesById.get(id)?.name ?? '';
  });

  readonly visibleNodes = computed<FlatNode[]>(() => {
    const term = this.search().trim().toLowerCase();
    const { tree } = this.treeData();

    // Busca: lista achatada, sem indentação profunda, sem expand/collapse
    if (term) {
      const out: FlatNode[] = [];
      const walk = (nodes: LocationNode[], depth: number): void => {
        for (const n of nodes) {
          if (n.name.toLowerCase().includes(term)) {
            out.push({
              id: n.id,
              name: n.name,
              depth,
              hasChildren: false,
              expanded: false,
            });
          }
          if (n.children?.length) walk(n.children, depth + 1);
        }
      };
      walk(tree, 0);
      return out;
    }

    // Navegação: respeita expandidos
    const expanded = this.expandedIds();
    const out: FlatNode[] = [];
    const walk = (nodes: LocationNode[], depth: number): void => {
      for (const n of nodes) {
        const hasChildren = !!n.children?.length;
        const isExpanded = expanded.has(n.id);
        out.push({
          id: n.id,
          name: n.name,
          depth,
          hasChildren,
          expanded: isExpanded,
        });
        if (hasChildren && isExpanded) walk(n.children!, depth + 1);
      }
    };
    walk(tree, 0);
    return out;
  });

  toggle(): void {
    this.open.update((v) => !v);
  }

  onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  toggleExpand(e: Event, node: FlatNode): void {
    e.stopPropagation();
    this.expandedIds.update((set) => {
      const next = new Set(set);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }

  select(node: FlatNode): void {
    this.value.set(node.id);
    this.onChange(node.id);
    this.onTouched();
    this.open.set(false);
    this.search.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.open()) return;
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.open.set(false);
  }

  // ---- ControlValueAccessor ----
  writeValue(v: number | null): void {
    this.value.set(v ?? null);
  }
  registerOnChange(fn: (v: number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
