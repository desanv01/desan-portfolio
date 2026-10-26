/** Observe real preview layout changes; no content text or owner data is reported. */
export function observePreviewDiagnostics(
  view: Window & typeof globalThis,
  doc: Document,
  report: (warnings: string[]) => void,
  delay = 350,
): () => void {
  let disposed = false,
    timer: number | undefined,
    generation = 0;
  async function measure(version: number) {
    await doc.fonts?.ready;
    if (disposed || version !== generation) return;
    const overflow = [
      ...doc.querySelectorAll<HTMLElement>(
        '[data-design-root] [data-design-node]',
      ),
    ]
      .filter((n) => n.clientWidth > 0 && n.scrollWidth > n.clientWidth + 8)
      .map((n) => n.dataset.designNode)
      .filter((id, i, ids) => ids.indexOf(id) === i)
      .slice(0, 12);
    const fonts = doc.fonts
      ? [...doc.fonts]
          .filter((f) => f.status === 'error')
          .map((f) => f.family)
          .slice(0, 8)
      : [];
    report([
      ...overflow.map(
        (id) =>
          `${id}: content overflows its width. Inspect width, wrapping, grid tracks and padding at this device size.`,
      ),
      ...fonts.map(
        (name) =>
          `${name}: font loading failed. Check the pinned WOFF2 resource and fallback families.`,
      ),
    ]);
  }
  function schedule() {
    const version = ++generation;
    view.clearTimeout(timer);
    timer = view.setTimeout(() => {
      void measure(version);
    }, delay);
  }
  view.addEventListener('resize', schedule);
  doc.addEventListener('load', schedule, true);
  doc.fonts?.addEventListener('loadingdone', schedule);
  doc.fonts?.addEventListener('loadingerror', schedule);
  const observer = view.ResizeObserver
    ? new view.ResizeObserver(schedule)
    : undefined;
  observer?.observe(doc.documentElement);
  schedule();
  return () => {
    disposed = true;
    generation++;
    view.clearTimeout(timer);
    observer?.disconnect();
    view.removeEventListener('resize', schedule);
    doc.removeEventListener('load', schedule, true);
    doc.fonts?.removeEventListener('loadingdone', schedule);
    doc.fonts?.removeEventListener('loadingerror', schedule);
  };
}
