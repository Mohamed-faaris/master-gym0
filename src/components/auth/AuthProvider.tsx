import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'
import { useConvex } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Doc } from 'convex/_generated/dataModel'
import { env } from '@/env'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userSession, setUserSession] = useState<Doc<'users'> | null>(null)
  const convex = useConvex()

  const signIn = async (
    phoneNumber: string,
    pin: string,
    deleteAt?: number,
  ): Promise<Doc<'users'> | null> => {
    const user = await convex.query(api.users.signInQuery, { phoneNumber, pin })
    if (user) {
      setUserSession(user)
      localStorage.setItem(
        'session',
        JSON.stringify({
          user,
          expiresAt: Date.now() + parseInt(env.VITE_AUTH_EXPIRY_TIME),
          deleteAt: deleteAt ?? Date.now() + parseInt(env.VITE_RESET_TIME),
        }),
      )
      return user
    }
    return null
  }

  const signOut = () => {
    setUserSession(null)
    localStorage.removeItem('session')
  }

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initSession = async () => {
      const storedSession = localStorage.getItem('session')
      if (storedSession) {
        const { user, expiresAt, deleteAt } = JSON.parse(storedSession)
        if (Date.now() > expiresAt || Date.now() > deleteAt) {
          localStorage.removeItem('session')
        } else {
          await signIn(user.phoneNumber, user.pin, deleteAt)
        }
      }
      setIsLoading(false)
    }
    initSession()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user: userSession, isLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
