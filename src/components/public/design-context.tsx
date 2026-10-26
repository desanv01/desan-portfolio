'use client';
import { createContext, useContext, type ReactNode } from 'react';
import type { RuntimeBinding } from '@/design/runtime';
import type { DesignNode } from '@/design/model';
export type PublicDesignRuntime = {
  binding: (id: string) => RuntimeBinding | undefined;
  breakpoints?: { id: string; minWidth: number }[];
  anchors?: Record<string, string>;
  nodes?: Record<string, DesignNode>;
  viewportWidth?: number;
  reducedMotion?: boolean;
  appearance?: { mode: 'light' | 'dark'; themeId: string };
  renderNodes?: (ids: string[]) => ReactNode;
};
export const PublicDesignContext = createContext<PublicDesignRuntime>({
  binding: () => undefined,
});
export function useDesignBinding(id: string) {
  return useContext(PublicDesignContext).binding(id);
}
export function useDesignBehavior(id: string) {
  return useDesignBinding(id)?.behavior || {};
}
export function usePublicDesignRuntime() {
  return useContext(PublicDesignContext);
}
export function useRecordDesignBinding(
  node: string,
  collection: string,
  id: string | number,
) {
  const runtime = usePublicDesignRuntime();
  const override = Object.values(runtime.nodes ?? {})
    .filter(
      (candidate) =>
        candidate.componentId === node &&
        candidate.contentRef?.collection === collection &&
        candidate.contentRef.id === String(id),
    )
    .at(-1);
  const resolved = override && runtime.binding(override.id);
  if (!resolved) return runtime.binding(node);
  // A repeated record borrows presentation, not the unique placement's anchor.
  const attributes = { ...resolved.attributes };
  delete attributes.id;
  return { ...resolved, attributes };
}
