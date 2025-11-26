import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  userId: number
  googleId: string
  email: string
  name: string
  pictureUrl?: string
  hasS3Config: boolean
  hasDriveAccess: boolean
  accessToken?: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'galleria-auth',
    }
  )
)

