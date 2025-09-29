"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserMenuCompact } from '@/components/auth/user-menu'
import { useAuth } from '@/components/providers/auth-provider'
import { ArrowLeft, Save, X, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface XAccountSettings {
  username: string
  apiKey: string
  apiSecret: string
  accessToken: string
  accessTokenSecret: string
  isConnected: boolean
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [settings, setSettings] = useState<XAccountSettings>({
    username: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    accessTokenSecret: '',
    isConnected: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Partial<XAccountSettings>>({})

  // Load settings from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('x-account-settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings(parsed)
        } catch (error) {
          console.error('Failed to parse saved settings:', error)
        }
      }
    }
  }, [])

  const validateSettings = (): boolean => {
    const newErrors: Partial<XAccountSettings> = {}
    
    if (!settings.username.trim()) {
      newErrors.username = 'Username is required'
    }
    
    if (!settings.apiKey.trim()) {
      newErrors.apiKey = 'API Key is required'
    }
    
    if (!settings.apiSecret.trim()) {
      newErrors.apiSecret = 'API Secret is required'
    }
    
    if (!settings.accessToken.trim()) {
      newErrors.accessToken = 'Access Token is required'
    }
    
    if (!settings.accessTokenSecret.trim()) {
      newErrors.accessTokenSecret = 'Access Token Secret is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateSettings()) {
      setSaveStatus('error')
      return
    }

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Save to localStorage
      const updatedSettings = { ...settings, isConnected: true }
      localStorage.setItem('x-account-settings', JSON.stringify(updatedSettings))
      setSettings(updatedSettings)
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnect = async () => {
    setIsSaving(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const disconnectedSettings = {
        ...settings,
        isConnected: false,
        apiKey: '',
        apiSecret: '',
        accessToken: '',
        accessTokenSecret: ''
      }
      
      localStorage.setItem('x-account-settings', JSON.stringify(disconnectedSettings))
      setSettings(disconnectedSettings)
      setErrors({})
      setSaveStatus('idle')
    } catch (error) {
      console.error('Failed to disconnect:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof XAccountSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="loading-skeleton">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="card-tron max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-tron-blue">Authentication Required</CardTitle>
            <CardDescription>
              You need to be signed in to access settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signin">
              <Button variant="tron" className="w-full">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-tron-blue" aria-label="Back to home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-tron-blue">Settings</h1>
            <p className="text-muted-foreground">Manage your X account integration</p>
          </div>
        </div>
        
        <UserMenuCompact />
      </header>

      {/* Settings Card */}
      <Card className="card-tron max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <X className="h-5 w-5 text-tron-blue" />
            <span>X Account Settings</span>
            {settings.isConnected && (
              <div className="flex items-center space-x-1 text-green-500">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Connected</span>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Configure your X (formerly Twitter) API credentials to connect your account.
            {!settings.isConnected && (
              <span className="text-amber-500 flex items-center mt-2">
                <AlertCircle className="h-4 w-4 mr-1" />
                Account not connected
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              X Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="@username"
              value={settings.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={errors.username ? 'border-destructive' : ''}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username}</p>
            )}
          </div>

          {/* API Credentials */}
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-tron-cyan mb-2">API Credentials</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get your API credentials from the X Developer Portal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API Key */}
              <div className="space-y-2">
                <label htmlFor="apiKey" className="text-sm font-medium">
                  API Key
                </label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter API Key"
                  value={settings.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  className={errors.apiKey ? 'border-destructive' : ''}
                />
                {errors.apiKey && (
                  <p className="text-sm text-destructive">{errors.apiKey}</p>
                )}
              </div>

              {/* API Secret */}
              <div className="space-y-2">
                <label htmlFor="apiSecret" className="text-sm font-medium">
                  API Secret
                </label>
                <Input
                  id="apiSecret"
                  type="password"
                  placeholder="Enter API Secret"
                  value={settings.apiSecret}
                  onChange={(e) => handleInputChange('apiSecret', e.target.value)}
                  className={errors.apiSecret ? 'border-destructive' : ''}
                />
                {errors.apiSecret && (
                  <p className="text-sm text-destructive">{errors.apiSecret}</p>
                )}
              </div>

              {/* Access Token */}
              <div className="space-y-2">
                <label htmlFor="accessToken" className="text-sm font-medium">
                  Access Token
                </label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Enter Access Token"
                  value={settings.accessToken}
                  onChange={(e) => handleInputChange('accessToken', e.target.value)}
                  className={errors.accessToken ? 'border-destructive' : ''}
                />
                {errors.accessToken && (
                  <p className="text-sm text-destructive">{errors.accessToken}</p>
                )}
              </div>

              {/* Access Token Secret */}
              <div className="space-y-2">
                <label htmlFor="accessTokenSecret" className="text-sm font-medium">
                  Access Token Secret
                </label>
                <Input
                  id="accessTokenSecret"
                  type="password"
                  placeholder="Enter Access Token Secret"
                  value={settings.accessTokenSecret}
                  onChange={(e) => handleInputChange('accessTokenSecret', e.target.value)}
                  className={errors.accessTokenSecret ? 'border-destructive' : ''}
                />
                {errors.accessTokenSecret && (
                  <p className="text-sm text-destructive">{errors.accessTokenSecret}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
              variant="tron"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>

            {settings.isConnected && (
              <Button
                onClick={handleDisconnect}
                disabled={isSaving}
                variant="destructive"
                className="flex-1 sm:flex-initial"
              >
                Disconnect Account
              </Button>
            )}
          </div>

          {/* Status Messages */}
          {saveStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Settings saved successfully!</span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to save settings. Please check your input and try again.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="card-tron max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle className="text-tron-orange">Need Help?</CardTitle>
          <CardDescription>
            Follow these steps to get your X API credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Visit the <a href="https://developer.twitter.com/" target="_blank" rel="noopener noreferrer" className="text-tron-blue hover:underline">X Developer Portal</a></li>
            <li>Create a new app or select an existing one</li>
            <li>Generate your API keys and access tokens</li>
            <li>Copy the credentials and paste them above</li>
            <li>Click "Save Settings" to connect your account</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
