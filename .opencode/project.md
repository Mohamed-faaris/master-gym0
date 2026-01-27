# Master Gym Project Guidelines

This document provides comprehensive guidelines for coding agents working on the Master Gym project. It includes code style guidelines, and project-specific conventions.

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode**: All TypeScript strict checks enabled
- **Target**: ES2022
- **JSX**: react-jsx
- **Module resolution**: bundler mode
- **Path aliases**: `@/` maps to `./src/*`
- **Unused variables**: Not allowed (`noUnusedLocals`, `noUnusedParameters`)
- **Side effect imports**: Must be checked (`noUncheckedSideEffectImports`)

### Formatting (Prettier)

```javascript
{
  semi: false,
  singleQuote: true,
  trailingComma: 'all'
}
```

### Linting (ESLint)

- Uses `@tanstack/eslint-config`
- Ignores: `.output/**`, `convex/_generated/**`, `dist/**`, `build/**`, `node_modules/**`

### Import Conventions

```typescript
// Group imports by type, with empty lines between groups
import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { cn } from '@/lib/utils'
import type { User } from '@/types'
```

### Naming Conventions

- **Files**: kebab-case for components/routes (e.g., `user-dashboard.tsx`)
- **Components**: PascalCase (e.g., `UserDashboard`)
- **Functions/Variables**: camelCase (e.g., `handleSubmit`, `userData`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`, `WorkoutLog`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_WORKOUT_DURATION`)
- **Database tables**: camelCase plural (e.g., `users`, `workoutLogs`)

### React Component Patterns

#### File Route Components

Use TanStack Router's file-based routing pattern. Each route file exports a `Route` object with a component.

#### Component Structure

Follow consistent component structure with proper TypeScript interfaces, className merging using the `cn()` utility, and proper prop forwarding.

### Database Schema Patterns

#### Convex Schema Structure

```typescript
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const ROLES = [
  'trainer',
  'trainerManagedCustomer',
  'selfManagedCustomer',
  'admin',
] as const
const WORKOUT_TYPES = ['cardio', 'strength', 'flexibility', 'balance'] as const

function enumToValidator<T extends ReadonlyArray<string>>(values: T) {
  return v.union(...values.map(v.literal))
}

const users = defineTable({
  name: v.string(),
  phoneNumber: v.string(),
  role: enumToValidator(ROLES),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_phone', ['phoneNumber'])
  .index('by_phone_pin', ['phoneNumber', 'pin'])
```

#### Schema Conventions

- **Table names**: camelCase plural (e.g., `workoutLogs`, `trainingPlans`)
- **Field names**: camelCase (e.g., `phoneNumber`, `emergencyContactName`)
- **Required fields**: Use `v.string()`, optional with `v.optional(v.string())`
- **Foreign keys**: Use `v.id('tableName')` for references
- **Enums**: Define as const arrays, create validators with `enumToValidator`
- **Indexes**: Add for frequently queried fields
- **Timestamps**: Always include `createdAt` and `updatedAt` as `v.number()`

### Validation with Zod

Use Zod for runtime type validation and form validation. Define schemas for data structures and use them for both client and server-side validation.

### Error Handling

Implement proper error boundaries for React components and handle async operations with try-catch blocks. Validate API responses and handle errors gracefully in the UI.

### Security Considerations

- **PIN storage**: Stored as plain text (explicitly insecure by design)
- **Input validation**: Always validate on both client and server
- **Environment variables**: Use `@t3-oss/env-core` for validation
- **No secrets in code**: Never commit API keys or sensitive data

### Performance Guidelines

- **Bundle splitting**: Leverage TanStack Router's automatic code splitting
- **Image optimization**: Use appropriate formats and sizes
- **Database queries**: Use proper indexes and pagination
- **React optimization**: Use `React.memo`, `useMemo`, `useCallback` appropriately
- **Convex queries**: Keep queries focused and indexed

## Cursor Rules (from .cursorrules)

### Schemas

When designing the schema, refer to Convex documentation for built-in System fields and data types: https://docs.convex.dev/database/types

Common mistakes to avoid:

- Incorrect use of `v` validator builder
- Missing system fields (\_id, \_creationTime are automatic)
- Improper index definitions

### Example Schema Pattern

See `convex/schema.ts` for comprehensive examples of well-structured schemas with proper validators, indexes, and relationships.

### shadcn/ui Components

Install new components using:

```bash
pnpm dlx shadcn@latest add button
```

## Project Structure

```
├── convex/           # Backend functions and schema
├── src/
│   ├── components/   # Reusable UI components
│   ├── routes/       # File-based routing (TanStack Router)
│   ├── lib/          # Utilities and helpers
│   ├── styles.css    # Global styles and CSS variables
│   └── env.ts        # Environment variable validation
├── docs/             # Documentation
├── public/           # Static assets
└── package.json      # Dependencies and scripts
```

## Development Workflow

1. **Start development**: `pnpm dev`
2. **Make changes**: Edit files in `src/` or `convex/`
3. **Test changes**: `pnpm test` or run specific tests
4. **Check code quality**: `pnpm check`
5. **Database changes**: Update schema, then `pnpm db:push`
6. **Build for production**: `pnpm build`

This document should be updated as the project evolves. Always refer to existing code patterns and maintain consistency with the established conventions.

## Examples

See `.opencode/convex-examples.md` for practical code examples including Convex queries/mutations, React Query integration, component patterns, and validation examples.
