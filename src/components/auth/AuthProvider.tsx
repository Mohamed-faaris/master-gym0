import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'
import { useConvex } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Doc } from 'convex/_generated/dataModel'
import { env } from '@/env'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userSession, setUserSession] = useState<Doc<'users'> | null>(null)
  const [deleteAt, setDeleteAt] = useState<number | undefined>(undefined)
  const convex = useConvex()

  const signIn = async (
    phoneNumber: string,
    pin: string,
  ): Promise<Doc<'users'> | null> => {
    const user = await convex.query(api.users.signInQuery, { phoneNumber, pin })
    if (user) {
      const finalDeleteAt =
        deleteAt ?? Date.now() + parseInt(env.VITE_RESET_TIME)
      setUserSession(user)
      setDeleteAt(finalDeleteAt)
      localStorage.setItem(
        'session',
        JSON.stringify({
          user,
          expiresAt: Date.now() + parseInt(env.VITE_AUTH_EXPIRY_TIME),
          deleteAt: finalDeleteAt,
        }),
      )
      return user
    }
    return null
  }

  const signOut = () => {
    setUserSession(null)
    setDeleteAt(undefined)
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
          setDeleteAt(undefined)
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
      value={{ user: userSession, isLoading, signIn, signOut, deleteAt }}
    >
      {children}
    </AuthContext.Provider>
  )
}
