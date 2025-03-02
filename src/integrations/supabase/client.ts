import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qaddsyblirslplvkpnpv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZGRzeWJsaXJzbHBsdmtwbnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NzE3MDYsImV4cCI6MjA1NjQ0NzcwNn0.sQCYSxL0CZG6h1Q1hsrv9EtRp4DuENdD4CMOTdpD0N8";
export const AI_SERVICE_URL = "https://ai.inspirecreations.it.com";

// Enhanced Database type that includes our tables
export type DatabaseWithTables = Database & {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      ai_recommendations: {
        Row: AIRecommendation;
        Insert: Omit<AIRecommendation, 'id' | 'created_at'>;
        Update: Partial<Omit<AIRecommendation, 'id' | 'created_at'>>; 
      };
      trading_strategies: {
        Row: TradingStrategy;
        Insert: Omit<TradingStrategy, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TradingStrategy, 'id' | 'created_at' | 'updated_at'>>; 
      };
      learning_progress: {
        Row: LearningProgress;
        Insert: Omit<LearningProgress, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LearningProgress, 'id' | 'created_at' | 'updated_at'>>; 
      };
      ai_analysis_requests: {
        Row: AIAnalysisRequest;
        Insert: Omit<AIAnalysisRequest, 'id' | 'created_at' | 'completed_at'>;
        Update: Partial<Omit<AIAnalysisRequest, 'id' | 'created_at'>>; 
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<{
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        }, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<{
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        }, 'id' | 'created_at' | 'updated_at'>>;
      };
      portfolio_holdings: {
        Row: PortfolioHolding;
        Insert: Omit<PortfolioHolding, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PortfolioHolding, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};

export const supabase = createClient<DatabaseWithTables>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Define database types
export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number;
  experience_points: number;
  risk_tolerance: 'low' | 'medium' | 'high';
  investment_goals: string[];
  time_horizon: 'short' | 'medium' | 'long';
  created_at: string;
  updated_at: string;
}

export type AIRecommendation = {
  id: string;
  user_id: string;
  recommendation_type: string;
  content: any;
  is_read: boolean;
  created_at: string;
}

export type TradingStrategy = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  strategy_type: string;
  parameters: any;
  performance_metrics: any;
  created_at: string;
  updated_at: string;
}

