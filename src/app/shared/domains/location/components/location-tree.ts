import { Location } from "@shared/interfaces/location";

export interface LocationNode extends Location {
  children: LocationNode[];
  depth: number;
}

export const MAX_DEPTH = 7;

// ─── Helpers de O(1) ───────────────────────────────────────────
function mapById(list: Location[]): Map<number, Location> {
  return new Map(list.map(l => [l.id, l]));
}

function mapChildren(list: Location[]): Map<number, Location[]> {
  const map = new Map<number, Location[]>();
  for (const l of list) {
    if (l.parentId != null) {
      if (!map.has(l.parentId)) map.set(l.parentId, []);
      map.get(l.parentId)!.push(l);
    }
  }
  return map;
}

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
export function getAncestors(id: number, list: Location[]): Location[] {
  const byId = mapById(list);
  const chain: Location[] = [];
  let current = byId.get(id);
  while (current) {
    chain.unshift(current);
    current = current.parentId != null ? byId.get(current.parentId) : undefined;
  }
  return chain;
}

/** Reutiliza getAncestors (mata o clone de 85%) */
export function getPath(id: number, list: Location[]): string {
  return getAncestors(id, list).map(l => l.name).join(' › ');
}

export function getChildren(parentId: number | null, list: Location[]): Location[] {
  return list.filter(l => (l.parentId ?? null) === parentId);
}

export function getActionLabel(id: number, list: Location[]): string {
  const count = getChildren(id, list).length;
  if (count === 0) return 'Ver dispositivos';
  return count === 1 ? '1 local' : `${count} locais`;
}

// ─── Regras de profundidade (Otimizadas) ───────────────────────

export function getDepth(id: number, list: Location[]): number {
  const byId = mapById(list);
  let depth = 0;
  let current = byId.get(id);
  while (current?.parentId != null) {
    current = byId.get(current.parentId);
    depth++;
  }
  return depth;
}

export function getDescendantIds(id: number, list: Location[]): Set<number> {
  const childrenMap = mapChildren(list);
  const result = new Set<number>();
  const queue = [id];

  while (queue.length) {
    const currentId = queue.pop()!;
    result.add(currentId);
    const children = childrenMap.get(currentId) || [];
    for (const c of children) queue.push(c.id);
  }
  return result;
}

export function getSubtreeHeight(id: number, list: Location[]): number {
  const childrenMap = mapChildren(list);
  let max = 0;

  const walk = (pid: number, d: number) => {
    const children = childrenMap.get(pid) || [];
    if (d > max) max = d;
    for (const c of children) walk(c.id, d + 1);
  };

  walk(id, 1);
  return max;
}

export function canAddChild(parentId: number, list: Location[]): boolean {
  return getDepth(parentId, list) + 1 < MAX_DEPTH;
}

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
