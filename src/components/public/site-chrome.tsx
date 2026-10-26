'use client';

import Link from './public-link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import Image from 'next/image';
import {
  documentProgress,
  seekFraction,
  progressKeyTarget,
  currentSection,
} from '@/design/runtime';
import { dimension } from '@/design/runtime-serialize';
import { plain, type Json } from '@/design/schema';
import { useDesignBinding, usePublicDesignRuntime } from './design-context';
import { BoundPrintButton } from './bound-professional';

import { DEFAULT_NAV, type PublicNavItem } from './navigation';
export { DEFAULT_NAV, type PublicNavItem } from './navigation';
const appearanceEvent = 'desan:appearance';
function subscribeAppearance(listener: () => void) {
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  window.addEventListener(appearanceEvent, listener);
  system.addEventListener('change', listener);
  return () => {
    window.removeEventListener(appearanceEvent, listener);
    system.removeEventListener('change', listener);
  };
}
function preferenceCookie(key: string) {
  try {
    return decodeURIComponent(
      document.cookie
        .split('; ')
        .find((x) => x.startsWith(`${key}=`))
        ?.slice(key.length + 1) || '',
    );
  } catch {
    return '';
  }
}
export function useSiteAppearance(
  initialMode: 'dark' | 'light',
  initialTheme: string,
  defaultMode?: 'light' | 'dark' | 'system',
  explicitMode?: 'light' | 'dark' | null,
  allowedThemeIds?: readonly string[],
) {
  const snapshot = useSyncExternalStore(
    subscribeAppearance,
    () => {
      const stored =
        document.documentElement.dataset.visitorMode ||
        explicitMode ||
        preferenceCookie('desan-mode');
      const mode =
        stored === 'light' || stored === 'dark'
          ? stored
          : defaultMode === 'system'
            ? matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            : defaultMode || initialMode;
      const storedTheme =
        document.documentElement.dataset.visitorTheme ||
        preferenceCookie('desan-theme');
      const candidate = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(storedTheme)
        ? storedTheme
        : initialTheme;
      const fallback =
        allowedThemeIds?.length && !allowedThemeIds.includes(initialTheme)
          ? allowedThemeIds[0]
          : initialTheme;
      const theme =
        !allowedThemeIds?.length || allowedThemeIds.includes(candidate)
          ? candidate
          : fallback;
      return `${mode}|${theme}`;
    },
    () => `${initialMode}|${initialTheme}`,
  );
  const [mode, themeId] = snapshot.split('|');
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    document.documentElement.dataset.theme = themeId;
  }, [mode, themeId]);
  return { mode: mode as 'dark' | 'light', themeId };
}
export function setSiteAppearance(
  mode: 'dark' | 'light',
  themeId: string,
  explicit: { modeExplicit?: boolean; themeExplicit?: boolean } = {},
) {
  document.documentElement.dataset.mode = mode;
  document.documentElement.dataset.theme = themeId;
  if (explicit.modeExplicit !== false)
    document.documentElement.dataset.visitorMode = mode;
  if (explicit.themeExplicit !== false)
    document.documentElement.dataset.visitorTheme = themeId;
  try {
    if (explicit.modeExplicit !== false)
      document.cookie = `desan-mode=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
    if (explicit.themeExplicit !== false)
      document.cookie = `desan-theme=${encodeURIComponent(themeId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* The in-page preference still works when persistence is denied. */
  }
  window.dispatchEvent(new Event(appearanceEvent));
}

export function Arrow({ external = false }: { external?: boolean }) {
  return (
    <span aria-hidden="true" className="arrow" data-design-part="icon">
      {external ? '↗' : '→'}
    </span>
  );
}
function Sun({ dark }: { dark: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {dark ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </>
      ) : (
        <path d="M20.8 14A9 9 0 0 1 10 3.2 9 9 0 1 0 20.8 14Z" />
      )}
    </svg>
  );
}

function object(value: Json | undefined): Record<string, Json> {
  return plain(value) ? (value as Record<string, Json>) : {};
}
const EMPTY_CONFIG: Record<string, Json> = {};
function scalar(value: Json | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function duration(value: Json | undefined, reduced: boolean) {
  const x = object(value);
  return reduced
    ? '0ms'
    : `${scalar(x.value, 150)}${x.unit === 's' ? 's' : 'ms'}`;
}
function feedbackStyle(
  value: Json | undefined,
  reduced: boolean,
): CSSProperties {
  const x = object(value);
  return {
    transitionDuration:
      x.kind === 'none' ? '0ms' : duration(x.duration, reduced),
  };
}
const pagePaths: Record<string, string> = {
  home: '/',
  work: '/work',
  profile: '/profile',
  journal: '/journal',
  contact: '/contact',
  resume: '/resume',
  search: '/search',
};
function orderedNavigation(
  navigation: PublicNavItem[],
  order: Json | undefined,
  nodes: ReturnType<typeof usePublicDesignRuntime>['nodes'],
) {
  if (!Array.isArray(order)) return navigation;
  return order.flatMap((id) => {
    if (typeof id !== 'string') return [];
    const page = nodes?.[id]?.target?.pageId;
    const item = navigation.find(
      (x) =>
        x.href === (page ? pagePaths[page] : `/${id}`) ||
        x.href === id ||
        (id === 'home' && x.href === '/'),
    );
    return item ? [item] : [];
  });
}
export function SiteHeader({
  navigation = DEFAULT_NAV,
  initialMode = 'dark',
  initialTheme = 'copper',
  themes = [],
  defaultMode,
  explicitMode,
}: {
  navigation?: PublicNavItem[];
  initialMode?: 'dark' | 'light';
  initialTheme?: string;
  themes?: { id: string; name: string }[];
  defaultMode?: 'light' | 'dark' | 'system';
  explicitMode?: 'light' | 'dark' | null;
}) {
  const path = usePathname();
  const runtime = usePublicDesignRuntime();
  const binding = useDesignBinding('header');
  const themeBinding = useDesignBinding('theme-toggle');
  const config = binding?.behavior || EMPTY_CONFIG;
  const reduced = !!runtime.reducedMotion;
  const items = orderedNavigation(
    navigation,
    config['shell.navOrder'],
    runtime.nodes,
  );
  const [open, setOpen] = useState(false);
  const [autoHidden, setAutoHidden] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const { mode, themeId } = useSiteAppearance(
    initialMode,
    initialTheme,
    defaultMode,
    explicitMode,
    themes.length ? themes.map((theme) => theme.id) : undefined,
  );
  const threshold = runtime.breakpoints?.find(
    (x) => x.id === config['shell.collapseAt'],
  )?.minWidth;
  const presentation = config['shell.navPresentation'];
  const forcedDisclosure =
    presentation === 'drawer' || presentation === 'disclosure';
  const narrow =
    forcedDisclosure ||
    (threshold !== undefined && (runtime.viewportWidth ?? 1440) < threshold);
  const explicitLayout = forcedDisclosure || threshold !== undefined;
  const isCurrent = (href: string) =>
    href === '/'
      ? path === '/'
      : path === href ||
        path.startsWith(`${href}/`) ||
        (href === '/profile' && path === '/resume');
  const current =
    items.find((item) => isCurrent(item.href))?.label || 'Explore';
  useEffect(() => {
    if (!open) return;
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: globalThis.PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);
  useEffect(() => {
    if (config['shell.sticky'] !== 'auto-hide') return;
    let last = window.scrollY;
    const update = () => {
      const next = window.scrollY;
      if (!header.current?.contains(document.activeElement))
        setAutoHidden(
          next > last + 2 && next > (header.current?.offsetHeight || 64),
        );
      last = next;
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [config]);
  const logo = object(config['shell.logoAsset']);
  const activeStyle = config['shell.activeIndicator'];
  const themeStyle = themeBinding?.behavior['appearance.controlStyle'];
  const navStyle: CSSProperties = {
    ...(explicitLayout
      ? {
          display: narrow ? (open ? 'flex' : 'none') : 'flex',
          position: narrow ? 'absolute' : 'static',
          top: narrow ? '100%' : undefined,
          left: narrow ? 0 : undefined,
          right: narrow ? 0 : undefined,
        }
      : {}),
    ...(presentation === 'stacked' || narrow
      ? { flexDirection: 'column' }
      : {}),
  };
  const hiddenStyle: CSSProperties =
    config['shell.sticky'] === 'auto-hide' && autoHidden && !open
      ? reduced
        ? { opacity: 0, pointerEvents: 'none' }
        : { transform: 'translateY(-100%)' }
      : {};
  return (
    <header
      ref={header}
      className="site-header"
      data-design-node="header"
      data-design-expanded={open}
      onFocusCapture={() => setAutoHidden(false)}
      style={hiddenStyle}
    >
      <Link
        className="brand"
        href="/"
        aria-label="Desan — home"
        onClick={() => setOpen(false)}
        data-design-part="logo"
      >
        {typeof logo.url === 'string' ? (
          <Image unoptimized src={logo.url} alt="" width={48} height={48} />
        ) : (
          'DV'
        )}
      </Link>
      <span
        className="mobile-current mono"
        style={
          explicitLayout ? { display: narrow ? 'flex' : 'none' } : undefined
        }
      >
        {current}
      </span>
      <nav
        id="main-navigation"
        aria-label="Main navigation"
        className={`main-nav ${open ? 'is-open' : ''}`}
        data-design-expanded={open}
        data-design-part="menu"
        style={navStyle}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent(item.href) ? 'page' : undefined}
            className="nav-link"
            data-design-node="nav-link"
            onClick={() => setOpen(false)}
          >
            <span
              data-design-part="label"
              style={{
                ...feedbackStyle(config['motion.headerFeedback'], reduced),
                ...(isCurrent(item.href) && activeStyle
                  ? {
                      borderBottom:
                        activeStyle === 'underline' || activeStyle === 'border'
                          ? '2px solid var(--accent)'
                          : 'none',
                      background:
                        activeStyle === 'fill'
                          ? 'var(--accent)'
                          : 'transparent',
                      color:
                        activeStyle === 'fill'
                          ? 'var(--background)'
                          : 'inherit',
                    }
                  : {}),
              }}
            >
              {item.label}
              {isCurrent(item.href) && activeStyle === 'marker' ? ' •' : ''}
            </span>
          </Link>
        ))}
        <Link
          className="nav-link mobile-search"
          href="/search"
          onClick={() => setOpen(false)}
        >
          <span>Search</span>
        </Link>
      </nav>
      <div className="appearance-controls">
        {themes.length > 1 &&
          (themeStyle === 'buttons' ? (
            themes.map((theme) => (
              <button
                type="button"
                key={theme.id}
                aria-pressed={themeId === theme.id}
                onClick={() =>
                  setSiteAppearance(mode, theme.id, { modeExplicit: false })
                }
              >
                {theme.name}
              </button>
            ))
          ) : (
            <select
              aria-label="Color theme"
              value={themeId}
              onChange={(event) =>
                setSiteAppearance(mode, event.target.value, {
                  modeExplicit: false,
                })
              }
            >
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          ))}
        <button
          type="button"
          data-design-node="theme-toggle"
          className="theme-toggle"
          onClick={() =>
            setSiteAppearance(mode === 'dark' ? 'light' : 'dark', themeId, {
              themeExplicit: false,
            })
          }
          aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} appearance`}
        >
          <Sun dark={mode === 'dark'} />
          {themeStyle === 'labelled-icon' && (
            <span>{mode === 'dark' ? 'Light' : 'Dark'}</span>
          )}
        </button>
      </div>
      <button
        ref={toggle}
        type="button"
        className="menu-toggle mono"
        style={
          explicitLayout ? { display: narrow ? 'block' : 'none' } : undefined
        }
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
    </header>
  );
}

type Section = { id: string; label: string; key: string };
export function PagePosition({
  showProgress = true,
  showSections = true,
  progressNodeId = 'progress',
  sectionNodeId = 'section-nav',
  progressAnchorId,
  sectionAnchorId,
}: {
  showProgress?: boolean;
  showSections?: boolean;
  progressNodeId?: string;
  sectionNodeId?: string;
  progressAnchorId?: string;
  sectionAnchorId?: string;
}) {
  const pathname = usePathname();
  const mobileSectionsId =
    sectionNodeId === 'section-nav'
      ? 'mobile-sections'
      : `mobile-sections-${sectionNodeId}`;
  const runtime = usePublicDesignRuntime();
  const progressBinding = useDesignBinding(progressNodeId);
  const navBinding = useDesignBinding(sectionNodeId);
  const progress = progressBinding?.behavior || {};
  const nav = navBinding?.behavior || {};
  const progressEnabled =
    showProgress &&
    progress['progress.enabled'] !== false &&
    !progressBinding?.attributes.hidden;
  const sectionsEnabled = showSections && !navBinding?.attributes.hidden;
  const configSignature = JSON.stringify([progress, nav, runtime.anchors]);
  const [state, setState] = useState({
    fraction: 0,
    range: 0,
    height: 1,
    section: '',
  });
  const [sections, setSections] = useState<Section[]>([]);
  const [expanded, setExpanded] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const activationProbe = useRef<HTMLSpanElement>(null);
  const seekProbe = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);
  const sectionsToggle = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const reduced = !!runtime.reducedMotion;
  const rawFormat = object(progress['progress.format']);
  const format = {
    digits: scalar(rawFormat.digits, 3),
    suffix: typeof rawFormat.suffix === 'string' ? rawFormat.suffix : '%',
  };
  const keyboard = object(progress['progress.keyboardSteps']);
  const steps = {
    arrow: scalar(keyboard.arrow, 1),
    page: scalar(keyboard.page, 10),
  };
  const currentRule = object(nav['sectionNav.currentRule']);
  const activationLength = currentRule.offset
    ? dimension(currentRule.offset)
    : '40px';
  const seekLength = nav['sectionNav.seekOffset']
    ? dimension(nav['sectionNav.seekOffset'])
    : '24px';
  useEffect(() => {
    let frame = 0;
    let disposed = false;
    const measure = () => {
      frame = 0;
      if (disposed) return;
      const measured = documentProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
      const elements = [
        ...document.querySelectorAll<HTMLElement>('main [data-section][id]'),
      ].filter((el) => el.getClientRects().length > 0);
      const byNode = new Map(
        [
          ...document.querySelectorAll<HTMLElement>(
            'main [data-design-node][id]',
          ),
        ]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => [el.dataset.designNode, el]),
      );
      const entries = Array.isArray(nav['sectionNav.entries'])
        ? nav['sectionNav.entries']
        : undefined;
      const selected = entries
        ? entries.flatMap((entry) => {
            const x = object(entry);
            const target =
              typeof x.targetId === 'string'
                ? byNode.get(x.targetId) ||
                  document.getElementById(
                    runtime.anchors?.[x.targetId] || x.targetId,
                  )
                : null;
            return target && target.getClientRects().length > 0
              ? [
                  {
                    el: target,
                    key: String(x.id),
                    label:
                      typeof x.label === 'string'
                        ? x.label
                        : target.dataset.section || target.id,
                  },
                ]
              : [];
          })
        : elements.map((el) => ({
            el,
            key: el.id,
            label: el.dataset.section || el.id,
          }));
      const order = nav['sectionNav.order'];
      const ordered = Array.isArray(order)
        ? order.flatMap((key) => selected.filter((x) => x.key === key))
        : selected;
      const nextSections = ordered.map(({ el, key, label }) => ({
        id: el.id,
        key,
        label,
      }));
      setSections((previous) =>
        JSON.stringify(previous) === JSON.stringify(nextSections)
          ? previous
          : nextSections,
      );
      const activation =
        (document.querySelector('header')?.getBoundingClientRect().bottom ||
          0) + (activationProbe.current?.getBoundingClientRect().width || 0);
      let section =
        currentSection(
          ordered.map(({ el }) => ({
            id: el.id,
            top: el.getBoundingClientRect().top,
          })),
          activation,
        ) || '';
      if (measured.fraction >= 0.999 && ordered.length)
        section = [...ordered]
          .sort(
            (a, b) =>
              a.el.getBoundingClientRect().top -
              b.el.getBoundingClientRect().top,
          )
          .at(-1)!.el.id;
      setState({
        fraction: measured.fraction,
        range: measured.range,
        height:
          rail.current?.clientHeight || Math.max(1, window.innerHeight - 88),
        section,
      });
    };
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    const changes = new MutationObserver(schedule);
    const main = document.querySelector('main');
    if (main)
      changes.observe(main, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden', 'open', 'class', 'style'],
      });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    window.addEventListener('hashchange', schedule);
    window.addEventListener(appearanceEvent, schedule);
    document.addEventListener('load', schedule, true);
    document.fonts.ready.then(schedule);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      changes.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
      window.removeEventListener('hashchange', schedule);
      window.removeEventListener(appearanceEvent, schedule);
      document.removeEventListener('load', schedule, true);
    };
    // String signature keeps passive scroll updates from re-subscribing to unchanged config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, configSignature]);
  const seek = (fraction: number) =>
    window.scrollTo({
      top:
        Math.min(1, Math.max(0, fraction)) *
        Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
      behavior: 'instant',
    });
  const seekPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    seek(seekFraction(event.clientY, rect.top, rect.height));
  };
  const keySeek = (event: KeyboardEvent<HTMLDivElement>) => {
    if (state.range <= 0) return;
    const next = progressKeyTarget(event.key, state.fraction, steps);
    if (next !== undefined) {
      event.preventDefault();
      seek(next);
    }
  };
  const label = `${String(Math.round(state.fraction * 100)).padStart(format.digits, '0')}${format.suffix}`;
  const strip = progress['progress.mapping'] !== 'normalized';
  const scaleHeight = strip
    ? Math.max(state.height, state.range)
    : state.height;
  const minor = scalar(object(progress['progress.minorTicks']).step, 1);
  const major = scalar(object(progress['progress.majorTicks']).step, 5);
  function ticks(step: number, majorTick: boolean) {
    const count = Math.floor(100 / step);
    const physicalStep = (step / 100) * scaleHeight;
    const stride = Math.max(1, Math.ceil(1 / Math.max(physicalStep, 1e-9)));
    const visibleStart = strip
      ? Math.max(0, state.fraction * (scaleHeight - state.height))
      : 0;
    const visibleEnd = visibleStart + state.height;
    const start = Math.max(
      0,
      Math.floor(visibleStart / Math.max(physicalStep, 1e-9)) - 1,
    );
    const end = Math.min(
      count,
      Math.ceil(visibleEnd / Math.max(physicalStep, 1e-9)) + 1,
    );
    const first = Math.floor(start / stride) * stride;
    return Array.from(
      {
        length: Math.min(
          2048,
          Math.max(0, Math.floor((end - first) / stride) + 1),
        ),
      },
      (_, j) => {
        const index = first + j * stride;
        const percent = index * step;
        return (
          <span
            key={`${majorTick ? 'major' : 'minor'}-${index}`}
            className={`rail-tick ${majorTick ? 'major' : ''}`}
            style={{ top: (percent / 100) * scaleHeight }}
            data-design-part={majorTick ? 'major-tick' : 'minor-tick'}
          >
            {majorTick && <small>{Number(percent.toFixed(6))}</small>}
          </span>
        );
      },
    );
  }
  const sectionLinks = () =>
    sections.map((section) => (
      <a
        key={section.key}
        href={`#${encodeURIComponent(section.id)}`}
        aria-current={state.section === section.id ? 'location' : undefined}
        onClick={(event) => {
          const target = document.getElementById(section.id);
          if (!target) return;
          event.preventDefault();
          setExpanded(false);
          const header =
            document.querySelector('header')?.getBoundingClientRect().bottom ||
            0;
          const top =
            target.getBoundingClientRect().top +
            window.scrollY -
            header -
            (seekProbe.current?.getBoundingClientRect().width || 0);
          history.pushState(null, '', `#${encodeURIComponent(section.id)}`);
          window.scrollTo({
            top: Math.max(0, top),
            behavior:
              !reduced && object(nav['motion.seekFeedback']).kind === 'smooth'
                ? 'smooth'
                : 'instant',
          });
          target.focus({ preventScroll: true });
        }}
      >
        {section.label}
      </a>
    ));
  const narrow = progress['progress.narrowVariant'];
  const zeroHidden =
    state.range <= 0 && progress['progress.zeroRange'] !== 'read-only-zero';
  return (
    <>
      <span
        ref={activationProbe}
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          width: activationLength,
          height: 0,
        }}
      />
      <span
        ref={seekProbe}
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          width: seekLength,
          height: 0,
        }}
      />
      {(progressEnabled || sectionsEnabled) && (
        <div
          className="mobile-progress mono"
          data-design-part="compact-progress"
          style={
            nav['sectionNav.narrow'] === 'inline'
              ? { flexWrap: 'wrap' }
              : undefined
          }
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setExpanded(false);
              sectionsToggle.current?.focus();
            }
          }}
        >
          {progressEnabled && narrow !== 'hidden' && (
            <span>
              {narrow === 'indicator' ? (
                <progress
                  aria-label="Page position"
                  max={100}
                  value={Math.round(state.fraction * 100)}
                />
              ) : (
                <>Page {label}</>
              )}
            </span>
          )}
          {sectionsEnabled &&
            sections.length > 0 &&
            nav['sectionNav.narrow'] !== 'inline' && (
              <button
                ref={sectionsToggle}
                type="button"
                aria-expanded={expanded}
                aria-controls={mobileSectionsId}
                onClick={() => setExpanded(!expanded)}
              >
                Sections <span aria-hidden="true">{expanded ? '↑' : '↓'}</span>
              </button>
            )}
          {(expanded || nav['sectionNav.narrow'] === 'inline') &&
            sectionsEnabled && (
              <nav
                id={mobileSectionsId}
                aria-label="Page sections"
                style={
                  nav['sectionNav.narrow'] === 'inline'
                    ? { position: 'static', flexBasis: '100%' }
                    : nav['sectionNav.narrow'] === 'sheet'
                      ? {
                          position: 'fixed',
                          top: 'auto',
                          bottom: 0,
                          maxHeight: '60vh',
                          overflowY: 'auto',
                        }
                      : undefined
                }
              >
                {sectionLinks()}
              </nav>
            )}
        </div>
      )}
      {progressEnabled && (
        <aside
          className="reading-rail"
          data-design-node={progressNodeId}
          hidden={zeroHidden}
        >
          <div
            ref={rail}
            id={progressAnchorId}
            className="rail-track"
            data-design-part="seek"
            role="slider"
            tabIndex={state.range > 0 ? 0 : -1}
            aria-disabled={state.range <= 0 || undefined}
            aria-label="Page position"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(state.fraction * 100)}
            aria-valuetext={label}
            onKeyDown={keySeek}
            style={{ touchAction: 'pan-y' }}
            onPointerDown={(event) => {
              if (state.range <= 0) return;
              if (event.pointerType === 'touch') {
                touchStart.current = { x: event.clientX, y: event.clientY };
                return;
              }
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              event.currentTarget.focus();
              seekPointer(event);
            }}
            onPointerMove={(event) => {
              if (dragging.current) seekPointer(event);
            }}
            onPointerUp={(event) => {
              if (
                event.pointerType === 'touch' &&
                touchStart.current &&
                Math.hypot(
                  event.clientX - touchStart.current.x,
                  event.clientY - touchStart.current.y,
                ) < 8
              )
                seekPointer(event);
              touchStart.current = null;
              dragging.current = false;
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => {
              dragging.current = false;
              touchStart.current = null;
            }}
            onLostPointerCapture={() => {
              dragging.current = false;
            }}
          >
            <div
              className="rail-ticks"
              aria-hidden="true"
              style={{
                height: scaleHeight,
                transform: `translateY(${strip ? state.fraction * (state.height - scaleHeight) : 0}px)`,
              }}
            >
              {ticks(minor, false)}
              {ticks(major, true)}
            </div>
            <div
              className="rail-marker mono"
              aria-hidden="true"
              hidden={
                state.fraction === 0 &&
                progress['progress.topMarker'] === 'hide'
              }
              style={{
                top: `clamp(0px, ${state.fraction * 100}%, calc(100% - 24px))`,
                ...feedbackStyle(progress['motion.digitFeedback'], reduced),
                transitionProperty: 'color, background-color, opacity',
              }}
              data-design-part="marker"
            >
              <span data-design-part="readout">{label}</span>
            </div>
          </div>
        </aside>
      )}
      {sectionsEnabled && (sections.length > 0 || sectionAnchorId) && (
        <nav
          className="section-index mono"
          aria-label="Page sections"
          data-design-node={sectionNodeId}
          id={sectionAnchorId}
          tabIndex={-1}
        >
          <span>Sections</span>
          {sectionLinks()}
        </nav>
      )}
    </>
  );
}

export function SiteFooter({ brand = 'Desan Vasu' }: { brand?: string }) {
  const binding = useDesignBinding('footer');
  const runtime = usePublicDesignRuntime();
  const items = orderedNavigation(
    DEFAULT_NAV.filter((x) => x.href !== '/'),
    binding?.behavior['shell.navOrder'],
    runtime.nodes,
  );
  if (binding?.attributes.hidden) return null;
  return (
    <footer className="site-footer mono" data-design-node="footer">
      <Link className="footer-brand" href="/">
        <strong>DV</strong>
        <span>/</span>
        {brand}
      </Link>
      <nav aria-label="Footer navigation">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href="/search">Search</Link>
        <a href="/feed.xml">RSS</a>
      </nav>
      <span className="footer-note">Considered. Built. Documented.</span>
    </footer>
  );
}

export function PrintButton() {
  return (
    <BoundPrintButton>
      Print profile <Arrow />
    </BoundPrintButton>
  );
}
export function Disclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="record-disclosure">
      <summary>
        {title} <span aria-hidden="true">↓</span>
      </summary>
      {children}
    </details>
  );
}
