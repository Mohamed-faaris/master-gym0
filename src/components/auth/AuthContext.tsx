import { createContext } from 'react'

export interface Session {
  id: string | null
  name: string | null
  phoneNumber: string | null
  token: string | null
}

export interface AuthContextType {
  session: Session
  isLoading: boolean
  signIn: (phoneNumber: string, pin: string) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
