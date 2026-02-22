export type AdminRole =
  | 'trainer'
  | 'trainerManagedCustomer'
  | 'selfManagedCustomer'
  | 'admin'

export interface AdminUser {
  _id: string
  _creationTime?: number
  name: string
  phoneNumber: string
  email?: string
  pin: string
  role: AdminRole
  goal: string
  trainerId?: string
  createdAt: number
  updatedAt: number
  meta?: {
    age?: number
    address?: string
    gender?: string
    height?: number
    focusArea?: string
    currentWeight?: number
    targetWeight?: number
    emergencyContactName?: string
    emergencyContactPhone?: string
  } | null
  measurements?: {
    chest?: number
    shoulder?: number
    hip?: number
    arms?: number
    legs?: number
    timeSpanWeeks?: number
    updatedAt?: number
  } | null
}
