import { Location } from "@shared/interfaces/location";

export interface LocationNode extends Location {
  children: LocationNode[];
  depth: number;
}

// ─── Constantes ────────────────────────────────────────────────
export const MAX_DEPTH = 7;

// ─── Construção da árvore ──────────────────────────────────────
export function buildTree(list: Location[]): LocationNode[] {
  const map = new Map<number, LocationNode>();
  list.forEach(l => map.set(l.id, { ...l, children: [], depth: 0 }));

  const roots: LocationNode[] = [];
  map.forEach(node => {
    const parent = node.parentId != null ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const setDepth = (nodes: LocationNode[], depth: number) =>
    nodes.forEach(n => { n.depth = depth; setDepth(n.children, depth + 1); });
  setDepth(roots, 0);

  return roots;
}

export function flattenTree(nodes: LocationNode[]): LocationNode[] {
  return nodes.flatMap(n => [n, ...flattenTree(n.children)]);
}

// ─── Caminhos / busca ──────────────────────────────────────────
export function getPath(id: number, list: Location[]): string {
  const byId = new Map(list.map(l => [l.id, l]));
  const parts: string[] = [];
  let current = byId.get(id);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId != null ? byId.get(current.parentId) : undefined;
  }
  return parts.join(' › ');
}

export function getDescendantIds(id: number, list: Location[]): Set<number> {
  const result = new Set<number>([id]);
  let added = true;
  while (added) {
    added = false;
    for (const l of list) {
      if (l.parentId != null && result.has(l.parentId) && !result.has(l.id)) {
        result.add(l.id);
        added = true;
      }
    }
  }
  return result;
}

export function getChildren(parentId: number | null, list: Location[]): Location[] {
  return list.filter(l => l.parentId === parentId);
}

export function getAncestors(id: number, list: Location[]): Location[] {
  const byId = new Map(list.map(l => [l.id, l]));
  const chain: Location[] = [];
  let current = byId.get(id);
  while (current) {
    chain.unshift(current);
    current = current.parentId != null ? byId.get(current.parentId) : undefined;
  }
  return chain;
}

export function getActionLabel(id: number, list: Location[]): string {
  const count = getChildren(id, list).length;
  if (count === 0) return 'Ver dispositivos';
  return count === 1 ? '1 local' : `${count} locais`;
}

// ─── Regras de profundidade (MAX_DEPTH) ────────────────────────  ← AQUI
/** Profundidade do nó (raiz = 0). */
export function getDepth(id: number, list: Location[]): number {
  const byId = new Map(list.map((l) => [l.id, l]));
  let depth = 0;
  let current = byId.get(id);
  while (current?.parentId != null) {
    current = byId.get(current.parentId);
    depth++;
  }
  return depth;
}

/** Altura da subárvore com raiz em `id` (folha = 0). */
export function getSubtreeHeight(id: number, list: Location[]): number {
  let max = 0;
  const walk = (pid: number, d: number): void => {
    for (const c of list) {
      if (c.parentId === pid) {
        if (d > max) max = d;
        walk(c.id, d + 1);
      }
    }
  };
  walk(id, 1);
  return max;
}

/** Pode inserir um filho direto em `parentId` sem estourar MAX_DEPTH? */
export function canAddChild(parentId: number, list: Location[]): boolean {
  return getDepth(parentId, list) + 1 < MAX_DEPTH;
}

/** Pode mover `id` (e sua subárvore) para debaixo de `newParentId`? */
export function canReparent(
  id: number,
  newParentId: number | null,
  list: Location[],
): boolean {
  if (newParentId != null) {
    if (newParentId === id) return false;
    if (getDescendantIds(id, list).has(newParentId)) return false;
  }

  const height = getSubtreeHeight(id, list);
  const newParentDepth = newParentId == null ? -1 : getDepth(newParentId, list);

  return newParentDepth + 1 + height < MAX_DEPTH;
}
