import { createContext } from 'react'
import type { Doc } from 'convex/_generated/dataModel'

export interface AuthContextType {
  user: Doc<'users'> | null
  isLoading: boolean
  signIn: (phoneNumber: string, pin: string) => Promise<Doc<'users'> | null>
  signOut: () => void
  deleteAt?: number
}

export const AuthContext = createContext<AuthContextType | null>(null)
