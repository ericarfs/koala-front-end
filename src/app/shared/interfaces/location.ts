export interface Location {
  id: number;
  name: string;
  description?: string;
  parentId: number | null; // null = raiz (ex: USP)
}
