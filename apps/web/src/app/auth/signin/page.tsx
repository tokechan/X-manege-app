/**
 * Sign In Page
 * Dedicated page for user authentication
 */

import { SignInForm } from '@/components/auth/sign-in-form'
import { Suspense } from 'react'

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string
    error?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl, error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center p-4 tron-grid">
      <div className="w-full max-w-md">
        {error && (
          <div className="mb-4 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error === 'OAuthSignin' && 'Error with OAuth provider. Please try again.'}
            {error === 'OAuthCallback' && 'Error during OAuth callback. Please try again.'}
            {error === 'OAuthCreateAccount' && 'Could not create account. Please try again.'}
            {error === 'EmailCreateAccount' && 'Could not create account with email. Please try again.'}
            {error === 'Callback' && 'Error during callback. Please try again.'}
            {error === 'OAuthAccountNotLinked' && 'Account already exists with different provider.'}
            {error === 'EmailSignin' && 'Check your email for sign in link.'}
            {error === 'CredentialsSignin' && 'Invalid credentials. Please check your email and password.'}
            {error === 'default' && 'An error occurred. Please try again.'}
            {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin', 'default'].includes(error) && error}
          </div>
        )}
        
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tron-blue"></div>
          </div>
        }>
          <SignInForm callbackUrl={callbackUrl} />
        </Suspense>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Sign In | X-manage-app',
  description: 'Sign in to your X-manage-app account',
}
