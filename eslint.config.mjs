import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ['src/cms/migrations/*.ts'],
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
  globalIgnores(['.next/**', 'next-env.d.ts']),
]);
