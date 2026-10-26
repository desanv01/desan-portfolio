import * as migration_20261026_040655 from './20261026_040655';
import * as migration_20261026_041427_phase3_foundation from './20261026_041427_phase3_foundation';
import * as migration_20261026_041623_phase3_foundation from './20261026_041623_phase3_foundation';

export const migrations = [
  {
    up: migration_20261026_040655.up,
    down: migration_20261026_040655.down,
    name: '20261026_040655',
  },
  {
    up: migration_20261026_041427_phase3_foundation.up,
    down: migration_20261026_041427_phase3_foundation.down,
    name: '20261026_041427_phase3_foundation',
  },
  {
    up: migration_20261026_041623_phase3_foundation.up,
    down: migration_20261026_041623_phase3_foundation.down,
    name: '20261026_041623_phase3_foundation',
  },
];
