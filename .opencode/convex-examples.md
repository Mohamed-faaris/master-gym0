# Convex Examples

This file contains practical examples for working with Convex in the Master Gym project.

## Convex Queries/Mutations

### Query Example

```typescript
export const getUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})
```

### Mutation Example

```typescript
export const updateUser = mutation({
  args: {
    userId: v.id('users'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { name: args.name })
  },
})
```

## React Query Integration

### Using Convex with React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { useQuery } from 'convex/react'

function UserProfile({ userId }: { userId: string }) {
  const user = useQuery(api.users.get, { userId })

  if (!user) return <div>Loading...</div>

  return <div>{user.name}</div>
}
```

### Error Handling in Convex Functions

```typescript
try {
  const result = await someAsyncOperation()
} catch (error) {
  console.error('Operation failed:', error)
}
```

### Form Validation Errors

```typescript
const [errors, setErrors] = useState<Record<string, string>>({})
```

### API Error Handling

```typescript
if (!result.success) {
  throw new Error(result.error)
}
```

## Schema Examples

See `convex/schema.ts` for comprehensive examples of well-structured schemas with proper validators, indexes, and relationships.

## Component Examples

### File Route Component

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_user/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Content</div>
}
```

### Component Structure

```typescript
import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
  // other props
}

export function ComponentName({ className, ...props }: ComponentProps) {
  return (
    <div className={cn('base-classes', className)} {...props}>
      Content
    </div>
  )
}
```

## Validation Examples

### Zod Schema for User Input

```typescript
import { z } from 'zod'

// Schema for forms/validation
export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Invalid phone number'),
  email: z.string().email().optional(),
  role: z.enum([
    'trainer',
    'trainerManagedCustomer',
    'selfManagedCustomer',
    'admin',
  ]),
})

// Type inference
export type UserInput = z.infer<typeof userSchema>
```
