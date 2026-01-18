import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'
import type { Session } from './AuthContext';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session>({
    id: null,
    name: null,
    phoneNumber: null,
    token: null,
  })
  const signIn = (phoneNumber: string, pin: string) => {
    if (pin !== '123456') {
      throw new Error('Invalid PIN')
    }
    // ! TODO: Implement sign in logic
    setSession({
      id: 'user-id',
      name: 'User Name',
      phoneNumber,
      token: 'auth-token',
    })
  }

  const signOut = () => {
    // ! sign out logic
    setSession({
      id: null,
      name: null,
      phoneNumber: null,
      token: null,
    })
    localStorage.removeItem('session')
  }

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // ! Simulate loading user session from storage or API
    setTimeout(() => {
      const storedSession = localStorage.getItem('session')
      if (storedSession) {
        setSession(JSON.parse(storedSession))
      }
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
