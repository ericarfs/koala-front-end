import { Location } from "@shared/interfaces/location";

export interface LocationNode extends Location {
  children: LocationNode[];
  depth: number;
}

export function buildTree(list: Location[]): LocationNode[] {
  const map = new Map<number, LocationNode>();
  list.forEach(l => map.set(l.id, { ...l, children: [], depth: 0 }));

  const roots: LocationNode[] = [];
  map.forEach(node => {
    const parent = node.parentId != null ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node); // raiz, ou órfão (pai inexistente)
  });

  const setDepth = (nodes: LocationNode[], depth: number) =>
    nodes.forEach(n => { n.depth = depth; setDepth(n.children, depth + 1); });
  setDepth(roots, 0);

  return roots;
}

/** Lista "achatada" em ordem de árvore, útil para select indentado */
export function flattenTree(nodes: LocationNode[]): LocationNode[] {
  return nodes.flatMap(n => [n, ...flattenTree(n.children)]);
}

/** Caminho: "USP › Campus São Carlos › ICMC" */
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

/** O id + todos os descendentes (para filtrar dispositivos "dentro" de um local) */
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

/** Da raiz até o próprio local: [USP, Campus São Carlos, ICMC] */
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