export type LearningProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export type AIAnalysisRequest = {
  id: string;
  user_id: string;
  request_type: string;
  request_data: any;
  response_data: any;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export type PortfolioHolding = {
  id: string;
  portfolio_id: string;
  asset_id: string;
  quantity: number;
  current_value: number;
  created_at: string;
  updated_at: string;
}

// AI API client functions
export const aiApi = {
  getInvestmentRecommendations: async (params: RecommendationRequest) => {
    const { data, error } = await supabase.functions.invoke('investment-recommendations', {
      body: params
    });
    if (error) throw error;
    return data as RecommendationResponse;
  },
  
  getRiskAssessment: async (params: RiskAssessmentRequest) => {
    const { data, error } = await supabase.functions.invoke('risk-assessment', {
      body: params
    });
    if (error) throw error;
    return data as RiskAssessmentResponse;
  },
  
  getMarketTrendAnalysis: async (params: MarketTrendRequest) => {
    const { data, error } = await supabase.functions.invoke('market-trend-analysis', {
      body: params
    });
    if (error) throw error;
    return data as MarketTrendResponse;
  },
  
  getLearningContent: async (params: LearningContentRequest) => {
    const { data, error } = await supabase.functions.invoke('learning-content', {
      body: params
    });
    if (error) throw error;
    return data as LearningContentResponse;
  },
  
  analyzeStrategy: async (params: StrategyAnalysisRequest) => {
    const { data, error } = await supabase.functions.invoke('trading-strategy-analysis', {
      body: params
    });
    if (error) throw error;
    return data as StrategyAnalysisResponse;
  }
};

// TypeScript interfaces for AI API
export interface RecommendationRequest {
  userId: string;
  riskTolerance: 'low' | 'medium' | 'high';
  investmentGoals: string[];
  timeHorizon: 'short' | 'medium' | 'long';
  currentPortfolio?: {
    assetId: string;
    amount: number;
  }[];
}

export interface RecommendationResponse {
  recommendations: {
    assetId: string;
    ticker: string;
    name: string;
    type: 'stock' | 'etf' | 'crypto' | 'bond';
    allocationPercentage: number;
    rationale: string;
    riskLevel: 'low' | 'medium' | 'high';
    expectedReturn: {
      optimistic: number;
      pessimistic: number;
      average: number;
    };
  }[];
  portfolioMetrics: {
    diversificationScore: number;
    riskScore: number;
    expectedAnnualReturn: number;
  };
}

export interface RiskAssessmentRequest {
  assets: {
    assetId: string;
    weight: number;
  }[];
  timeHorizon: number; // in months
}

export interface RiskAssessmentResponse {
  overallRiskScore: number; // 1-100
  volatilityMetrics: {
    standardDeviation: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  riskBreakdown: {
    marketRisk: number;
    specificRisk: number;
    liquidityRisk: number;
    currencyRisk?: number;
  };
  scenarioAnalysis: {
    marketCrash: number; // expected performance in %
    economicRecession: number;
    interestRateHike: number;
    sectorDownturn: number;
  };
}

export interface MarketTrendRequest {
  assets: string[]; // asset IDs or tickers
  timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year';
  indicators: string[]; // e.g., 'macd', 'rsi', 'moving_average'
}

export interface MarketTrendResponse {
  trends: {
    assetId: string;
    ticker: string;
    currentTrend: 'bullish' | 'bearish' | 'neutral';
    strength: number; // 0-100
    signals: {
      indicator: string;
      value: number;
      interpretation: string;
      signal: 'buy' | 'sell' | 'hold';
    }[];
    supportLevels: number[];
    resistanceLevels: number[];
    prediction: {
      direction: 'up' | 'down' | 'sideways';
      confidence: number; // 0-100
      targetPrice: number;
      timeframe: string;
    };
  }[];
  marketSentiment: {
    overall: 'positive' | 'negative' | 'neutral';
    newsScore: number;
    socialMediaScore: number;
    analystsConsensus: string;
  };
}

export interface LearningContentRequest {
  userId: string;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  preferredFormats: ('text' | 'video' | 'interactive')[];
}

export interface LearningContentResponse {
  lessons: {
    id: string;
    title: string;
    description: string;
    content: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number; // minutes
    format: 'text' | 'video' | 'interactive';
    resources: {
      type: string;
      url: string;
      title: string;
    }[];
  }[];
  recommendedPath: {
    nextLessons: string[]; // lesson IDs
    rationale: string;
  };
  assessments: {
    id: string;
    title: string;
    questions: {
      text: string;
      options: string[];
      correctAnswerIndex: number;
      explanation: string;
    }[];
  }[];
}

export interface StrategyAnalysisRequest {
  strategyType: 'momentum' | 'value' | 'growth' | 'custom';
  parameters: Record<string, any>; // strategy-specific parameters
  assets: string[]; // asset IDs or tickers
  timeframe: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  initialCapital: number;
}

export interface StrategyAnalysisResponse {
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    volatility: number;
    winRate: number;
  };
  trades: {
    asset: string;
    direction: 'buy' | 'sell';
    entryDate: string;
    entryPrice: number;
    exitDate: string;
    exitPrice: number;
    profit: number;
    profitPercentage: number;
  }[];
  optimization: {
    suggestedChanges: {
      parameter: string;
      currentValue: any;
      suggestedValue: any;
      expectedImprovement: string;
    }[];
    alternativeStrategies: {
      name: string;
      description: string;
      potentialImprovement: string;
    }[];
  };
}
