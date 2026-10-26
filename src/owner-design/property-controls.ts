// Generated from the closed presentation schema by tests/owner-design-generate-controls.mjs.
import type { Control } from './control-schema';
export const PROPERTY_CONTROLS: Record<string, Control> = {
  'background.color': {
    kind: 'color',
  },
  'background.gradient': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['none'],
      },
      {
        kind: 'object',
        required: {
          angle: {
            kind: 'number',
            min: -360,
            max: 360,
            integer: false,
          },
          stops: {
            kind: 'array',
            item: {
              kind: 'object',
              required: {
                color: {
                  kind: 'color',
                },
                position: {
                  kind: 'number',
                  min: 0,
                  max: 100,
                  integer: false,
                },
              },
              optional: {},
            },
            min: 2,
            max: 32,
          },
        },
        optional: {},
      },
    ],
  },
  'background.image': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          assetId: {
            kind: 'id',
          },
        },
        optional: {},
      },
      {
        kind: 'choice',
        options: ['none'],
      },
    ],
  },
  'background.position': {
    kind: 'object',
    required: {
      x: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      y: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'background.size': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['cover', 'contain', 'auto'],
      },
      {
        kind: 'object',
        required: {
          width: {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          height: {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
        },
        optional: {},
      },
    ],
  },
  'background.repeat': {
    kind: 'choice',
    options: ['none', 'repeat', 'repeat-x', 'repeat-y'],
  },
  'surface.color': {
    kind: 'color',
  },
  'text.color': {
    kind: 'color',
  },
  'text.mutedColor': {
    kind: 'color',
  },
  'accent.color': {
    kind: 'color',
  },
  'link.color': {
    kind: 'color',
  },
  'border.color': {
    kind: 'color',
  },
  'outline.color': {
    kind: 'color',
  },
  'status.errorColor': {
    kind: 'color',
  },
  'status.successColor': {
    kind: 'color',
  },
  'status.warningColor': {
    kind: 'color',
  },
  'status.infoColor': {
    kind: 'color',
  },
  opacity: {
    kind: 'number',
    min: 0,
    max: 1,
    integer: false,
  },
  'border.width': {
    kind: 'union',
    options: [
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      {
        kind: 'array',
        item: {
          kind: 'union',
          options: [
            {
              kind: 'object',
              required: {
                value: {
                  kind: 'number',
                  min: 0,
                  max: 10000000,
                  integer: false,
                },
                unit: {
                  kind: 'choice',
                  options: [
                    'px',
                    'rem',
                    'em',
                    '%',
                    'vw',
                    'vh',
                    'ch',
                    'dvw',
                    'dvh',
                  ],
                },
              },
              optional: {},
            },
            {
              kind: 'object',
              required: {
                min: {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                preferred: {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                max: {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
              },
              optional: {},
            },
          ],
        },
        min: 1,
        max: 4,
      },
    ],
  },
  'border.style': {
    kind: 'choice',
    options: ['solid', 'dashed', 'dotted', 'double', 'none'],
  },
  'border.radius': {
    kind: 'union',
    options: [
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      {
        kind: 'array',
        item: {
          kind: 'union',
          options: [
            {
              kind: 'object',
              required: {
                value: {
                  kind: 'number',
                  min: 0,
                  max: 10000000,
                  integer: false,
                },
                unit: {
                  kind: 'choice',
                  options: [
                    'px',
                    'rem',
                    'em',
                    '%',
                    'vw',
                    'vh',
                    'ch',
                    'dvw',
                    'dvh',
                  ],
                },
              },
              optional: {},
            },
            {
              kind: 'object',
              required: {
                min: {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                preferred: {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                max: {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
              },
              optional: {},
            },
          ],
        },
        min: 1,
        max: 4,
      },
    ],
  },
  'shadow.layers': {
    kind: 'array',
    item: {
      kind: 'object',
      required: {
        x: {
          kind: 'object',
          required: {
            value: {
              kind: 'number',
              min: -10000000,
              max: 10000000,
              integer: false,
            },
            unit: {
              kind: 'choice',
              options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
            },
          },
          optional: {},
        },
        y: {
          kind: 'object',
          required: {
            value: {
              kind: 'number',
              min: -10000000,
              max: 10000000,
              integer: false,
            },
            unit: {
              kind: 'choice',
              options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
            },
          },
          optional: {},
        },
        blur: {
          kind: 'object',
          required: {
            value: {
              kind: 'number',
              min: 0,
              max: 10000000,
              integer: false,
            },
            unit: {
              kind: 'choice',
              options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
            },
          },
          optional: {},
        },
        spread: {
          kind: 'object',
          required: {
            value: {
              kind: 'number',
              min: -10000000,
              max: 10000000,
              integer: false,
            },
            unit: {
              kind: 'choice',
              options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
            },
          },
          optional: {},
        },
        color: {
          kind: 'color',
        },
        inset: {
          kind: 'boolean',
        },
      },
      optional: {},
    },
    min: 0,
    max: 32,
  },
  'outline.width': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  'outline.offset': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: -10000000,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  'font.family': {
    kind: 'object',
    required: {
      fontId: {
        kind: 'id',
      },
    },
    optional: {},
  },
  'font.size': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  'font.weight': {
    kind: 'number',
    min: 1,
    max: 1000,
    integer: false,
  },
  'font.style': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['normal', 'italic'],
      },
      {
        kind: 'object',
        required: {
          oblique: {
            kind: 'number',
            min: -90,
            max: 90,
            integer: false,
          },
        },
        optional: {},
      },
    ],
  },
  'font.lineHeight': {
    kind: 'union',
    options: [
      {
        kind: 'number',
        min: 0,
        max: 10000000,
        integer: false,
      },
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    ],
  },
  'font.tracking': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['normal'],
      },
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    ],
  },
  'font.wordSpacing': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['normal'],
      },
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    ],
  },
  'font.variableAxes': {
    kind: 'map',
    key: {
      kind: 'id',
    },
    item: {
      kind: 'number',
      min: -10000000,
      max: 10000000,
      integer: false,
    },
    max: 64,
  },
  'font.features': {
    kind: 'map',
    key: {
      kind: 'id',
    },
    item: {
      kind: 'number',
      min: 0,
      max: 65535,
      integer: true,
    },
    max: 128,
  },
  'text.align': {
    kind: 'choice',
    options: ['start', 'center', 'end', 'justify'],
  },
  'text.transform': {
    kind: 'choice',
    options: ['none', 'uppercase', 'lowercase', 'capitalize'],
  },
  'text.decoration': {
    kind: 'object',
    required: {
      line: {
        kind: 'choice',
        options: ['none', 'underline', 'overline', 'line-through'],
      },
      style: {
        kind: 'choice',
        options: ['solid', 'double', 'dotted', 'dashed', 'wavy'],
      },
      color: {
        kind: 'color',
      },
      thickness: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      offset: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'text.measure': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  'text.wrap': {
    kind: 'choice',
    options: ['normal', 'balance', 'pretty', 'nowrap'],
  },
  'text.breaking': {
    kind: 'object',
    required: {
      word: {
        kind: 'choice',
        options: ['normal', 'break-word', 'anywhere'],
      },
      hyphens: {
        kind: 'choice',
        options: ['none', 'manual', 'auto'],
      },
    },
    optional: {},
  },
  'text.truncation': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['none'],
      },
      {
        kind: 'number',
        min: 1,
        max: 100000,
        integer: true,
      },
    ],
  },
  'text.direction': {
    kind: 'choice',
    options: ['inherit', 'ltr', 'rtl', 'auto'],
  },
  width: {
    kind: 'union',
    options: [
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      {
        kind: 'choice',
        options: ['auto'],
      },
    ],
  },
  minWidth: {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  maxWidth: {
    kind: 'union',
    options: [
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      {
        kind: 'choice',
        options: ['none'],
      },
    ],
  },
  height: {
    kind: 'union',
    options: [
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      {
        kind: 'choice',
        options: ['auto'],
      },
    ],
  },
  minHeight: {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  maxHeight: {
    kind: 'union',
    options: [
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      {
        kind: 'choice',
        options: ['none'],
      },
    ],
  },
  margin: {
    kind: 'union',
    options: [
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      {
        kind: 'choice',
        options: ['auto'],
      },
      {
        kind: 'array',
        item: {
          kind: 'union',
          options: [
            {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: -10000000,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: -10000000,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: -10000000,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: -10000000,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            {
              kind: 'choice',
              options: ['auto'],
            },
          ],
        },
        min: 1,
        max: 4,
      },
    ],
  },
  padding: {
    kind: 'union',
    options: [
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      {
        kind: 'array',
        item: {
          kind: 'union',
          options: [
            {
              kind: 'object',
              required: {
                value: {
                  kind: 'number',
                  min: 0,
                  max: 10000000,
                  integer: false,
                },
                unit: {
                  kind: 'choice',
                  options: [
                    'px',
                    'rem',
                    'em',
                    '%',
                    'vw',
                    'vh',
                    'ch',
                    'dvw',
                    'dvh',
                  ],
                },
              },
              optional: {},
            },
            {
              kind: 'object',
              required: {
                min: {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                preferred: {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                max: {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
              },
              optional: {},
            },
          ],
        },
        min: 1,
        max: 4,
      },
    ],
  },
  'gap.row': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  'gap.column': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  density: {
    kind: 'choice',
    options: ['comfortable', 'compact', 'custom'],
  },
  'layout.mode': {
    kind: 'choice',
    options: ['stack', 'row', 'grid', 'split', 'free'],
  },
  'layout.columns': {
    kind: 'array',
    item: {
      kind: 'union',
      options: [
        {
          kind: 'union',
          options: [
            {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            {
              kind: 'choice',
              options: ['auto', 'min-content', 'max-content'],
            },
            {
              kind: 'object',
              required: {
                fr: {
                  kind: 'number',
                  min: 0.000001,
                  max: 10000000,
                  integer: false,
                },
              },
              optional: {},
            },
          ],
        },
        {
          kind: 'object',
          required: {
            min: {
              kind: 'union',
              options: [
                {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                {
                  kind: 'choice',
                  options: ['auto', 'min-content', 'max-content'],
                },
              ],
            },
            max: {
              kind: 'union',
              options: [
                {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                {
                  kind: 'choice',
                  options: ['auto', 'min-content', 'max-content'],
                },
                {
                  kind: 'object',
                  required: {
                    fr: {
                      kind: 'number',
                      min: 0.000001,
                      max: 10000000,
                      integer: false,
                    },
                  },
                  optional: {},
                },
              ],
            },
          },
          optional: {},
        },
      ],
    },
    min: 0,
    max: 128,
  },
  'layout.rows': {
    kind: 'array',
    item: {
      kind: 'union',
      options: [
        {
          kind: 'union',
          options: [
            {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            {
              kind: 'choice',
              options: ['auto', 'min-content', 'max-content'],
            },
            {
              kind: 'object',
              required: {
                fr: {
                  kind: 'number',
                  min: 0.000001,
                  max: 10000000,
                  integer: false,
                },
              },
              optional: {},
            },
          ],
        },
        {
          kind: 'object',
          required: {
            min: {
              kind: 'union',
              options: [
                {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                {
                  kind: 'choice',
                  options: ['auto', 'min-content', 'max-content'],
                },
              ],
            },
            max: {
              kind: 'union',
              options: [
                {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                {
                  kind: 'choice',
                  options: ['auto', 'min-content', 'max-content'],
                },
                {
                  kind: 'object',
                  required: {
                    fr: {
                      kind: 'number',
                      min: 0.000001,
                      max: 10000000,
                      integer: false,
                    },
                  },
                  optional: {},
                },
              ],
            },
          },
          optional: {},
        },
      ],
    },
    min: 0,
    max: 128,
  },
  'layout.columnSpan': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['full'],
      },
      {
        kind: 'number',
        min: 1,
        max: 100000,
        integer: true,
      },
    ],
  },
  'layout.rowSpan': {
    kind: 'number',
    min: 1,
    max: 100000,
    integer: true,
  },
  'layout.gridPlacement': {
    kind: 'object',
    required: {},
    optional: {
      rowStart: {
        kind: 'union',
        options: [
          {
            kind: 'id',
          },
          {
            kind: 'number',
            min: 1,
            max: 100000,
            integer: true,
          },
        ],
      },
      rowEnd: {
        kind: 'union',
        options: [
          {
            kind: 'id',
          },
          {
            kind: 'number',
            min: 1,
            max: 100000,
            integer: true,
          },
        ],
      },
      columnStart: {
        kind: 'union',
        options: [
          {
            kind: 'id',
          },
          {
            kind: 'number',
            min: 1,
            max: 100000,
            integer: true,
          },
        ],
      },
      columnEnd: {
        kind: 'union',
        options: [
          {
            kind: 'id',
          },
          {
            kind: 'number',
            min: 1,
            max: 100000,
            integer: true,
          },
        ],
      },
      area: {
        kind: 'id',
      },
    },
  },
  'layout.areas': {
    kind: 'array',
    item: {
      kind: 'array',
      item: {
        kind: 'union',
        options: [
          {
            kind: 'id',
          },
          {
            kind: 'choice',
            options: ['.'],
          },
        ],
      },
      min: 1,
      max: 128,
    },
    min: 0,
    max: 128,
  },
  'layout.direction': {
    kind: 'choice',
    options: ['row', 'column', 'row-reverse', 'column-reverse'],
  },
  'layout.wrap': {
    kind: 'choice',
    options: ['wrap', 'nowrap'],
  },
  'layout.grow': {
    kind: 'number',
    min: 0,
    max: 10000000,
    integer: false,
  },
  'layout.shrink': {
    kind: 'number',
    min: 0,
    max: 10000000,
    integer: false,
  },
  'layout.basis': {
    kind: 'union',
    options: [
      {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      {
        kind: 'choice',
        options: ['auto'],
      },
    ],
  },
  'layout.alignItems': {
    kind: 'choice',
    options: ['start', 'center', 'end', 'stretch', 'baseline'],
  },
  'layout.justifyContent': {
    kind: 'choice',
    options: [
      'start',
      'center',
      'end',
      'space-between',
      'space-around',
      'space-evenly',
    ],
  },
  'layout.alignSelf': {
    kind: 'choice',
    options: ['inherit', 'start', 'center', 'end', 'stretch', 'baseline'],
  },
  'layout.order': {
    kind: 'number',
    min: -100000,
    max: 100000,
    integer: true,
  },
  visibility: {
    kind: 'boolean',
  },
  'position.mode': {
    kind: 'choice',
    options: ['flow', 'relative', 'absolute', 'sticky', 'fixed'],
  },
  'position.offsets': {
    kind: 'object',
    required: {},
    optional: {
      top: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
        ],
      },
      right: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
        ],
      },
      bottom: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
        ],
      },
      left: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
        ],
      },
    },
  },
  'position.layer': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['auto'],
      },
      {
        kind: 'number',
        min: -100000,
        max: 100000,
        integer: true,
      },
    ],
  },
  'overflow.axes': {
    kind: 'object',
    required: {
      x: {
        kind: 'choice',
        options: ['visible', 'clip', 'hidden', 'auto', 'scroll'],
      },
      y: {
        kind: 'choice',
        options: ['visible', 'clip', 'hidden', 'auto', 'scroll'],
      },
    },
    optional: {},
  },
  transform: {
    kind: 'object',
    required: {},
    optional: {
      translate: {
        kind: 'object',
        required: {
          x: {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          y: {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
        },
        optional: {},
      },
      scale: {
        kind: 'object',
        required: {
          x: {
            kind: 'number',
            min: -1000,
            max: 1000,
            integer: false,
          },
          y: {
            kind: 'number',
            min: -1000,
            max: 1000,
            integer: false,
          },
        },
        optional: {},
      },
      rotate: {
        kind: 'number',
        min: -36000,
        max: 36000,
        integer: false,
      },
      origin: {
        kind: 'object',
        required: {
          x: {
            kind: 'number',
            min: 0,
            max: 100,
            integer: false,
          },
          y: {
            kind: 'number',
            min: 0,
            max: 100,
            integer: false,
          },
        },
        optional: {},
      },
    },
  },
  aspectRatio: {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['auto'],
      },
      {
        kind: 'object',
        required: {
          width: {
            kind: 'number',
            min: 0.000001,
            max: 10000000,
            integer: false,
          },
          height: {
            kind: 'number',
            min: 0.000001,
            max: 10000000,
            integer: false,
          },
        },
        optional: {},
      },
    ],
  },
  'container.behavior': {
    kind: 'choice',
    options: ['bounded', 'full-bleed', 'inset'],
  },
  'section.anchor': {
    kind: 'id',
  },
  'section.numbering': {
    kind: 'object',
    required: {
      mode: {
        kind: 'choice',
        options: ['auto', 'manual', 'hidden'],
      },
    },
    optional: {
      label: {
        kind: 'text',
      },
    },
  },
  'section.divider': {
    kind: 'object',
    required: {
      placement: {
        kind: 'choice',
        options: ['none', 'before', 'after', 'both'],
      },
      length: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      thickness: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      style: {
        kind: 'choice',
        options: ['solid', 'dashed', 'dotted'],
      },
    },
    optional: {},
  },
  'collection.presentation': {
    kind: 'choice',
    options: ['rows', 'cards', 'grid', 'timeline', 'editorial', 'split'],
  },
  'collection.columns': {
    kind: 'array',
    item: {
      kind: 'union',
      options: [
        {
          kind: 'union',
          options: [
            {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            {
              kind: 'choice',
              options: ['auto', 'min-content', 'max-content'],
            },
            {
              kind: 'object',
              required: {
                fr: {
                  kind: 'number',
                  min: 0.000001,
                  max: 10000000,
                  integer: false,
                },
              },
              optional: {},
            },
          ],
        },
        {
          kind: 'object',
          required: {
            min: {
              kind: 'union',
              options: [
                {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                {
                  kind: 'choice',
                  options: ['auto', 'min-content', 'max-content'],
                },
              ],
            },
            max: {
              kind: 'union',
              options: [
                {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                {
                  kind: 'choice',
                  options: ['auto', 'min-content', 'max-content'],
                },
                {
                  kind: 'object',
                  required: {
                    fr: {
                      kind: 'number',
                      min: 0.000001,
                      max: 10000000,
                      integer: false,
                    },
                  },
                  optional: {},
                },
              ],
            },
          },
          optional: {},
        },
      ],
    },
    min: 0,
    max: 128,
  },
  'collection.displayOrder': {
    kind: 'choice',
    options: ['source', 'date-ascending', 'date-descending', 'title'],
  },
  'collection.limit': {
    kind: 'number',
    min: 1,
    max: 100000,
    integer: true,
  },
  'collection.emptyState': {
    kind: 'array',
    item: {
      kind: 'id',
    },
    min: 0,
    max: 2048,
  },
  'shell.logoAsset': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          assetId: {
            kind: 'id',
          },
        },
        optional: {},
      },
      {
        kind: 'choice',
        options: ['none'],
      },
    ],
  },
  'shell.logoSize': {
    kind: 'object',
    required: {
      width: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      height: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'shell.navOrder': {
    kind: 'array',
    item: {
      kind: 'id',
    },
    min: 0,
    max: 2048,
  },
  'shell.navPresentation': {
    kind: 'choice',
    options: ['segmented', 'inline', 'stacked', 'drawer', 'disclosure'],
  },
  'shell.collapseAt': {
    kind: 'id',
  },
  'shell.sticky': {
    kind: 'choice',
    options: ['static', 'sticky', 'fixed', 'auto-hide'],
  },
  'shell.menuPanel': {
    kind: 'object',
    required: {
      edge: {
        kind: 'choice',
        options: ['top', 'bottom', 'left', 'right'],
      },
      width: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
        ],
      },
      height: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
        ],
      },
      backdrop: {
        kind: 'color',
      },
    },
    optional: {},
  },
  'shell.activeIndicator': {
    kind: 'choice',
    options: ['border', 'fill', 'underline', 'marker', 'none'],
  },
  'action.variant': {
    kind: 'choice',
    options: ['fill', 'outline', 'text', 'custom'],
  },
  'action.hitArea': {
    kind: 'object',
    required: {
      minWidth: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      minHeight: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      padding: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'array',
            item: {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            min: 1,
            max: 4,
          },
        ],
      },
    },
    optional: {},
  },
  'action.iconPlacement': {
    kind: 'object',
    required: {
      placement: {
        kind: 'choice',
        options: ['before', 'after', 'none'],
      },
      gap: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      size: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'action.loadingPresentation': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: ['spinner', 'text', 'icon', 'none'],
      },
      position: {
        kind: 'choice',
        options: ['before', 'after', 'replace'],
      },
    },
    optional: {},
  },
  'card.mediaPosition': {
    kind: 'object',
    required: {
      placement: {
        kind: 'choice',
        options: ['before', 'after', 'overlay', 'side'],
      },
      ratio: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['auto'],
          },
          {
            kind: 'object',
            required: {
              width: {
                kind: 'number',
                min: 0.000001,
                max: 10000000,
                integer: false,
              },
              height: {
                kind: 'number',
                min: 0.000001,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
      fit: {
        kind: 'choice',
        options: ['cover', 'contain', 'fill', 'none', 'scale-down'],
      },
    },
    optional: {},
  },
  'card.interactiveArea': {
    kind: 'choice',
    options: ['title', 'whole-card', 'separate-actions'],
  },
  'field.arrangement': {
    kind: 'object',
    required: {
      layout: {
        kind: 'choice',
        options: ['stack', 'inline', 'columns'],
      },
      label: {
        kind: 'choice',
        options: ['before', 'after', 'above'],
      },
    },
    optional: {},
  },
  'field.dimensions': {
    kind: 'object',
    required: {
      height: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
        ],
      },
      padding: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'array',
            item: {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            min: 1,
            max: 4,
          },
        ],
      },
      width: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
        ],
      },
    },
    optional: {},
  },
  'field.placeholderStyle': {
    kind: 'object',
    required: {
      color: {
        kind: 'color',
      },
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
      size: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'field.helpErrorPlacement': {
    kind: 'choice',
    options: ['before', 'after', 'inline', 'icon'],
  },
  'filter.presentation': {
    kind: 'choice',
    options: ['chips', 'select', 'sidebar', 'disclosure', 'drawer'],
  },
  'tag.presentation': {
    kind: 'object',
    required: {
      style: {
        kind: 'choice',
        options: ['fill', 'outline'],
      },
      padding: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'array',
            item: {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            min: 1,
            max: 4,
          },
        ],
      },
      radius: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'icon.source': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          assetId: {
            kind: 'id',
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          iconId: {
            kind: 'id',
          },
        },
        optional: {},
      },
    ],
  },
  'icon.size': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  'icon.stroke': {
    kind: 'object',
    required: {
      width: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      color: {
        kind: 'color',
      },
      linecap: {
        kind: 'choice',
        options: ['butt', 'round', 'square'],
      },
      linejoin: {
        kind: 'choice',
        options: ['miter', 'round', 'bevel'],
      },
    },
    optional: {},
  },
  'icon.accessibleRole': {
    kind: 'choice',
    options: ['decorative', 'labelled'],
  },
  'media.asset': {
    kind: 'object',
    required: {
      assetId: {
        kind: 'id',
      },
    },
    optional: {},
  },
  'media.fit': {
    kind: 'choice',
    options: ['cover', 'contain', 'fill', 'none', 'scale-down'],
  },
  'media.focalPoint': {
    kind: 'object',
    required: {
      x: {
        kind: 'number',
        min: 0,
        max: 100,
        integer: false,
      },
      y: {
        kind: 'number',
        min: 0,
        max: 100,
        integer: false,
      },
    },
    optional: {},
  },
  'media.crop': {
    kind: 'object',
    required: {
      x: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
      y: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
      width: {
        kind: 'number',
        min: 0.000001,
        max: 1,
        integer: false,
      },
      height: {
        kind: 'number',
        min: 0.000001,
        max: 1,
        integer: false,
      },
    },
    optional: {},
  },
  'media.caption': {
    kind: 'object',
    required: {
      visible: {
        kind: 'boolean',
      },
      position: {
        kind: 'choice',
        options: ['before', 'after', 'overlay'],
      },
      measure: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      spacing: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'media.credit': {
    kind: 'object',
    required: {
      visible: {
        kind: 'boolean',
      },
      position: {
        kind: 'choice',
        options: ['before', 'after', 'overlay'],
      },
    },
    optional: {},
  },
  'gallery.arrangement': {
    kind: 'choice',
    options: ['grid', 'row', 'stack', 'masonry', 'carousel'],
  },
  'gallery.spacing': {
    kind: 'object',
    required: {
      columns: {
        kind: 'array',
        item: {
          kind: 'union',
          options: [
            {
              kind: 'union',
              options: [
                {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                {
                  kind: 'choice',
                  options: ['auto', 'min-content', 'max-content'],
                },
                {
                  kind: 'object',
                  required: {
                    fr: {
                      kind: 'number',
                      min: 0.000001,
                      max: 10000000,
                      integer: false,
                    },
                  },
                  optional: {},
                },
              ],
            },
            {
              kind: 'object',
              required: {
                min: {
                  kind: 'union',
                  options: [
                    {
                      kind: 'union',
                      options: [
                        {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        {
                          kind: 'object',
                          required: {
                            min: {
                              kind: 'object',
                              required: {
                                value: {
                                  kind: 'number',
                                  min: 0,
                                  max: 10000000,
                                  integer: false,
                                },
                                unit: {
                                  kind: 'choice',
                                  options: [
                                    'px',
                                    'rem',
                                    'em',
                                    '%',
                                    'vw',
                                    'vh',
                                    'ch',
                                    'dvw',
                                    'dvh',
                                  ],
                                },
                              },
                              optional: {},
                            },
                            preferred: {
                              kind: 'object',
                              required: {
                                value: {
                                  kind: 'number',
                                  min: 0,
                                  max: 10000000,
                                  integer: false,
                                },
                                unit: {
                                  kind: 'choice',
                                  options: [
                                    'px',
                                    'rem',
                                    'em',
                                    '%',
                                    'vw',
                                    'vh',
                                    'ch',
                                    'dvw',
                                    'dvh',
                                  ],
                                },
                              },
                              optional: {},
                            },
                            max: {
                              kind: 'object',
                              required: {
                                value: {
                                  kind: 'number',
                                  min: 0,
                                  max: 10000000,
                                  integer: false,
                                },
                                unit: {
                                  kind: 'choice',
                                  options: [
                                    'px',
                                    'rem',
                                    'em',
                                    '%',
                                    'vw',
                                    'vh',
                                    'ch',
                                    'dvw',
                                    'dvh',
                                  ],
                                },
                              },
                              optional: {},
                            },
                          },
                          optional: {},
                        },
                      ],
                    },
                    {
                      kind: 'choice',
                      options: ['auto', 'min-content', 'max-content'],
                    },
                  ],
                },
                max: {
                  kind: 'union',
                  options: [
                    {
                      kind: 'union',
                      options: [
                        {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        {
                          kind: 'object',
                          required: {
                            min: {
                              kind: 'object',
                              required: {
                                value: {
                                  kind: 'number',
                                  min: 0,
                                  max: 10000000,
                                  integer: false,
                                },
                                unit: {
                                  kind: 'choice',
                                  options: [
                                    'px',
                                    'rem',
                                    'em',
                                    '%',
                                    'vw',
                                    'vh',
                                    'ch',
                                    'dvw',
                                    'dvh',
                                  ],
                                },
                              },
                              optional: {},
                            },
                            preferred: {
                              kind: 'object',
                              required: {
                                value: {
                                  kind: 'number',
                                  min: 0,
                                  max: 10000000,
                                  integer: false,
                                },
                                unit: {
                                  kind: 'choice',
                                  options: [
                                    'px',
                                    'rem',
                                    'em',
                                    '%',
                                    'vw',
                                    'vh',
                                    'ch',
                                    'dvw',
                                    'dvh',
                                  ],
                                },
                              },
                              optional: {},
                            },
                            max: {
                              kind: 'object',
                              required: {
                                value: {
                                  kind: 'number',
                                  min: 0,
                                  max: 10000000,
                                  integer: false,
                                },
                                unit: {
                                  kind: 'choice',
                                  options: [
                                    'px',
                                    'rem',
                                    'em',
                                    '%',
                                    'vw',
                                    'vh',
                                    'ch',
                                    'dvw',
                                    'dvh',
                                  ],
                                },
                              },
                              optional: {},
                            },
                          },
                          optional: {},
                        },
                      ],
                    },
                    {
                      kind: 'choice',
                      options: ['auto', 'min-content', 'max-content'],
                    },
                    {
                      kind: 'object',
                      required: {
                        fr: {
                          kind: 'number',
                          min: 0.000001,
                          max: 10000000,
                          integer: false,
                        },
                      },
                      optional: {},
                    },
                  ],
                },
              },
              optional: {},
            },
          ],
        },
        min: 0,
        max: 128,
      },
      gap: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      ratio: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['auto'],
          },
          {
            kind: 'object',
            required: {
              width: {
                kind: 'number',
                min: 0.000001,
                max: 10000000,
                integer: false,
              },
              height: {
                kind: 'number',
                min: 0.000001,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'gallery.viewer': {
    kind: 'object',
    required: {
      mode: {
        kind: 'choice',
        options: ['inline', 'dialog'],
      },
      backdrop: {
        kind: 'color',
      },
      controls: {
        kind: 'boolean',
      },
    },
    optional: {},
  },
  'pagination.presentation': {
    kind: 'choice',
    options: ['pages', 'previous-next', 'load-more'],
  },
  'appearance.controlStyle': {
    kind: 'choice',
    options: ['menu', 'buttons', 'labelled-icon'],
  },
  'motion.kind': {
    kind: 'choice',
    options: ['fade', 'translate', 'scale', 'rotate', 'reveal', 'none'],
  },
  'motion.duration': {
    kind: 'object',
    required: {
      value: {
        kind: 'number',
        min: 0,
        max: 3600000,
        integer: false,
      },
      unit: {
        kind: 'choice',
        options: ['ms', 's'],
      },
    },
    optional: {},
  },
  'motion.delay': {
    kind: 'object',
    required: {
      value: {
        kind: 'number',
        min: 0,
        max: 3600000,
        integer: false,
      },
      unit: {
        kind: 'choice',
        options: ['ms', 's'],
      },
    },
    optional: {},
  },
  'motion.easing': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
      },
      {
        kind: 'object',
        required: {
          x1: {
            kind: 'number',
            min: 0,
            max: 1,
            integer: false,
          },
          y1: {
            kind: 'number',
            min: -10000000,
            max: 10000000,
            integer: false,
          },
          x2: {
            kind: 'number',
            min: 0,
            max: 1,
            integer: false,
          },
          y2: {
            kind: 'number',
            min: -10000000,
            max: 10000000,
            integer: false,
          },
        },
        optional: {},
      },
    ],
  },
  'motion.intensity': {
    kind: 'object',
    required: {},
    optional: {
      distance: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: -10000000,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      rotate: {
        kind: 'number',
        min: -36000,
        max: 36000,
        integer: false,
      },
      scale: {
        kind: 'number',
        min: 0,
        max: 1000,
        integer: false,
      },
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.trigger': {
    kind: 'choice',
    options: ['hover', 'focus', 'enter', 'scroll', 'toggle'],
  },
  'motion.repeat': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['none', 'loop'],
      },
      {
        kind: 'number',
        min: 0,
        max: 100000,
        integer: true,
      },
    ],
  },
  'motion.reduced': {
    kind: 'choice',
    options: ['off', 'static', 'fade'],
  },
  'motion.primaryFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.inversionFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.headerFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.linkFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.pressFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.panelFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.themeFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.resultFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.statusFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.digitFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.seekFeedback': {
    kind: 'object',
    required: {
      kind: {
        kind: 'choice',
        options: [
          'none',
          'opacity',
          'inversion',
          'backing',
          'brightness',
          'digit',
          'smooth',
        ],
      },
      duration: {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 3600000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['ms', 's'],
          },
        },
        optional: {},
      },
      easing: {
        kind: 'union',
        options: [
          {
            kind: 'choice',
            options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
          },
          {
            kind: 'object',
            required: {
              x1: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y1: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              x2: {
                kind: 'number',
                min: 0,
                max: 1,
                integer: false,
              },
              y2: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
  },
  'motion.interruptReset': {
    kind: 'choice',
    options: ['reverse-current'],
  },
  'motion.reducedPolicy': {
    kind: 'choice',
    options: ['instant', 'static', 'off'],
  },
  'progress.enabled': {
    kind: 'boolean',
  },
  'progress.zeroRange': {
    kind: 'choice',
    options: ['hidden', 'read-only-zero'],
  },
  'progress.format': {
    kind: 'object',
    required: {
      digits: {
        kind: 'number',
        min: 1,
        max: 10,
        integer: true,
      },
      suffix: {
        kind: 'text',
      },
      rounding: {
        kind: 'choice',
        options: ['nearest'],
      },
    },
    optional: {},
  },
  'progress.mapping': {
    kind: 'choice',
    options: ['document-strip', 'normalized'],
  },
  'progress.trackGeometry': {
    kind: 'object',
    required: {
      width: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      height: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
        ],
      },
      inset: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
          {
            kind: 'array',
            item: {
              kind: 'union',
              options: [
                {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: -10000000,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: -10000000,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: -10000000,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: -10000000,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                {
                  kind: 'choice',
                  options: ['auto'],
                },
              ],
            },
            min: 1,
            max: 4,
          },
        ],
      },
    },
    optional: {},
  },
  'progress.minorTicks': {
    kind: 'object',
    required: {
      step: {
        kind: 'number',
        min: 0.000001,
        max: 100,
        integer: false,
      },
      length: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      width: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      color: {
        kind: 'color',
      },
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
    optional: {},
  },
  'progress.majorTicks': {
    kind: 'object',
    required: {
      step: {
        kind: 'number',
        min: 0.000001,
        max: 100,
        integer: false,
      },
      length: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      width: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      color: {
        kind: 'color',
      },
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
    },
    optional: {},
  },
  'progress.labelStyle': {
    kind: 'object',
    required: {
      font: {
        kind: 'object',
        required: {
          fontId: {
            kind: 'id',
          },
        },
        optional: {},
      },
      size: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      tracking: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: -10000000,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      color: {
        kind: 'color',
      },
      placement: {
        kind: 'choice',
        options: ['start', 'end'],
      },
    },
    optional: {},
  },
  'progress.markerStyle': {
    kind: 'object',
    required: {
      thickness: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      color: {
        kind: 'color',
      },
      glow: {
        kind: 'array',
        item: {
          kind: 'object',
          required: {
            x: {
              kind: 'object',
              required: {
                value: {
                  kind: 'number',
                  min: -10000000,
                  max: 10000000,
                  integer: false,
                },
                unit: {
                  kind: 'choice',
                  options: [
                    'px',
                    'rem',
                    'em',
                    '%',
                    'vw',
                    'vh',
                    'ch',
                    'dvw',
                    'dvh',
                  ],
                },
              },
              optional: {},
            },
            y: {
              kind: 'object',
              required: {
                value: {
                  kind: 'number',
                  min: -10000000,
                  max: 10000000,
                  integer: false,
                },
                unit: {
                  kind: 'choice',
                  options: [
                    'px',
                    'rem',
                    'em',
                    '%',
                    'vw',
                    'vh',
                    'ch',
                    'dvw',
                    'dvh',
                  ],
                },
              },
              optional: {},
            },
            blur: {
              kind: 'object',
              required: {
                value: {
                  kind: 'number',
                  min: 0,
                  max: 10000000,
                  integer: false,
                },
                unit: {
                  kind: 'choice',
                  options: [
                    'px',
                    'rem',
                    'em',
                    '%',
                    'vw',
                    'vh',
                    'ch',
                    'dvw',
                    'dvh',
                  ],
                },
              },
              optional: {},
            },
            spread: {
              kind: 'object',
              required: {
                value: {
                  kind: 'number',
                  min: -10000000,
                  max: 10000000,
                  integer: false,
                },
                unit: {
                  kind: 'choice',
                  options: [
                    'px',
                    'rem',
                    'em',
                    '%',
                    'vw',
                    'vh',
                    'ch',
                    'dvw',
                    'dvh',
                  ],
                },
              },
              optional: {},
            },
            color: {
              kind: 'color',
            },
            inset: {
              kind: 'boolean',
            },
          },
          optional: {},
        },
        min: 0,
        max: 8,
      },
      visible: {
        kind: 'boolean',
      },
    },
    optional: {},
  },
  'progress.topMarker': {
    kind: 'choice',
    options: ['show', 'hide'],
  },
  'progress.hitArea': {
    kind: 'object',
    required: {
      width: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      height: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'progress.keyboardSteps': {
    kind: 'object',
    required: {
      arrow: {
        kind: 'number',
        min: 0.000001,
        max: 100,
        integer: false,
      },
      page: {
        kind: 'number',
        min: 0.000001,
        max: 100,
        integer: false,
      },
    },
    optional: {},
  },
  'progress.narrowVariant': {
    kind: 'choice',
    options: ['compact', 'indicator', 'hidden'],
  },
  'sectionNav.entries': {
    kind: 'array',
    item: {
      kind: 'object',
      required: {
        id: {
          kind: 'id',
        },
        targetId: {
          kind: 'id',
        },
      },
      optional: {
        label: {
          kind: 'text',
        },
      },
    },
    min: 0,
    max: 2048,
  },
  'sectionNav.order': {
    kind: 'array',
    item: {
      kind: 'id',
    },
    min: 0,
    max: 2048,
  },
  'sectionNav.position': {
    kind: 'object',
    required: {
      mode: {
        kind: 'choice',
        options: ['fixed', 'sticky', 'flow'],
      },
      inset: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: -10000000,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: -10000000,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'choice',
            options: ['auto'],
          },
          {
            kind: 'array',
            item: {
              kind: 'union',
              options: [
                {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: -10000000,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: -10000000,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: -10000000,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: -10000000,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                {
                  kind: 'choice',
                  options: ['auto'],
                },
              ],
            },
            min: 1,
            max: 4,
          },
        ],
      },
      width: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
    optional: {},
  },
  'sectionNav.backing': {
    kind: 'object',
    required: {
      color: {
        kind: 'color',
      },
      opacity: {
        kind: 'number',
        min: 0,
        max: 1,
        integer: false,
      },
      blur: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      padding: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'array',
            item: {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            min: 1,
            max: 4,
          },
        ],
      },
    },
    optional: {},
  },
  'sectionNav.currentRule': {
    kind: 'object',
    required: {
      offset: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      tie: {
        kind: 'choice',
        options: ['last-crossed'],
      },
    },
    optional: {},
  },
  'sectionNav.seekOffset': {
    kind: 'union',
    options: [
      {
        kind: 'object',
        required: {
          value: {
            kind: 'number',
            min: 0,
            max: 10000000,
            integer: false,
          },
          unit: {
            kind: 'choice',
            options: ['px', 'rem', 'em', '%', 'vw', 'vh', 'ch', 'dvw', 'dvh'],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          min: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          preferred: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          max: {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
        },
        optional: {},
      },
    ],
  },
  'sectionNav.history': {
    kind: 'choice',
    options: ['click-push-scroll-none'],
  },
  'sectionNav.narrow': {
    kind: 'choice',
    options: ['disclosure', 'sheet', 'inline'],
  },
  'skill.presentation': {
    kind: 'choice',
    options: ['grid', 'rows', 'grouped', 'chips'],
  },
  'skill.contextGrouping': {
    kind: 'array',
    item: {
      kind: 'choice',
      options: ['experience', 'education', 'project', 'credential'],
    },
    min: 0,
    max: 4,
  },
  'skill.detailEntry': {
    kind: 'choice',
    options: ['route', 'panel'],
  },
  'record.expansion': {
    kind: 'object',
    required: {
      expanded: {
        kind: 'boolean',
      },
      summaryLength: {
        kind: 'number',
        min: 0,
        max: 100000,
        integer: true,
      },
    },
    optional: {},
  },
  'record.narrowLayout': {
    kind: 'choice',
    options: ['stack', 'metadata-wrap', 'media-sequence'],
  },
  'advanced.blendFilter': {
    kind: 'object',
    required: {},
    optional: {
      blend: {
        kind: 'choice',
        options: [
          'normal',
          'multiply',
          'screen',
          'overlay',
          'darken',
          'lighten',
        ],
      },
      blur: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
      brightness: {
        kind: 'number',
        min: 0,
        max: 100,
        integer: false,
      },
      saturation: {
        kind: 'number',
        min: 0,
        max: 100,
        integer: false,
      },
      backdropBlur: {
        kind: 'union',
        options: [
          {
            kind: 'object',
            required: {
              value: {
                kind: 'number',
                min: 0,
                max: 10000000,
                integer: false,
              },
              unit: {
                kind: 'choice',
                options: [
                  'px',
                  'rem',
                  'em',
                  '%',
                  'vw',
                  'vh',
                  'ch',
                  'dvw',
                  'dvh',
                ],
              },
            },
            optional: {},
          },
          {
            kind: 'object',
            required: {
              min: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              preferred: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              max: {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
            },
            optional: {},
          },
        ],
      },
    },
  },
  'advanced.clipMask': {
    kind: 'union',
    options: [
      {
        kind: 'choice',
        options: ['none'],
      },
      {
        kind: 'object',
        required: {
          shape: {
            kind: 'choice',
            options: ['circle', 'ellipse', 'inset'],
          },
          inset: {
            kind: 'union',
            options: [
              {
                kind: 'union',
                options: [
                  {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  {
                    kind: 'object',
                    required: {
                      min: {
                        kind: 'object',
                        required: {
                          value: {
                            kind: 'number',
                            min: 0,
                            max: 10000000,
                            integer: false,
                          },
                          unit: {
                            kind: 'choice',
                            options: [
                              'px',
                              'rem',
                              'em',
                              '%',
                              'vw',
                              'vh',
                              'ch',
                              'dvw',
                              'dvh',
                            ],
                          },
                        },
                        optional: {},
                      },
                      preferred: {
                        kind: 'object',
                        required: {
                          value: {
                            kind: 'number',
                            min: 0,
                            max: 10000000,
                            integer: false,
                          },
                          unit: {
                            kind: 'choice',
                            options: [
                              'px',
                              'rem',
                              'em',
                              '%',
                              'vw',
                              'vh',
                              'ch',
                              'dvw',
                              'dvh',
                            ],
                          },
                        },
                        optional: {},
                      },
                      max: {
                        kind: 'object',
                        required: {
                          value: {
                            kind: 'number',
                            min: 0,
                            max: 10000000,
                            integer: false,
                          },
                          unit: {
                            kind: 'choice',
                            options: [
                              'px',
                              'rem',
                              'em',
                              '%',
                              'vw',
                              'vh',
                              'ch',
                              'dvw',
                              'dvh',
                            ],
                          },
                        },
                        optional: {},
                      },
                    },
                    optional: {},
                  },
                ],
              },
              {
                kind: 'array',
                item: {
                  kind: 'union',
                  options: [
                    {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    {
                      kind: 'object',
                      required: {
                        min: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        preferred: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                        max: {
                          kind: 'object',
                          required: {
                            value: {
                              kind: 'number',
                              min: 0,
                              max: 10000000,
                              integer: false,
                            },
                            unit: {
                              kind: 'choice',
                              options: [
                                'px',
                                'rem',
                                'em',
                                '%',
                                'vw',
                                'vh',
                                'ch',
                                'dvw',
                                'dvh',
                              ],
                            },
                          },
                          optional: {},
                        },
                      },
                      optional: {},
                    },
                  ],
                },
                min: 1,
                max: 4,
              },
            ],
          },
        },
        optional: {},
      },
      {
        kind: 'object',
        required: {
          assetId: {
            kind: 'id',
          },
        },
        optional: {},
      },
    ],
  },
  'advanced.scrollPresentation': {
    kind: 'object',
    required: {
      margin: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'array',
            item: {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            min: 1,
            max: 4,
          },
        ],
      },
      padding: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'array',
            item: {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            min: 1,
            max: 4,
          },
        ],
      },
      snap: {
        kind: 'choice',
        options: ['none', 'proximity', 'mandatory'],
      },
      behavior: {
        kind: 'choice',
        options: ['auto', 'smooth'],
      },
    },
    optional: {},
  },
  'resume.printPresentation': {
    kind: 'object',
    required: {
      paper: {
        kind: 'choice',
        options: ['a4', 'letter'],
      },
      margins: {
        kind: 'union',
        options: [
          {
            kind: 'union',
            options: [
              {
                kind: 'object',
                required: {
                  value: {
                    kind: 'number',
                    min: 0,
                    max: 10000000,
                    integer: false,
                  },
                  unit: {
                    kind: 'choice',
                    options: [
                      'px',
                      'rem',
                      'em',
                      '%',
                      'vw',
                      'vh',
                      'ch',
                      'dvw',
                      'dvh',
                    ],
                  },
                },
                optional: {},
              },
              {
                kind: 'object',
                required: {
                  min: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  preferred: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                  max: {
                    kind: 'object',
                    required: {
                      value: {
                        kind: 'number',
                        min: 0,
                        max: 10000000,
                        integer: false,
                      },
                      unit: {
                        kind: 'choice',
                        options: [
                          'px',
                          'rem',
                          'em',
                          '%',
                          'vw',
                          'vh',
                          'ch',
                          'dvw',
                          'dvh',
                        ],
                      },
                    },
                    optional: {},
                  },
                },
                optional: {},
              },
            ],
          },
          {
            kind: 'array',
            item: {
              kind: 'union',
              options: [
                {
                  kind: 'object',
                  required: {
                    value: {
                      kind: 'number',
                      min: 0,
                      max: 10000000,
                      integer: false,
                    },
                    unit: {
                      kind: 'choice',
                      options: [
                        'px',
                        'rem',
                        'em',
                        '%',
                        'vw',
                        'vh',
                        'ch',
                        'dvw',
                        'dvh',
                      ],
                    },
                  },
                  optional: {},
                },
                {
                  kind: 'object',
                  required: {
                    min: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    preferred: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                    max: {
                      kind: 'object',
                      required: {
                        value: {
                          kind: 'number',
                          min: 0,
                          max: 10000000,
                          integer: false,
                        },
                        unit: {
                          kind: 'choice',
                          options: [
                            'px',
                            'rem',
                            'em',
                            '%',
                            'vw',
                            'vh',
                            'ch',
                            'dvw',
                            'dvh',
                          ],
                        },
                      },
                      optional: {},
                    },
                  },
                  optional: {},
                },
              ],
            },
            min: 1,
            max: 4,
          },
        ],
      },
    },
    optional: {},
  },
};
