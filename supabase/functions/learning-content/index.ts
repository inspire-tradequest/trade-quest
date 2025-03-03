
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_SERVICE_URL = "https://ai.inspirecreations.it.com";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Get the user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Error getting user');
    }

    // Get the request body
    const requestData = await req.json();
    const { knowledgeLevel, topics, preferredFormats } = requestData;

    // Log the request in the database
    const { data: logData, error: logError } = await supabaseClient
      .from('ai_analysis_requests')
      .insert({
        user_id: user.id,
        request_type: 'learning_content',
        request_data: requestData,
        status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging request:', logError);
    }

    const requestId = logData?.id;

    // While waiting for the AI service, we'll create a mock response for development
    // This allows us to test the UI without relying on the external AI service
    // In production, this would be replaced with the actual AI service call
    
    // Mock response based on the user's preferences
    const mockContent = generateMockLearningContent(knowledgeLevel, topics, preferredFormats);

    // Simulate an AI service response time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the log with the response
    if (requestId) {
      await supabaseClient
        .from('ai_analysis_requests')
        .update({
          status: 'completed',
          response_data: mockContent,
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);
    }

    return new Response(JSON.stringify(mockContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in learning-content function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMockLearningContent(knowledgeLevel, topics, preferredFormats) {
  // Generate lesson IDs
  const lessonIds = [
    'intro_to_investing',
    'market_basics',
    'technical_analysis_101',
    'fundamental_analysis',
    'risk_management',
    'trading_psychology',
    'advanced_chart_patterns',
    'portfolio_diversification'
  ];
  
  // Create lessons with interactive content
  const lessons = lessonIds.map((id, index) => {
    // Mix formats based on user preferences, defaulting to text if none specified
    const format = preferredFormats && preferredFormats.length > 0 
      ? preferredFormats[index % preferredFormats.length] 
      : 'text';
    
    const difficulty = index < 3 ? 'beginner' : (index < 6 ? 'intermediate' : 'advanced');
    
    // Only show lessons appropriate for the user's knowledge level
    if ((knowledgeLevel === 'beginner' && difficulty !== 'beginner') ||
        (knowledgeLevel === 'intermediate' && difficulty === 'advanced')) {
      return null;
    }
    
    return {
      id,
      title: formatTitle(id),
      description: `Learn about ${formatTitle(id.toLowerCase()).replace(/_/g, ' ')} in the financial markets.`,
      content: generateLessonContent(id, difficulty),
      difficulty,
      estimatedDuration: 10 + (index * 5), // Minutes
      format,
      resources: generateResources(id, difficulty),
      interactiveContent: format === 'interactive' ? generateInteractiveContent(id, difficulty) : null
    };
  }).filter(Boolean); // Remove null lessons
  
  // Create assessments for each lesson
  const assessments = lessons.map(lesson => ({
    id: `${lesson.id}_assessment`,
    title: `${formatTitle(lesson.id)} Assessment`,
    questions: generateQuestions(lesson.id, lesson.difficulty)
  }));
  
  // Determine next recommended lessons based on knowledge level
  const beginnerLessons = lessons.filter(l => l.difficulty === 'beginner').map(l => l.id);
  const intermediateLessons = lessons.filter(l => l.difficulty === 'intermediate').map(l => l.id);
  const advancedLessons = lessons.filter(l => l.difficulty === 'advanced').map(l => l.id);
  
  let nextLessons;
  let rationale;
  
  switch (knowledgeLevel) {
    case 'beginner':
      nextLessons = beginnerLessons.slice(0, 3);
      rationale = "As a beginner, we recommend starting with these fundamental lessons to build a strong foundation in investing and trading concepts.";
      break;
    case 'intermediate':
      nextLessons = [...intermediateLessons.slice(0, 2), ...advancedLessons.slice(0, 1)];
      rationale = "Based on your intermediate knowledge, we suggest these lessons to deepen your understanding of technical analysis and risk management.";
      break;
    case 'advanced':
      nextLessons = advancedLessons;
      rationale = "For advanced learners, these specialized topics will help you refine your trading strategies and decision-making process.";
      break;
    default:
      nextLessons = beginnerLessons.slice(0, 3);
      rationale = "We recommend starting with these fundamental lessons to build your knowledge base.";
  }
  
  return {
    lessons,
    recommendedPath: {
      nextLessons,
      rationale
    },
    assessments
  };
}

function formatTitle(id) {
  return id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateLessonContent(id, difficulty) {
  const contentMap = {
    intro_to_investing: "Investing is the act of allocating resources, usually money, with the expectation of generating income or profit over time. The basics of investing include understanding different asset classes like stocks, bonds, and cash equivalents, as well as the concepts of risk and return. When you invest, you're essentially buying a piece of a company or entity with the hope that it will grow in value. Start small, focus on long-term goals, and diversify your investments to minimize risk.",
    market_basics: "Financial markets are where buyers and sellers trade assets like stocks, bonds, and commodities. They function through exchanges, which can be physical locations or electronic networks. Key concepts include supply and demand, market capitalization, liquidity, and volatility. Understanding market indices like the S&P 500 or Dow Jones can help you gauge market performance. Markets operate in cycles of expansion and contraction, influenced by economic indicators, company performance, and investor sentiment.",
    technical_analysis_101: "Technical analysis is a trading discipline that evaluates investments and identifies trading opportunities by analyzing statistical trends gathered from trading activity. It focuses on price movement and volume rather than the fundamentals of the asset itself. Key tools include chart patterns, support and resistance levels, trend lines, and technical indicators like moving averages and relative strength index (RSI). Technical analysis is based on the premise that market price reflects all available information and that price movements are not purely random.",
    fundamental_analysis: "Fundamental analysis is a method of evaluating a security in an attempt to measure its intrinsic value. Analysts study everything that can affect the value of a security, including macroeconomic factors (like the economy and industry conditions) and company-specific factors (like financial condition and management). Key metrics include price-to-earnings (P/E) ratio, return on equity (ROE), and debt-to-equity ratio. The goal is to determine if a security is undervalued or overvalued.",
    risk_management: "Risk management is the process of identifying, analyzing, and accepting or mitigating uncertainty in investment decisions. Essential techniques include diversification, position sizing, and setting stop-loss orders. Understanding concepts like volatility, beta, and drawdown can help you quantify risk. A well-structured risk management strategy helps protect your capital during market downturns while allowing for growth in favorable conditions. Remember, managing risk is often more important than maximizing returns for long-term success.",
    trading_psychology: "Trading psychology refers to the emotions and mental state that affect your trading decisions. Common psychological challenges include fear, greed, hope, and regret. These emotions can lead to impulsive decisions, overtrading, or inability to cut losses. Developing a disciplined trading plan, maintaining a trading journal, and practicing mindfulness can help manage these emotional responses. Successful traders often focus on the process rather than outcomes and maintain consistent behavior regardless of recent wins or losses.",
    advanced_chart_patterns: "Advanced chart patterns are complex technical formations that can help predict future price movements. These include harmonic patterns like Gartley and Butterfly, as well as Elliott Wave structures. Unlike basic patterns, advanced formations often require precise measurements and ratio relationships. They typically incorporate multiple timeframes and may use Fibonacci retracements. Understanding volume confirmation and divergence indicators can enhance the reliability of these patterns. These tools are most effective when combined with other analysis methods and risk management strategies.",
    portfolio_diversification: "Portfolio diversification is a risk management strategy that involves spreading investments across various assets, sectors, and geographic regions. The goal is to maximize returns while minimizing risk, as different assets often react differently to the same economic event. Modern Portfolio Theory suggests that there's an 'efficient frontier' of optimal portfolios offering the maximum expected return for a given level of risk. Key considerations include correlation between assets, rebalancing frequency, and tax implications. A well-diversified portfolio typically includes a mix of stocks, bonds, cash, and potentially alternative investments."
  };
  
  return contentMap[id] || "Detailed content for this lesson will be provided soon.";
}

function generateResources(id, difficulty) {
  const resourcesByTopic = {
    intro_to_investing: [
      { type: "Article", url: "https://www.investopedia.com/terms/i/investing.asp", title: "Introduction to Investing" },
      { type: "Video", url: "https://www.youtube.com/results?search_query=investing+basics", title: "Investing Fundamentals" }
    ],
    market_basics: [
      { type: "Article", url: "https://www.investopedia.com/terms/m/market.asp", title: "Understanding Financial Markets" },
      { type: "Tool", url: "https://finance.yahoo.com/", title: "Market Data Tool" }
    ],
    technical_analysis_101: [
      { type: "Article", url: "https://www.investopedia.com/terms/t/technicalanalysis.asp", title: "Technical Analysis Explained" },
      { type: "Video", url: "https://www.youtube.com/results?search_query=technical+analysis+basics", title: "Chart Patterns Tutorial" }
    ],
    fundamental_analysis: [
      { type: "Article", url: "https://www.investopedia.com/terms/f/fundamentalanalysis.asp", title: "Guide to Fundamental Analysis" },
      { type: "Calculator", url: "https://www.calculator.net/investment-calculator.html", title: "Investment Calculator" }
    ],
    risk_management: [
      { type: "Article", url: "https://www.investopedia.com/terms/r/riskmanagement.asp", title: "Risk Management Principles" },
      { type: "Spreadsheet", url: "https://www.vertex42.com/ExcelTemplates/investment-tracker.html", title: "Risk Tracking Template" }
    ],
    trading_psychology: [
      { type: "Book", url: "https://www.amazon.com/Trading-Zone-Confidence-Discipline-Attitude/dp/0735201447", title: "Trading in the Zone" },
      { type: "Article", url: "https://www.investopedia.com/articles/trading/02/110502.asp", title: "Master Your Trading Psychology" }
    ],
    advanced_chart_patterns: [
      { type: "Article", url: "https://www.investopedia.com/articles/technical/112601.asp", title: "Advanced Chart Patterns" },
      { type: "Tool", url: "https://www.tradingview.com/", title: "TradingView Charts" }
    ],
    portfolio_diversification: [
      { type: "Article", url: "https://www.investopedia.com/terms/d/diversification.asp", title: "Portfolio Diversification Guide" },
      { type: "Calculator", url: "https://www.calculatorsoup.com/calculators/financial/investment-diversification-calculator.php", title: "Diversification Calculator" }
    ]
  };
  
  return resourcesByTopic[id] || [];
}

function generateQuestions(lessonId, difficulty) {
  const questionsByTopic = {
    intro_to_investing: [
      {
        text: "What is the primary purpose of investing?",
        options: [
          "To make quick profits",
          "To generate income or profit over time",
          "To beat the market consistently",
          "To avoid paying taxes"
        ],
        correctAnswerIndex: 1,
        explanation: "Investing is about allocating resources with the expectation of generating income or profit over time, not just making quick profits."
      },
      {
        text: "Which of these is NOT a major asset class?",
        options: [
          "Stocks",
          "Bonds",
          "Cryptocurrencies",
          "Mutual Funds"
        ],
        correctAnswerIndex: 3,
        explanation: "Mutual funds are investment vehicles that can contain stocks, bonds, or other assets, not a distinct asset class themselves."
      }
    ],
    market_basics: [
      {
        text: "What does market capitalization measure?",
        options: [
          "The total value of a company's outstanding shares",
          "The total debt of a company",
          "The market's overall performance",
          "The company's annual revenue"
        ],
        correctAnswerIndex: 0,
        explanation: "Market capitalization is calculated by multiplying a company's outstanding shares by its current share price."
      },
      {
        text: "Which of these is a stock market index?",
        options: [
          "NASDAQ",
          "NYSE",
          "S&P 500",
          "FOREX"
        ],
        correctAnswerIndex: 2,
        explanation: "The S&P 500 is an index of 500 large U.S. companies. NASDAQ and NYSE are exchanges, while FOREX is the foreign exchange market."
      }
    ],
    technical_analysis_101: [
      {
        text: "What does a 'double top' chart pattern typically indicate?",
        options: [
          "A bullish continuation",
          "A bearish reversal",
          "A market consolidation",
          "A sideways trend"
        ],
        correctAnswerIndex: 1,
        explanation: "A double top is a bearish reversal pattern that forms after an uptrend, indicating a potential trend reversal to the downside."
      }
    ]
  };
  
  // Return specific questions for the lesson if available, otherwise generate generic ones
  if (questionsByTopic[lessonId]) {
    return questionsByTopic[lessonId];
  } else {
    // Generic questions based on difficulty
    if (difficulty === 'beginner') {
      return [
        {
          text: `What is the main concept of ${formatTitle(lessonId)}?`,
          options: [
            "Making quick profits",
            "Understanding market fundamentals",
            "Technical analysis",
            "Risk management"
          ],
          correctAnswerIndex: 1,
          explanation: "Understanding fundamentals is essential before applying more advanced concepts."
        }
      ];
    } else {
      return [
        {
          text: `Which advanced technique is MOST important in ${formatTitle(lessonId)}?`,
          options: [
            "Chart pattern recognition",
            "Momentum indicators",
            "Volume analysis",
            "Multiple timeframe analysis"
          ],
          correctAnswerIndex: 3,
          explanation: "Multiple timeframe analysis provides a more complete picture of market conditions."
        }
      ];
    }
  }
}

function generateInteractiveContent(lessonId, difficulty) {
  const baseSteps = [
    {
      id: `${lessonId}_step1`,
      title: "Understanding the Concept",
      content: `Let's explore the fundamental principles of ${formatTitle(lessonId)}.`,
      interactionType: "info-reveal",
      interactionData: {
        revealContent: `${formatTitle(lessonId)} is critical to successful trading because it helps you make more informed decisions based on data and analysis rather than emotions.`
      }
    },
    {
      id: `${lessonId}_step2`,
      title: "Identify Key Elements",
      content: "Can you identify which of these is a key component?",
      interactionType: "clickable-element",
      interactionData: {
        elements: [
          { id: "element1", text: "Short-term price fluctuations", isCorrect: false },
          { id: "element2", text: "Long-term market trends", isCorrect: true },
          { id: "element3", text: "Following social media tips", isCorrect: false },
          { id: "element4", text: "Making emotional decisions", isCorrect: false }
        ]
      }
    },
    {
      id: `${lessonId}_step3`,
      title: "Practical Application",
      content: "Fill in the blanks to complete this important concept:",
      interactionType: "fill-in-blank",
      interactionData: {
        blanks: [
          { id: "blank1", correctAnswer: "risk" },
          { id: "blank2", correctAnswer: "return" }
        ]
      }
    },
    {
      id: `${lessonId}_step4`,
      title: "Review & Summary",
      content: `You've completed the interactive module on ${formatTitle(lessonId)}. The key takeaway is that successful trading requires discipline, knowledge, and continuous learning.`,
      interactionType: "simple-next"
    }
  ];
  
  // Add difficulty-specific steps
  if (difficulty === 'intermediate' || difficulty === 'advanced') {
    baseSteps.splice(2, 0, {
      id: `${lessonId}_advanced`,
      title: "Advanced Concept",
      content: "This advanced technique can significantly improve your results when applied correctly.",
      interactionType: "info-reveal",
      interactionData: {
        revealContent: "By combining multiple analysis methods and timeframes, you can identify higher-probability trading opportunities with better risk/reward profiles."
      }
    });
  }
  
  return baseSteps;
}
