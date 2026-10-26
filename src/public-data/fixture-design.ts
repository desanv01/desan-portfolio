import { createCopperDesign } from '../design/runtime-defaults';
import { assertValidDesign, type DesignDocument } from '../design/model';

type Resource = {
  id: string | number;
  resourceVersion: string;
  sha256: string;
};
export function createSyntheticFixtureDesign({
  visuals,
  font,
  projectId,
  alternate = false,
}: {
  visuals: Resource[];
  font: Resource;
  projectId: string | number;
  alternate?: boolean;
}): { design: DesignDocument; expectations: Record<string, unknown> } {
  const design = createCopperDesign();
  design.assets = visuals.map((media) => ({
    id: String(media.id),
    version: media.resourceVersion,
    sha256: media.sha256,
    kind: 'image',
    rights: {
      license: 'CC0',
      attribution: 'Synthetic local engineering fixture',
      redistributable: true,
    },
  }));
  design.fonts = [
    {
      id: String(font.id),
      version: font.resourceVersion,
      sha256: font.sha256,
      rights: {
        license: 'SIL OFL 1.1',
        attribution: 'ABeeZee authors',
        redistributable: true,
      },
      family: 'ABeeZee',
      style: 'normal',
      weight: { min: 400, max: 400 },
      axes: [],
      fallbacks: ['sans-serif'],
    },
  ];
  const expectations: Record<string, unknown> = {
    variant: alternate ? 'alternate' : 'copper',
    publishedFontId: String(font.id),
    publicFontURL: `/api/public/media/${font.id}`,
    noRuntimeVerificationClaim: true,
  };
  if (alternate) {
    const purple = '#713DA8';
    design.defaultMode = 'light';
    design.defaultThemeId = 'synthetic-violet';
    design.visitorThemeIds = ['copper', 'synthetic-violet'];
    design.themes.push({
      id: 'synthetic-violet',
      name: 'Synthetic violet',
      modes: {
        base: {
          values: {
            'accent.color': purple,
            'link.color': purple,
            'outline.color': purple,
          },
        },
        light: {
          values: {
            'background.color': '#F5F1FA',
            'surface.color': '#FFFFFF',
            'text.color': '#251635',
            'text.mutedColor': '#62536C',
            'border.color': '#907BA1',
            'accent.color': purple,
            'link.color': purple,
            'outline.color': purple,
          },
        },
        dark: {
          values: {
            'background.color': '#1B1424',
            'surface.color': '#2B2036',
            'text.color': '#F6EFFB',
            'text.mutedColor': '#C5B6D1',
            'border.color': '#9E87AF',
            'accent.color': '#CBA3F0',
            'link.color': '#CBA3F0',
            'outline.color': '#CBA3F0',
          },
        },
      },
    });
    design.defaults.values['font.family'] = { fontId: String(font.id) };
    design.defaults.values['icon.size'] = { value: 24, unit: 'px' };
    design.defaults.states = [
      {
        when: ['focus-visible'],
        values: {
          'outline.width': { value: 5, unit: 'px' },
          'outline.offset': { value: 8, unit: 'px' },
          'outline.color': purple,
        },
      },
    ];
    const title = design.sharedComponents.find(
      (item) => item.id === 'work.title',
    );
    if (title)
      title.scope.values = {
        'font.family': { fontId: String(font.id) },
        'font.size': { value: 72, unit: 'px' },
        'text.color': purple,
      };
    const grid = design.sharedComponents.find(
      (item) => item.id === 'work.grid',
    );
    if (grid)
      grid.scope.values = {
        'layout.mode': 'grid',
        'layout.columns': [{ fr: 1 }],
        'gap.row': { value: 48, unit: 'px' },
        'gap.column': { value: 48, unit: 'px' },
      };
    for (const component of design.sharedComponents) {
      if (component.id.endsWith('.card'))
        component.scope.values['border.radius'] = { value: 28, unit: 'px' };
      if (component.id.endsWith('.media'))
        component.scope.values['media.fit'] = 'contain';
    }
    const headingNodeId = 'synthetic.selected-heading';
    const recordNodeId = 'synthetic.selected-card';
    design.nodes.push({
      id: headingNodeId,
      kind: 'heading',
      contentRef: { collection: 'projects', id: String(projectId) },
      children: [],
      scope: {
        values: {
          'font.size': { value: 36, unit: 'px' },
          'text.color': purple,
          padding: { value: 24, unit: 'px' },
          'section.anchor': 'synthetic-selected-heading',
        },
      },
    });
    design.nodes.push({
      id: recordNodeId,
      kind: 'card',
      componentId: 'work.card',
      contentRef: { collection: 'projects', id: String(projectId) },
      children: [],
      scope: {
        values: {
          'border.radius': { value: 36, unit: 'px' },
          'border.width': { value: 3, unit: 'px' },
          'border.color': purple,
          'border.style': 'solid',
          padding: { value: 20, unit: 'px' },
          'section.anchor': 'synthetic-selected-card',
        },
      },
    });
    const home = design.pages.find((page) => page.id === 'home');
    if (home)
      home.rootIds = [
        'home.work',
        'home.hero',
        ...home.rootIds.filter(
          (id) => !['home.work', 'home.hero'].includes(id),
        ),
      ];
    const work = design.pages.find((page) => page.id === 'work');
    if (work)
      work.rootIds = [headingNodeId, 'work.library', recordNodeId, 'work.hero'];
    const progress = design.nodes.find((node) => node.id === 'progress');
    if (progress)
      progress.scope.values['progress.keyboardSteps'] = { arrow: 2, page: 20 };
    for (const page of design.pages) {
      page.scope.values['sectionNav.entries'] = page.rootIds.map(
        (targetId, index) => ({
          id: `${page.id}-section-${index}`,
          targetId,
          label: `Synthetic ${targetId.split('.').at(-1)?.replaceAll('-', ' ')}`,
        }),
      );
      page.scope.values['sectionNav.order'] = page.rootIds.map(
        (_target, index) => `${page.id}-section-${index}`,
      );
    }
    Object.assign(expectations, {
      defaultThemeId: design.defaultThemeId,
      visitorThemeIds: design.visitorThemeIds,
      mode: 'light',
      background: '#F5F1FA',
      textColor: '#251635',
      accent: purple,
      fontFamily: 'ABeeZee',
      cssFontFamily: `design-font-${[...String(font.id)].map((character) => character.codePointAt(0)!.toString(16)).join('-')}`,
      h1SizePx: 72,
      workColumns: 1,
      cardRadiusPx: 28,
      perRecordRadiusPx: 36,
      perRecordBorderPx: 3,
      recordId: String(projectId),
      recordNodeId,
      headingNodeId,
      mediaFit: 'contain',
      iconSizePx: 24,
      focusWidthPx: 5,
      focusOffsetPx: 8,
      progressArrowPercent: 2,
      progressPagePercent: 20,
      homeRootOrder: home?.rootIds,
      workRootOrder: work?.rootIds,
      workSectionLabels: work?.scope.values['sectionNav.entries'],
      newVisitorOrExplicitThemeSelectionRequired: true,
    });
  }
  return { design: assertValidDesign(design), expectations };
}
