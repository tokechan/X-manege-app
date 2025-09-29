/**
 * User Menu Component
 * Displays user info and provides logout functionality
 */

"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { signOut } from 'next-auth/react'
import { useAuth } from '@/components/providers/auth-provider'
import { User, LogOut, Settings, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const { user, isAuthenticated } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!isAuthenticated || !user) {
    return null
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({
        callbackUrl: '/',
      })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  const displayName = user.name || user.email || 'User'
  const initials = getInitials(user.name, user.email)

  return (
    <Card className="card-tron">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.image ? (
              <img
                src={user.image}
                alt={displayName}
                className="h-10 w-10 rounded-full border-2 border-tron-blue/30"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-tron-blue/20 border-2 border-tron-blue/30 flex items-center justify-center">
                <span className="text-sm font-medium text-tron-blue">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {displayName}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user.email}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-tron-blue"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
              disabled={isSigningOut}
              title="Sign Out"
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for navigation bars
export function UserMenuCompact() {
  const { user, isAuthenticated } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!isAuthenticated || !user) {
    return null
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({
        callbackUrl: '/',
      })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  const displayName = user.name || user.email || 'User'
  const initials = getInitials(user.name, user.email)

  return (
    <div className="flex items-center space-x-3">
      {/* Avatar */}
      {user.image ? (
        <img
          src={user.image}
          alt={displayName}
          className="h-8 w-8 rounded-full border border-tron-blue/30"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-tron-blue/20 border border-tron-blue/30 flex items-center justify-center">
          <span className="text-xs font-medium text-tron-blue">
            {initials}
          </span>
        </div>
      )}

      {/* Name */}
      <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
        {displayName}
      </span>

      {/* Sign Out Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="text-muted-foreground hover:text-destructive"
      >
        {isSigningOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
