import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from '../page'
import { useAuth } from '../../../components/providers/auth-provider'

// Mock the auth provider
jest.mock('../../../components/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('SettingsPage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Authentication States', () => {
    it('shows loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      })

      render(<SettingsPage />)
      
      expect(screen.getByTestId('loading-skeleton') || screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('shows sign in prompt when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      })

      render(<SettingsPage />)
      
      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      expect(screen.getByText('You need to be signed in to access settings.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/signin')
    })

    it('shows settings form when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      })

      render(<SettingsPage />)
      
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('X Account Settings')).toBeInTheDocument()
      expect(screen.getByLabelText('X Username')).toBeInTheDocument()
    })
  })

  describe('Settings Form', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      })
    })

    it('renders all form fields', () => {
      render(<SettingsPage />)
      
      expect(screen.getByLabelText('X Username')).toBeInTheDocument()
      expect(screen.getByLabelText('API Key')).toBeInTheDocument()
      expect(screen.getByLabelText('API Secret')).toBeInTheDocument()
      expect(screen.getByLabelText('Access Token')).toBeInTheDocument()
      expect(screen.getByLabelText('Access Token Secret')).toBeInTheDocument()
    })

    it('loads saved settings from localStorage', () => {
      const savedSettings = {
        username: '@testuser',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        accessToken: 'test-token',
        accessTokenSecret: 'test-token-secret',
        isConnected: true,
      }
      
      localStorage.setItem('x-account-settings', JSON.stringify(savedSettings))
      
      render(<SettingsPage />)
      
      expect(screen.getByDisplayValue('@testuser')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })

    it('shows validation errors for empty required fields', async () => {
      const user = userEvent.setup()
      render(<SettingsPage />)
      
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument()
        expect(screen.getByText('API Key is required')).toBeInTheDocument()
        expect(screen.getByText('API Secret is required')).toBeInTheDocument()
        expect(screen.getByText('Access Token is required')).toBeInTheDocument()
        expect(screen.getByText('Access Token Secret is required')).toBeInTheDocument()
      })
    })

    it('clears validation errors when user starts typing', async () => {
      const user = userEvent.setup()
      render(<SettingsPage />)
      
      // Trigger validation errors
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument()
      })
      
      // Start typing in username field
      const usernameInput = screen.getByLabelText('X Username')
      await user.type(usernameInput, '@test')
      
      await waitFor(() => {
        expect(screen.queryByText('Username is required')).not.toBeInTheDocument()
      })
    })

    it('saves settings successfully with valid data', async () => {
      const user = userEvent.setup()
      render(<SettingsPage />)
      
      // Fill in all required fields
      await user.type(screen.getByLabelText('X Username'), '@testuser')
      await user.type(screen.getByLabelText('API Key'), 'test-api-key')
      await user.type(screen.getByLabelText('API Secret'), 'test-api-secret')
      await user.type(screen.getByLabelText('Access Token'), 'test-access-token')
      await user.type(screen.getByLabelText('Access Token Secret'), 'test-access-token-secret')
      
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)
      
      // Check loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      
      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument()
        expect(screen.getByText('Connected')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      // Verify localStorage was updated
      const savedSettings = JSON.parse(localStorage.getItem('x-account-settings') || '{}')
      expect(savedSettings.username).toBe('@testuser')
      expect(savedSettings.isConnected).toBe(true)
    })

    it('allows disconnecting account', async () => {
      const user = userEvent.setup()
      
      // Set up connected state
      const connectedSettings = {
        username: '@testuser',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        accessToken: 'test-token',
        accessTokenSecret: 'test-token-secret',
        isConnected: true,
      }
      localStorage.setItem('x-account-settings', JSON.stringify(connectedSettings))
      
      render(<SettingsPage />)
      
      expect(screen.getByText('Connected')).toBeInTheDocument()
      
      const disconnectButton = screen.getByRole('button', { name: /disconnect account/i })
      await user.click(disconnectButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Connected')).not.toBeInTheDocument()
        expect(screen.getByText('Account not connected')).toBeInTheDocument()
      })
      
      // Verify credentials were cleared
      const updatedSettings = JSON.parse(localStorage.getItem('x-account-settings') || '{}')
      expect(updatedSettings.isConnected).toBe(false)
      expect(updatedSettings.apiKey).toBe('')
      expect(updatedSettings.apiSecret).toBe('')
    })
  })

  describe('Help Section', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      })
    })

    it('displays help information', () => {
      render(<SettingsPage />)
      
      expect(screen.getByText('Need Help?')).toBeInTheDocument()
      expect(screen.getByText('Follow these steps to get your X API credentials')).toBeInTheDocument()
      
      const developerPortalLink = screen.getByRole('link', { name: /x developer portal/i })
      expect(developerPortalLink).toHaveAttribute('href', 'https://developer.twitter.com/')
      expect(developerPortalLink).toHaveAttribute('target', '_blank')
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      })
    })

    it('has back button to home page', () => {
      render(<SettingsPage />)
      
      const backButton = screen.getByRole('button', { name: /back to home/i })
      expect(backButton.closest('a')).toHaveAttribute('href', '/')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      })
    })

    it('handles localStorage parsing errors gracefully', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('x-account-settings', 'invalid-json')
      
      // Should not throw an error and render normally
      expect(() => render(<SettingsPage />)).not.toThrow()
      
      // Should render with default empty state
      expect(screen.getByLabelText('X Username')).toHaveValue('')
    })
  })
})
