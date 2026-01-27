# Build, Lint, and Test Commands

**Note**: Development server is assumed to be running (`pnpm dev`) unless explicitly stated otherwise.

## Development

```bash
# Start development server (frontend + Convex backend)
pnpm dev
```

## Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Linting and Formatting

```bash
# Run ESLint (using TanStack config)
pnpm lint

# Format code with Prettier
pnpm format

# Format and fix linting issues
pnpm check
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
npx vitest watch

# Run a single test file
npx vitest run path/to/test/file.test.ts

# Run tests matching a pattern
npx vitest run --testNamePattern="specific test name"

# Run tests with coverage
npx vitest run --coverage
```

## Database Commands

```bash
# Generate migration files
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Migrate database
pnpm db:migrate

# Pull schema from database
pnpm db:pull

# Open Drizzle Studio
pnpm db:studio
```
