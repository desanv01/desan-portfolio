import {
  assertValidDesign,
  createEmptyDesign,
  type DesignDocument,
  type NodeKind,
} from './model';

export const PUBLIC_PAGE_IDS = [
  'home',
  'work',
  'case-study',
  'profile',
  'journal',
  'article',
  'contact',
  'resume',
  'search',
  'not-found',
] as const;
export const PUBLIC_ROLE_KINDS = {
  hero: 'section',
  title: 'heading',
  subtitle: 'text',
  'primary-action': 'link',
  'secondary-action': 'link',
  section: 'section',
  grid: 'grid',
  card: 'card',
  media: 'media',
  text: 'text',
  meta: 'metadata',
  filter: 'container',
  input: 'field',
  tabs: 'navigation',
  record: 'record',
  skill: 'skill',
  article: 'rich-text',
  empty: 'message',
  pagination: 'pagination',
} as const satisfies Record<string, NodeKind>;
export const BUILTIN_FONT_ALIASES = {
  display: '"Syne", sans-serif',
  body: '"Source Sans 3", sans-serif',
  accent: '"Fraunces", serif',
  mono: '"IBM Plex Mono", monospace',
} as const;
export const PUBLIC_PAGE_SECTIONS: Record<
  (typeof PUBLIC_PAGE_IDS)[number],
  string[]
> = {
  home: ['hero', 'work', 'profile', 'journal', 'contact'],
  work: ['hero', 'library'],
  'case-study': ['hero', 'body', 'related'],
  profile: ['hero', 'experience', 'education', 'skills', 'professional'],
  journal: ['hero', 'library'],
  article: ['hero', 'body', 'related'],
  contact: ['hero', 'links'],
  resume: ['hero', 'body'],
  search: ['hero', 'results'],
  'not-found': ['hero'],
};

/** Presentation-only starter; no biography, claims, media, public URL or fabricated content. */
export function createCopperDesign(): DesignDocument {
  const data = createEmptyDesign('copper-public-baseline');
  data.defaultThemeId = 'copper';
  data.defaultMode = 'dark';
  data.visitorThemeIds = ['copper'];
  data.themes = [
    {
      id: 'copper',
      name: 'Copper',
      modes: {
        base: {
          values: {
            'accent.color': '#D8A16B',
            'link.color': '#D8A16B',
            'outline.color': '#D8A16B',
          },
        },
        dark: {
          values: {
            'background.color': '#121316',
            'surface.color': '#1B1D21',
            'text.color': '#F2F1EE',
            'text.mutedColor': '#A5A5A5',
            'border.color': '#45484E',
          },
        },
        light: {
          values: {
            'background.color': '#F4F1EB',
            'surface.color': '#FFFFFF',
            'text.color': '#1C1D20',
            'text.mutedColor': '#5C5954',
            'border.color': '#78736B',
            'accent.color': '#805023',
            'link.color': '#805023',
            'outline.color': '#805023',
          },
        },
      },
    },
  ];
  data.breakpoints = [
    { id: 'tablet', minWidth: 768 },
    { id: 'desktop', minWidth: 1024 },
    { id: 'wide', minWidth: 1600 },
  ];
  // Defaults that should inherit everywhere; no page width/spacing is forced onto every child.
  data.defaults = {
    values: {
      'motion.duration': { value: 150, unit: 'ms' },
      'motion.easing': 'ease',
      'motion.reducedPolicy': 'instant',
    },
  };
  for (const pageId of PUBLIC_PAGE_IDS) {
    const roots: string[] = [];
    for (const [role, kind] of Object.entries(PUBLIC_ROLE_KINDS)) {
      const id = `${pageId}.${role}`;
      data.sharedComponents.push({ id, kind, scope: { values: {} } });
    }
    for (const section of PUBLIC_PAGE_SECTIONS[pageId]) {
      const id = `${pageId}.${section}`;
      data.nodes.push({
        id,
        kind: 'section',
        ...(section === 'hero' ? { componentId: id } : {}),
        children: [],
        scope: { values: {} },
      });
      roots.push(id);
    }
    data.pages.push({ id: pageId, scope: { values: {} }, rootIds: roots });
  }
  for (const [id, kind] of [
    ['header', 'header'],
    ['footer', 'footer'],
    ['progress', 'progress'],
    ['section-nav', 'section-navigation'],
  ] as [string, NodeKind][]) {
    data.nodes.push({ id, kind, children: [], scope: { values: {} } });
  }
  data.sharedComponents.push(
    { id: 'nav-link', kind: 'link', scope: { values: {} } },
    { id: 'theme-toggle', kind: 'button', scope: { values: {} } },
  );
  data.sharedShell = {
    header: ['header'],
    footer: ['footer'],
    navigation: ['progress', 'section-nav'],
  };
  data.templates = [
    { id: 'case-study', scope: { values: {} }, rootIds: [] },
    { id: 'article', scope: { values: {} }, rootIds: [] },
  ];
  data.pages.forEach((page) => {
    if (['case-study', 'article'].includes(page.id)) page.templateId = page.id;
  });
  return assertValidDesign(data);
}
