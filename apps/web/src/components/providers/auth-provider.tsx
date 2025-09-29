/**
 * Authentication Provider Component
 * Provides NextAuth session context to the entire app
 */

"use client"

import React, { createContext, useContext } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import type { Session } from 'next-auth'

interface AuthContextType {
  session: Session | null
  user: Session['user'] | null
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  const value: AuthContextType = {
    session,
    user: session?.user || null,
    isLoading,
    isAuthenticated: !!session?.user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tron-blue"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-tron-blue mb-4">
              Authentication Required
            </h1>
            <p className="text-muted-foreground">
              Please sign in to access this page.
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
