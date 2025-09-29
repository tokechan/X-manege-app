/**
 * Sign In Form Component
 * Handles user authentication with Google OAuth and email
 */

"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn } from 'next-auth/react'
import { Mail, Chrome, Loader2 } from 'lucide-react'

interface SignInFormProps {
  callbackUrl?: string
}

export function SignInForm({ callbackUrl = '/dashboard' }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      setError('')
      
      const result = await signIn('google', {
        callbackUrl: callbackUrl,
        redirect: true,
      })
      
      if (result?.error) {
        setError('Failed to sign in with Google. Please try again.')
      }
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.')
      console.error('Google sign in error:', err)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Please enter your email address')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      // Use email provider (magic link)
      const result = await signIn('email', {
        email,
        callbackUrl: callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setError('Failed to send sign in email. Please try again.')
      } else {
        setError('')
        // Show success message
        alert('Check your email for a sign in link!')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Email sign in error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="card-tron w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-tron-blue">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your X-manage-app account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-tron-blue/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Sign In Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email for magic link"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-tron"
              disabled={isLoading || isGoogleLoading}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="tron"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Send Magic Link
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Button variant="link" className="p-0 h-auto font-normal text-tron-blue">
            Sign up here
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
