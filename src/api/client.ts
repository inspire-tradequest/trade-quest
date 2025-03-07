
import axios from 'axios';
import { User, Session } from '@supabase/supabase-js';

// Base API URL based on environment
const BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://api.inspirecreations.it.com/api/v1/tradequest'
  : 'http://localhost:8080/api/v1/tradequest';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'tradequest'
  }
});

// Local storage keys
const AUTH_TOKEN_KEY = 'tradequest_auth_token';
const AUTH_REFRESH_TOKEN_KEY = 'tradequest_refresh_token';
const USER_KEY = 'tradequest_user';

// Add request interceptor to include auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried refreshing token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, { 
          refreshToken 
        }, {
          headers: {
            'X-Tenant-ID': 'tradequest'
          }
        });
        
        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, newRefreshToken);
        
        // Update authorization header and retry
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out user
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signIn: async (email: string, password: string): Promise<{ user: User, session: Session }> => {
    const response = await api.post('/auth/login', { email, password });
    const { token, refreshToken, user } = response.data;
    
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    // Return format to match existing app structure
    return {
      user,
      session: {
        access_token: token,
        refresh_token: refreshToken,
        user
      } as Session
    };
  },
  
  signUp: async (email: string, password: string): Promise<{ user: User, session: Session | null }> => {
    const response = await api.post('/auth/register', { email, password });
    const { message, user } = response.data;
    
    // For services that require email verification
    return {
      user,
      session: null
    };
  },
  
  signOut: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  getSession: async (): Promise<{ session: Session | null }> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    
    if (!token || !user) {
      return { session: null };
    }
    
    try {
      // Verify token is valid
      await api.get('/auth/verify');
      
      return {
        session: {
          access_token: token,
          refresh_token: localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) || '',
          user: JSON.parse(user)
        } as Session
      };
    } catch (error) {
      return { session: null };
    }
  }
};

// Profile API
export const profileApi = {
  getProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },
  
  updateProfile: async (userId: string, profileData: any) => {
    const response = await api.put(`/users/${userId}/profile`, profileData);
    return response.data;
  }
};

// AI Recommendations API
export const recommendationsApi = {
  getInvestmentRecommendations: async (params: any) => {
    const response = await api.post('/ai/investment-recommendations', params);
    return response.data;
  },
  
  getSavedRecommendations: async (userId: string) => {
    const response = await api.get(`/users/${userId}/recommendations`);
    return response.data;
  },
  
  markAsRead: async (recommendationId: string) => {
    const response = await api.put(`/recommendations/${recommendationId}/read`);
    return response.data;
  }
};

// Market Analysis API
export const marketAnalysisApi = {
  getMarketTrendAnalysis: async (params: any) => {
    const response = await api.post('/ai/market-trend-analysis', params);
    return response.data;
  }
};

// Risk Assessment API
export const riskApi = {
  getRiskAssessment: async (params: any) => {
    const response = await api.post('/ai/risk-assessment', params);
    return response.data;
  }
};

// Learning API
export const learningApi = {
  getLearningContent: async (params: any) => {
    const response = await api.post('/ai/learning-content', params);
    return response.data;
  },
  
  markLessonCompleted: async (userId: string, lessonId: string) => {
    const response = await api.post(`/users/${userId}/learning/lessons/${lessonId}/complete`);
    return response.data;
  },
  
  submitAssessment: async (userId: string, lessonId: string, answers: any) => {
    const response = await api.post(`/users/${userId}/learning/lessons/${lessonId}/assess`, { answers });
    return response.data;
  },
  
  getLearningProgress: async (userId: string) => {
    const response = await api.get(`/users/${userId}/learning/progress`);
    return response.data;
  }
};

// Trading Strategy API
export const strategyApi = {
  analyzeStrategy: async (params: any) => {
    const response = await api.post('/ai/trading-strategy-analysis', params);
    return response.data;
  },
  
  getStrategies: async (userId: string) => {
    const response = await api.get(`/users/${userId}/strategies`);
    return response.data;
  },
  
  createStrategy: async (userId: string, strategyData: any) => {
    const response = await api.post(`/users/${userId}/strategies`, strategyData);
    return response.data;
  },
  
  updateStrategy: async (strategyId: string, strategyData: any) => {
    const response = await api.put(`/strategies/${strategyId}`, strategyData);
    return response.data;
  },
  
  deleteStrategy: async (strategyId: string) => {
    const response = await api.delete(`/strategies/${strategyId}`);
    return response.data;
  }
};

// Portfolio API
export const portfolioApi = {
  getPortfolios: async (userId: string) => {
    const response = await api.get(`/users/${userId}/portfolios`);
    return response.data;
  },
  
  getPortfolio: async (portfolioId: string) => {
    const response = await api.get(`/portfolios/${portfolioId}`);
    return response.data;
  },
  
  createPortfolio: async (userId: string, portfolioData: any) => {
    const response = await api.post(`/users/${userId}/portfolios`, portfolioData);
    return response.data;
  },
  
  updatePortfolio: async (portfolioId: string, portfolioData: any) => {
    const response = await api.put(`/portfolios/${portfolioId}`, portfolioData);
    return response.data;
  },
  
  deletePortfolio: async (portfolioId: string) => {
    const response = await api.delete(`/portfolios/${portfolioId}`);
    return response.data;
  },
  
  addHolding: async (portfolioId: string, holdingData: any) => {
    const response = await api.post(`/portfolios/${portfolioId}/holdings`, holdingData);
    return response.data;
  },
  
  updateHolding: async (portfolioId: string, holdingId: string, holdingData: any) => {
    const response = await api.put(`/portfolios/${portfolioId}/holdings/${holdingId}`, holdingData);
    return response.data;
  },
  
  deleteHolding: async (portfolioId: string, holdingId: string) => {
    const response = await api.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`);
    return response.data;
  }
};

export default api;
