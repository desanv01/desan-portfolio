'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  STATES,
  validateDesign,
  type DesignDocument,
  type State,
} from '../../design/model';

export type StudioPreviewState = {
  document: DesignDocument;
  themeId: string;
  mode: 'light' | 'dark';
  states: State[];
  nodeId?: string;
  reducedMotion: boolean;
};
const PreviewContext = createContext<StudioPreviewState | null>(null);
const OwnerPreviewContext = createContext(false);
export function validatePreviewMessage(
  value: unknown,
): StudioPreviewState | null {
  if (!value || typeof value !== 'object') return null;
  const x = value as Record<string, unknown>;
  if (
    x.type !== 'owner-design-preview' ||
    (x.mode !== 'light' && x.mode !== 'dark') ||
    typeof x.themeId !== 'string' ||
    typeof x.reducedMotion !== 'boolean' ||
    !Array.isArray(x.states) ||
    x.states.some((s) => !STATES.includes(s as State)) ||
    (x.nodeId !== undefined && typeof x.nodeId !== 'string')
  )
    return null;
  const design = validateDesign(x.document);
  if (
    !design.valid ||
    !design.data.themes.some((t) => t.id === x.themeId && !t.archived)
  )
    return null;
  return {
    document: design.data,
    themeId: x.themeId,
    mode: x.mode,
    states: x.states as State[],
    nodeId: x.nodeId as string | undefined,
    reducedMotion: x.reducedMotion,
  };
}
/** Mount only inside the authenticated owner preview route, around the existing public renderer. */
export function DesignStudioPreviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<StudioPreviewState | null>(null);
  useEffect(() => {
    if (!state) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      await document.fonts?.ready;
      if (cancelled) return;
      const overflow = [
        ...document.querySelectorAll<HTMLElement>(
          '[data-design-root] [data-design-node]',
        ),
      ]
        .filter((n) => n.clientWidth > 0 && n.scrollWidth > n.clientWidth + 8)
        .map((n) => n.dataset.designNode)
        .filter((id, index, ids) => ids.indexOf(id) === index)
        .slice(0, 12);
      const fonts = document.fonts
        ? [...document.fonts]
            .filter((f) => f.status === 'error')
            .map((f) => f.family)
            .slice(0, 8)
        : [];
      window.parent.postMessage(
        {
          type: 'owner-design-preview-diagnostics',
          warnings: [
            ...overflow.map(
              (id) =>
                `${id}: content overflows its width. Inspect width, wrapping, grid tracks and padding at this device size.`,
            ),
            ...fonts.map(
              (name) =>
                `${name}: font loading failed. Check the pinned WOFF2 resource and fallback families.`,
            ),
          ],
        },
        window.location.origin,
      );
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [state]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        window.parent === window
      )
        return;
      const next = validatePreviewMessage(event.data);
      if (next) {
        setState(next);
        window.parent.postMessage(
          { type: 'owner-design-preview-applied' },
          window.location.origin,
        );
      }
    }
    window.addEventListener('message', receive);
    if (window.parent !== window)
      window.parent.postMessage(
        { type: 'owner-design-preview-ready' },
        window.location.origin,
      );
    return () => window.removeEventListener('message', receive);
  }, []);
  return (
    <OwnerPreviewContext.Provider value={true}>
      <PreviewContext.Provider value={state}>
        {children}
      </PreviewContext.Provider>
    </OwnerPreviewContext.Provider>
  );
}
export const useDesignStudioPreview = () => useContext(PreviewContext);
export const useIsOwnerDesignPreview = () => useContext(OwnerPreviewContext);
