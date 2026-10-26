import { BINDING_REGISTRY } from './runtime-serialize';

export type InventoryBinding = {
  id: string;
  property: string;
  category:
    | 'public-css'
    | 'public-behavior'
    | 'public-structure'
    | 'public-content'
    | 'runtime-invariant'
    | 'owner-control-later'
    | 'explicit-gap';
  binding: string;
};
const rows = [
  {
    id: 'UI-001',
    property: 'background.color',
  },
  {
    id: 'UI-002',
    property: 'background.gradient',
  },
  {
    id: 'UI-003',
    property: 'background.image',
  },
  {
    id: 'UI-004',
    property: 'background.position',
  },
  {
    id: 'UI-005',
    property: 'background.size',
  },
  {
    id: 'UI-006',
    property: 'background.repeat',
  },
  {
    id: 'UI-007',
    property: 'surface.color',
  },
  {
    id: 'UI-008',
    property: 'text.color',
  },
  {
    id: 'UI-009',
    property: 'text.mutedColor',
  },
  {
    id: 'UI-010',
    property: 'accent.color',
  },
  {
    id: 'UI-011',
    property: 'link.color',
  },
  {
    id: 'UI-012',
    property: 'border.color',
  },
  {
    id: 'UI-013',
    property: 'outline.color',
  },
  {
    id: 'UI-014',
    property: 'status.errorColor',
  },
  {
    id: 'UI-015',
    property: 'status.successColor',
  },
  {
    id: 'UI-016',
    property: 'status.warningColor',
  },
  {
    id: 'UI-017',
    property: 'status.infoColor',
  },
  {
    id: 'UI-018',
    property: 'opacity',
  },
  {
    id: 'UI-019',
    property: 'border.width',
  },
  {
    id: 'UI-020',
    property: 'border.style',
  },
  {
    id: 'UI-021',
    property: 'border.radius',
  },
  {
    id: 'UI-022',
    property: 'shadow.layers',
  },
  {
    id: 'UI-023',
    property: 'outline.width',
  },
  {
    id: 'UI-024',
    property: 'outline.offset',
  },
  {
    id: 'UI-025',
    property: 'font.family',
  },
  {
    id: 'UI-026',
    property: 'font.size',
  },
  {
    id: 'UI-027',
    property: 'font.weight',
  },
  {
    id: 'UI-028',
    property: 'font.style',
  },
  {
    id: 'UI-029',
    property: 'font.lineHeight',
  },
  {
    id: 'UI-030',
    property: 'font.tracking',
  },
  {
    id: 'UI-031',
    property: 'font.wordSpacing',
  },
  {
    id: 'UI-032',
    property: 'text.align',
  },
  {
    id: 'UI-033',
    property: 'text.transform',
  },
  {
    id: 'UI-034',
    property: 'text.decoration',
  },
  {
    id: 'UI-035',
    property: 'text.measure',
  },
  {
    id: 'UI-036',
    property: 'text.wrap',
  },
  {
    id: 'UI-037',
    property: 'text.breaking',
  },
  {
    id: 'UI-038',
    property: 'text.truncation',
  },
  {
    id: 'UI-039',
    property: 'text.direction',
  },
  {
    id: 'UI-040',
    property: 'font.variableAxes',
  },
  {
    id: 'UI-041',
    property: 'font.features',
  },
  {
    id: 'UI-042',
    property: 'width',
  },
  {
    id: 'UI-043',
    property: 'minWidth',
  },
  {
    id: 'UI-044',
    property: 'maxWidth',
  },
  {
    id: 'UI-045',
    property: 'height',
  },
  {
    id: 'UI-046',
    property: 'minHeight',
  },
  {
    id: 'UI-047',
    property: 'maxHeight',
  },
  {
    id: 'UI-048',
    property: 'margin',
  },
  {
    id: 'UI-049',
    property: 'padding',
  },
  {
    id: 'UI-050',
    property: 'gap.row',
  },
  {
    id: 'UI-051',
    property: 'gap.column',
  },
  {
    id: 'UI-052',
    property: 'density',
  },
  {
    id: 'UI-053',
    property: 'layout.mode',
  },
  {
    id: 'UI-054',
    property: 'layout.columns',
  },
  {
    id: 'UI-055',
    property: 'layout.rows',
  },
  {
    id: 'UI-056',
    property: 'layout.columnSpan',
  },
  {
    id: 'UI-057',
    property: 'layout.rowSpan',
  },
  {
    id: 'UI-058',
    property: 'layout.gridPlacement',
  },
  {
    id: 'UI-059',
    property: 'layout.areas',
  },
  {
    id: 'UI-060',
    property: 'layout.direction',
  },
  {
    id: 'UI-061',
    property: 'layout.wrap',
  },
  {
    id: 'UI-062',
    property: 'layout.grow',
  },
  {
    id: 'UI-063',
    property: 'layout.shrink',
  },
  {
    id: 'UI-064',
    property: 'layout.basis',
  },
  {
    id: 'UI-065',
    property: 'layout.alignItems',
  },
  {
    id: 'UI-066',
    property: 'layout.justifyContent',
  },
  {
    id: 'UI-067',
    property: 'layout.alignSelf',
  },
  {
    id: 'UI-068',
    property: 'layout.order',
  },
  {
    id: 'UI-069',
    property: 'visibility',
  },
  {
    id: 'UI-070',
    property: 'position.mode',
  },
  {
    id: 'UI-071',
    property: 'position.offsets',
  },
  {
    id: 'UI-072',
    property: 'position.layer',
  },
  {
    id: 'UI-073',
    property: 'overflow.axes',
  },
  {
    id: 'UI-074',
    property: 'transform',
  },
  {
    id: 'UI-075',
    property: 'aspectRatio',
  },
  {
    id: 'UI-076',
    property: 'container.behavior',
  },
  {
    id: 'UI-077',
    property: 'children.add',
  },
  {
    id: 'UI-078',
    property: 'children.remove',
  },
  {
    id: 'UI-079',
    property: 'children.duplicate',
  },
  {
    id: 'UI-080',
    property: 'children.reorder',
  },
  {
    id: 'UI-081',
    property: 'children.nest',
  },
  {
    id: 'UI-082',
    property: 'layout.savedSection',
  },
  {
    id: 'UI-083',
    property: 'section.anchor',
  },
  {
    id: 'UI-084',
    property: 'section.numbering',
  },
  {
    id: 'UI-085',
    property: 'section.divider',
  },
  {
    id: 'UI-086',
    property: 'collection.presentation',
  },
  {
    id: 'UI-087',
    property: 'collection.columns',
  },
  {
    id: 'UI-088',
    property: 'collection.displayOrder',
  },
  {
    id: 'UI-089',
    property: 'collection.limit',
  },
  {
    id: 'UI-090',
    property: 'collection.emptyState',
  },
  {
    id: 'UI-091',
    property: 'shell.arrangement',
  },
  {
    id: 'UI-092',
    property: 'shell.logoAsset',
  },
  {
    id: 'UI-093',
    property: 'shell.logoSize',
  },
  {
    id: 'UI-094',
    property: 'shell.navOrder',
  },
  {
    id: 'UI-095',
    property: 'shell.navPresentation',
  },
  {
    id: 'UI-096',
    property: 'shell.collapseAt',
  },
  {
    id: 'UI-097',
    property: 'shell.sticky',
  },
  {
    id: 'UI-098',
    property: 'shell.menuPanel',
  },
  {
    id: 'UI-099',
    property: 'shell.activeIndicator',
  },
  {
    id: 'UI-100',
    property: 'shell.ruler',
  },
  {
    id: 'UI-101',
    property: 'action.variant',
  },
  {
    id: 'UI-102',
    property: 'action.hitArea',
  },
  {
    id: 'UI-103',
    property: 'action.iconPlacement',
  },
  {
    id: 'UI-104',
    property: 'action.loadingPresentation',
  },
  {
    id: 'UI-105',
    property: 'card.arrangement',
  },
  {
    id: 'UI-106',
    property: 'card.mediaPosition',
  },
  {
    id: 'UI-107',
    property: 'card.interactiveArea',
  },
  {
    id: 'UI-108',
    property: 'field.arrangement',
  },
  {
    id: 'UI-109',
    property: 'field.dimensions',
  },
  {
    id: 'UI-110',
    property: 'field.placeholderStyle',
  },
  {
    id: 'UI-111',
    property: 'field.helpErrorPlacement',
  },
  {
    id: 'UI-112',
    property: 'filter.presentation',
  },
  {
    id: 'UI-113',
    property: 'filter.activeReset',
  },
  {
    id: 'UI-114',
    property: 'tag.presentation',
  },
  {
    id: 'UI-115',
    property: 'icon.source',
  },
  {
    id: 'UI-116',
    property: 'icon.size',
  },
  {
    id: 'UI-117',
    property: 'icon.stroke',
  },
  {
    id: 'UI-118',
    property: 'icon.accessibleRole',
  },
  {
    id: 'UI-119',
    property: 'media.asset',
  },
  {
    id: 'UI-120',
    property: 'media.fit',
  },
  {
    id: 'UI-121',
    property: 'media.focalPoint',
  },
  {
    id: 'UI-122',
    property: 'media.crop',
  },
  {
    id: 'UI-123',
    property: 'media.frame',
  },
  {
    id: 'UI-124',
    property: 'media.caption',
  },
  {
    id: 'UI-125',
    property: 'media.credit',
  },
  {
    id: 'UI-126',
    property: 'media.alt',
  },
  {
    id: 'UI-127',
    property: 'gallery.arrangement',
  },
  {
    id: 'UI-128',
    property: 'gallery.spacing',
  },
  {
    id: 'UI-129',
    property: 'gallery.viewer',
  },
  {
    id: 'UI-130',
    property: 'body.headings',
  },
  {
    id: 'UI-131',
    property: 'body.lists',
  },
  {
    id: 'UI-132',
    property: 'body.quote',
  },
  {
    id: 'UI-133',
    property: 'body.code',
  },
  {
    id: 'UI-134',
    property: 'body.table',
  },
  {
    id: 'UI-135',
    property: 'message.arrangement',
  },
  {
    id: 'UI-136',
    property: 'disclosure.presentation',
  },
  {
    id: 'UI-137',
    property: 'dialog.presentation',
  },
  {
    id: 'UI-138',
    property: 'pagination.presentation',
  },
  {
    id: 'UI-139',
    property: 'appearance.exposedThemes',
  },
  {
    id: 'UI-140',
    property: 'appearance.controlStyle',
  },
  {
    id: 'UI-141',
    property: 'motion.kind',
  },
  {
    id: 'UI-142',
    property: 'motion.duration',
  },
  {
    id: 'UI-143',
    property: 'motion.delay',
  },
  {
    id: 'UI-144',
    property: 'motion.easing',
  },
  {
    id: 'UI-145',
    property: 'motion.intensity',
  },
  {
    id: 'UI-146',
    property: 'motion.trigger',
  },
  {
    id: 'UI-147',
    property: 'motion.repeat',
  },
  {
    id: 'UI-148',
    property: 'motion.reduced',
  },
  {
    id: 'UI-149',
    property: 'theme.name',
  },
  {
    id: 'UI-150',
    property: 'theme.operations',
  },
  {
    id: 'UI-151',
    property: 'theme.modes',
  },
  {
    id: 'UI-152',
    property: 'theme.default',
  },
  {
    id: 'UI-153',
    property: 'theme.importExport',
  },
  {
    id: 'UI-154',
    property: 'font.files',
  },
  {
    id: 'UI-155',
    property: 'font.metadata',
  },
  {
    id: 'UI-156',
    property: 'font.loadingFallback',
  },
  {
    id: 'UI-157',
    property: 'breakpoint.threshold',
  },
  {
    id: 'UI-158',
    property: 'breakpoint.delete',
  },
  {
    id: 'UI-159',
    property: 'override.scope',
  },
  {
    id: 'UI-160',
    property: 'override.breakpoint',
  },
  {
    id: 'UI-161',
    property: 'override.state',
  },
  {
    id: 'UI-162',
    property: 'override.reset',
  },
  {
    id: 'UI-163',
    property: 'advanced.blendFilter',
  },
  {
    id: 'UI-164',
    property: 'advanced.clipMask',
  },
  {
    id: 'UI-165',
    property: 'advanced.scrollPresentation',
  },
  {
    id: 'UI-166',
    property: 'advanced.unmapped',
  },
  {
    id: 'UI-167',
    property: 'resume.printPresentation',
  },
  {
    id: 'UI2-001',
    property: 'progress.enabled',
  },
  {
    id: 'UI2-002',
    property: 'progress.rangeSource',
  },
  {
    id: 'UI2-003',
    property: 'progress.zeroRange',
  },
  {
    id: 'UI2-004',
    property: 'progress.format',
  },
  {
    id: 'UI2-005',
    property: 'progress.mapping',
  },
  {
    id: 'UI2-006',
    property: 'progress.trackGeometry',
  },
  {
    id: 'UI2-007',
    property: 'progress.minorTicks',
  },
  {
    id: 'UI2-008',
    property: 'progress.majorTicks',
  },
  {
    id: 'UI2-009',
    property: 'progress.labelStyle',
  },
  {
    id: 'UI2-010',
    property: 'progress.markerStyle',
  },
  {
    id: 'UI2-011',
    property: 'progress.topMarker',
  },
  {
    id: 'UI2-012',
    property: 'progress.hitArea',
  },
  {
    id: 'UI2-013',
    property: 'progress.pointerSeek',
  },
  {
    id: 'UI2-014',
    property: 'progress.keyboardSteps',
  },
  {
    id: 'UI2-015',
    property: 'progress.accessibility',
  },
  {
    id: 'UI2-016',
    property: 'progress.recalculate',
  },
  {
    id: 'UI2-017',
    property: 'progress.narrowVariant',
  },
  {
    id: 'UI2-018',
    property: 'sectionNav.entries',
  },
  {
    id: 'UI2-019',
    property: 'sectionNav.order',
  },
  {
    id: 'UI2-020',
    property: 'sectionNav.position',
  },
  {
    id: 'UI2-021',
    property: 'sectionNav.backing',
  },
  {
    id: 'UI2-022',
    property: 'sectionNav.currentRule',
  },
  {
    id: 'UI2-023',
    property: 'sectionNav.currentStyle',
  },
  {
    id: 'UI2-024',
    property: 'sectionNav.seekOffset',
  },
  {
    id: 'UI2-025',
    property: 'sectionNav.history',
  },
  {
    id: 'UI2-026',
    property: 'sectionNav.narrow',
  },
  {
    id: 'UI2-027',
    property: 'motion.primaryFeedback',
  },
  {
    id: 'UI2-028',
    property: 'motion.inversionFeedback',
  },
  {
    id: 'UI2-029',
    property: 'motion.focusFeedback',
  },
  {
    id: 'UI2-030',
    property: 'motion.pressFeedback',
  },
  {
    id: 'UI2-031',
    property: 'motion.panelFeedback',
  },
  {
    id: 'UI2-032',
    property: 'motion.themeFeedback',
  },
  {
    id: 'UI2-033',
    property: 'motion.resultFeedback',
  },
  {
    id: 'UI2-034',
    property: 'motion.statusFeedback',
  },
  {
    id: 'UI2-035',
    property: 'motion.digitFeedback',
  },
  {
    id: 'UI2-036',
    property: 'motion.seekFeedback',
  },
  {
    id: 'UI2-037',
    property: 'motion.interruptReset',
  },
  {
    id: 'UI2-038',
    property: 'motion.reducedPolicy',
  },
  {
    id: 'UI2-039',
    property: 'font.primaryRecipe',
  },
  {
    id: 'UI2-040',
    property: 'font.exactFiles',
  },
  {
    id: 'UI2-041',
    property: 'font.syneWeight',
  },
  {
    id: 'UI2-042',
    property: 'font.frauncesAxes',
  },
  {
    id: 'UI2-043',
    property: 'font.bodyNormal',
  },
  {
    id: 'UI2-044',
    property: 'font.plexFace',
  },
  {
    id: 'UI2-045',
    property: 'font.scriptFallback',
  },
  {
    id: 'UI2-046',
    property: 'font.webFormatState',
  },
  {
    id: 'UI2-047',
    property: 'skill.canonicalName',
  },
  {
    id: 'UI2-048',
    property: 'skill.aliases',
  },
  {
    id: 'UI2-049',
    property: 'skill.categoryOrder',
  },
  {
    id: 'UI2-050',
    property: 'skill.searchFilter',
  },
  {
    id: 'UI2-051',
    property: 'skill.presentation',
  },
  {
    id: 'UI2-052',
    property: 'skill.contextGrouping',
  },
  {
    id: 'UI2-053',
    property: 'skill.countLabel',
  },
  {
    id: 'UI2-054',
    property: 'skill.detailEntry',
  },
  {
    id: 'UI2-055',
    property: 'association.skillIdentity',
  },
  {
    id: 'UI2-056',
    property: 'association.target',
  },
  {
    id: 'UI2-057',
    property: 'association.kind',
  },
  {
    id: 'UI2-058',
    property: 'association.contextNote',
  },
  {
    id: 'UI2-059',
    property: 'association.provenance',
  },
  {
    id: 'UI2-060',
    property: 'association.visibility',
  },
  {
    id: 'UI2-061',
    property: 'association.duplicateReview',
  },
  {
    id: 'UI2-062',
    property: 'association.reciprocalPreview',
  },
  {
    id: 'UI2-063',
    property: 'association.remove',
  },
  {
    id: 'UI2-064',
    property: 'skill.mergeArchive',
  },
  {
    id: 'UI2-065',
    property: 'experience.identity',
  },
  {
    id: 'UI2-066',
    property: 'experience.datePrecision',
  },
  {
    id: 'UI2-067',
    property: 'experience.location',
  },
  {
    id: 'UI2-068',
    property: 'experience.richDescription',
  },
  {
    id: 'UI2-069',
    property: 'experience.relatedContext',
  },
  {
    id: 'UI2-070',
    property: 'experience.groupDuration',
  },
  {
    id: 'UI2-071',
    property: 'record.expansion',
  },
  {
    id: 'UI2-072',
    property: 'education.identity',
  },
  {
    id: 'UI2-073',
    property: 'education.dateStatus',
  },
  {
    id: 'UI2-074',
    property: 'education.gradeVisibility',
  },
  {
    id: 'UI2-075',
    property: 'education.activityCoursework',
  },
  {
    id: 'UI2-076',
    property: 'education.description',
  },
  {
    id: 'UI2-077',
    property: 'education.relatedContext',
  },
  {
    id: 'UI2-078',
    property: 'record.mediaEvidence',
  },
  {
    id: 'UI2-079',
    property: 'record.orderVisibilityReview',
  },
  {
    id: 'UI2-080',
    property: 'catalog.credentials',
  },
  {
    id: 'UI2-081',
    property: 'catalog.courses',
  },
  {
    id: 'UI2-082',
    property: 'catalog.awards',
  },
  {
    id: 'UI2-083',
    property: 'catalog.volunteering',
  },
  {
    id: 'UI2-084',
    property: 'catalog.publications',
  },
  {
    id: 'UI2-085',
    property: 'catalog.patents',
  },
  {
    id: 'UI2-086',
    property: 'catalog.testScores',
  },
  {
    id: 'UI2-087',
    property: 'catalog.languages',
  },
  {
    id: 'UI2-088',
    property: 'catalog.organizationCause',
  },
  {
    id: 'UI2-089',
    property: 'catalog.careerBreak',
  },
  {
    id: 'UI2-090',
    property: 'catalog.services',
  },
  {
    id: 'UI2-091',
    property: 'featured.selection',
  },
  {
    id: 'UI2-092',
    property: 'testimonial.permission',
  },
  {
    id: 'UI2-093',
    property: 'platform.actionTreatment',
  },
  {
    id: 'UI2-094',
    property: 'record.narrowLayout',
  },
  {
    id: 'UI2-095',
    property: 'association.evidenceMeaning',
  },
  {
    id: 'UI2-096',
    property: 'record.contributors',
  },
] as const;

