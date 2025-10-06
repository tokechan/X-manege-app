/**
 * API Client for X-manage-app
 * Handles all API communication between frontend and backend
 */

export interface XAccountSettings {
  username: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  isConnected: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.x-manage.app' 
    : 'http://localhost:8787');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Get user's X account settings
  async getXSettings(): Promise<ApiResponse<XAccountSettings>> {
    return this.request<XAccountSettings>('/auth/x-settings');
  }

  // Save user's X account settings
  async saveXSettings(settings: Omit<XAccountSettings, 'isConnected'>): Promise<ApiResponse<XAccountSettings>> {
    return this.request<XAccountSettings>('/auth/x-settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Test X API connection
  async testXConnection(settings: Omit<XAccountSettings, 'isConnected'>): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/x-settings/test', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Disconnect X account
  async disconnectXAccount(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/x-settings', {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
