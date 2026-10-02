import { computed, linkedSignal, Signal } from '@angular/core';

export function paginate<T>(
  items: Signal<T[]>,
  pageSize: Signal<number> | number = 8
) {
  const size = typeof pageSize === 'number' ? () => pageSize : pageSize;

  // Volta para 0 automaticamente sempre que `items` mudar
  const pageIndex = linkedSignal<T[], number>({
    source: items,
    computation: () => 0,
  });

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(items().length / size()))
  );

  const pagedItems = computed(() => {
    const start = pageIndex() * size();
    return items().slice(start, start + size());
  });

  return {
    pageIndex,
    totalPages,
    pagedItems,
    next: () => pageIndex.update(p => Math.min(p + 1, totalPages() - 1)),
    prev: () => pageIndex.update(p => Math.max(p - 1, 0)),
  };
}