const structural: Record<string, string> = {
  'shell.ruler': 'revision-3 functional progress node geometry/ticks/readout',
  'appearance.exposedThemes':
    'published visitorThemeIds + allowed theme selection',
  'theme.name': 'stable named themes exposed in visitor selection',
  'theme.modes': 'theme base/light/dark scope selection',
  'theme.default': 'published defaultThemeId/defaultMode',
  'font.exactFiles':
    'immutable published font ID/version/checksum; never private file paths',
  'font.syneWeight': 'font.weight/font.variableAxes on display role',
  'font.frauncesAxes': 'font.variableAxes on emphasis role',
  'font.bodyNormal': 'font.weight/font.size on body role',
  'font.plexFace': 'font.family/font.weight on mono role',
  'font.scriptFallback': 'validated font manifest fallback chain',
  'font.loadingFallback':
    'safe generated font families, font-display swap and fallback chain',
  'shell.arrangement': 'sharedShell roots + node.children',
  'card.arrangement': 'node.children + shared component scopes',
  'message.arrangement': 'node.children + shared component scopes',
  'layout.savedSection': 'pinned design templates/nodes',
  'body.headings': 'heading shared component roles',
  'body.lists': 'rich-text component roles and content block renderer',
  'body.quote': 'rich-text component roles',
  'body.code': 'code shared component roles',
  'body.table': 'table shared component roles',
  'media.frame': 'media aspectRatio/border/padding/background properties',
  'filter.activeReset': 'selected state/action component scopes',
  'disclosure.presentation': 'disclosure node properties + expanded state',
  'dialog.presentation': 'dialog node properties + viewer behavior',
  'sectionNav.currentStyle':
    'selected state + shared component type/color/border',
  'motion.focusFeedback': 'focus-visible outline properties',
};
const invariant: Record<string, string> = {
  'progress.rangeSource': 'documentProgress current document geometry',
  'progress.pointerSeek': 'seekFraction + pointer capture in DOM',
  'progress.accessibility': 'labelled range/aria-current value in DOM',
  'progress.recalculate': 'resize/font/media/content DOM measurements',
};
const contentPrefixes = [
  'association.',
  'catalog.',
  'education.',
  'experience.',
  'testimonial.',
  'featured.',
  'platform.',
];
const contentKeys = new Set([
  'media.alt',
  'skill.canonicalName',
  'skill.aliases',
  'skill.categoryOrder',
  'skill.searchFilter',
  'skill.countLabel',
  'record.mediaEvidence',
  'record.orderVisibilityReview',
  'record.contributors',
]);
export const INVENTORY_BINDINGS: InventoryBinding[] = rows.map(
  ({ id, property }) => {
    if (property === 'advanced.unmapped')
      return {
        id,
        property,
        category: 'explicit-gap',
        binding:
          'Unsupported browser/selector capability requires reviewed schema + renderer addition',
      };
    if (Object.hasOwn(BINDING_REGISTRY, property))
      return {
        id,
        property,
        category: BINDING_REGISTRY[property].css
          ? 'public-css'
          : 'public-behavior',
        binding: property,
      };
    if (Object.hasOwn(structural, property))
      return {
        id,
        property,
        category: 'public-structure',
        binding: structural[property],
      };
    if (Object.hasOwn(invariant, property))
      return {
        id,
        property,
        category: 'runtime-invariant',
        binding: invariant[property],
      };
    if (
      contentKeys.has(property) ||
      contentPrefixes.some((prefix) => property.startsWith(prefix))
    )
      return {
        id,
        property,
        category: 'public-content',
        binding:
          'Selected publication graph; presentation cannot modify eligibility/authorization',
      };
    return {
      id,
      property,
      category: 'owner-control-later',
      binding:
        'Phase 5 authoring/lifecycle control over versioned design/content data; no editor UI claimed',
    };
  },
);
