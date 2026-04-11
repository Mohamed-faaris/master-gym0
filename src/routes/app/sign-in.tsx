import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/app/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const normalizedPhoneNumber = phoneNumber.trim()
  const isPhoneNumberValid = normalizedPhoneNumber.length === 10

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isPhoneNumberValid) {
      setError('Phone number must be exactly 10 digits')
      return
    }

    setIsLoading(true)

    try {
      const user = await signIn(normalizedPhoneNumber, pin)
      if (!user) {
        setError('Invalid phone number or PIN')
        return
      }

      // Redirect based on user role
      switch (user.role) {
        case 'admin':
          navigate({ to: '/app/admin' })
          break
        case 'trainer':
          navigate({ to: '/app/management' })
          break
        case 'trainerManagedCustomer':
        case 'selfManagedCustomer':
        default:
          navigate({ to: '/app' })
          break
      }
    } catch (err) {
      setError('Invalid phone number or PIN')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your phone number and PIN to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="phoneNumber"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit phone number"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="pin"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                PIN
              </label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive font-medium">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !isPhoneNumberValid}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
