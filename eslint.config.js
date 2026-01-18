//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      '.output/**',
      'convex/_generated/**',
      'dist/**',
      'build/**',
      'node_modules/**',
    ],
  },
]
