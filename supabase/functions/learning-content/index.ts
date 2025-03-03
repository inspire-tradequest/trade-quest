
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
    const { knowledgeLevel, topics, preferredFormats, courseId } = requestData;

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

    // Check if a specific course is requested
    let responseData;
    if (courseId) {
      responseData = generateCourseContent(courseId, knowledgeLevel);
    } else {
      // Generate recommended learning content
      responseData = generateMockLearningContent(knowledgeLevel, topics, preferredFormats);
    }

    // Simulate an AI service response time
    await new Promise(resolve => setTimeout(resolve, 800));

    // Update the log with the response
    if (requestId) {
      await supabaseClient
        .from('ai_analysis_requests')
        .update({
          status: 'completed',
          response_data: responseData,
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);
    }

    return new Response(JSON.stringify(responseData), {
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

function generateCourseContent(courseId, knowledgeLevel) {
  // Map of course IDs to course content
  const coursesMap = {
    'technical_analysis_basics': generateTechnicalAnalysisCourse(knowledgeLevel),
    'day_trading_essentials': generateDayTradingCourse(knowledgeLevel),
    'options_trading': generateOptionsTrading(knowledgeLevel),
    'crypto_fundamentals': generateCryptoFundamentals(knowledgeLevel),
    'forex_trading_intro': generateForexTrading(knowledgeLevel),
    'risk_management_101': generateRiskManagementCourse(knowledgeLevel)
  };
  
  // Return the requested course or a default one if not found
  return coursesMap[courseId] || generateDefaultCourse(knowledgeLevel);
}

function generateTechnicalAnalysisCourse(level) {
  const difficulty = level || 'beginner';
  
  return {
    course: {
      id: 'technical_analysis_basics',
      title: 'Technical Analysis Fundamentals',
      description: 'Learn how to analyze price charts and identify patterns to make informed trading decisions.',
      difficulty,
      estimatedDuration: 60, // minutes
      xpReward: difficulty === 'beginner' ? 300 : (difficulty === 'intermediate' ? 500 : 750),
      topics: ['charts', 'patterns', 'indicators', 'trend analysis']
    },
    units: [
      {
        id: 'ta_unit1',
        title: 'Chart Types and Timeframes',
        description: 'Understanding different chart types and how to select appropriate timeframes',
        lessons: [
          {
            id: 'ta_lesson1',
            title: 'Introduction to Chart Types',
            format: 'interactive',
            estimatedDuration: 10,
            interactiveContent: [
              {
                id: 'chart_types_step1',
                title: 'Understanding Chart Types',
                content: 'There are several chart types used in technical analysis. Each provides different information and has unique advantages.',
                interactionType: 'info-reveal',
                interactionData: {
                  revealContent: 'The four main chart types are Line Charts, Bar Charts (OHLC), Candlestick Charts, and Point & Figure Charts. Candlestick charts are the most popular for their visual representation of price action.'
                },
                points: 15
              },
              {
                id: 'chart_types_step2',
                title: 'Identify the Chart Type',
                content: 'Can you identify which chart type shows price action most clearly?',
                interactionType: 'clickable-element',
                interactionData: {
                  elements: [
                    { id: 'line_chart', text: 'Line Chart', isCorrect: false },
                    { id: 'bar_chart', text: 'Bar Chart', isCorrect: false },
                    { id: 'candlestick', text: 'Candlestick Chart', isCorrect: true },
                    { id: 'point_figure', text: 'Point & Figure Chart', isCorrect: false }
                  ]
                },
                points: 20
              },
              {
                id: 'chart_types_step3',
                title: 'Candlestick Components',
                content: 'Fill in the blanks to identify the components of a candlestick:',
                interactionType: 'fill-in-blank',
                interactionData: {
                  blanks: [
                    { id: 'blank1', correctAnswer: 'open' },
                    { id: 'blank2', correctAnswer: 'close' },
                    { id: 'blank3', correctAnswer: 'high' },
                    { id: 'blank4', correctAnswer: 'low' }
                  ]
                },
                points: 25
              },
              {
                id: 'chart_types_step4',
                title: 'Timeframe Selection',
                content: 'Which timeframes would be most appropriate for day trading?',
                interactionType: 'multiple-choice',
                interactionData: {
                  options: [
                    { id: 'daily', text: 'Daily and Weekly charts', isCorrect: false },
                    { id: 'monthly', text: 'Monthly charts', isCorrect: false },
                    { id: 'minute', text: '1-minute, 5-minute, and 15-minute charts', isCorrect: true },
                    { id: 'yearly', text: 'Yearly charts', isCorrect: false }
                  ],
                  explanation: 'Day traders typically use shorter timeframes like 1-minute, 5-minute, and 15-minute charts to capture short-term price movements.'
                },
                points: 25
              },
              {
                id: 'chart_types_step5',
                title: 'Key Takeaways',
                content: 'You\'ve learned about different chart types and appropriate timeframes for various trading styles. Remember that choosing the right chart type and timeframe is crucial for effective technical analysis.',
                interactionType: 'simple-next',
                points: 15
              }
            ]
          },
          {
            id: 'ta_lesson2',
            title: 'Mastering Timeframes',
            format: 'interactive',
            estimatedDuration: 15,
            interactiveContent: [
              {
                id: 'timeframes_step1',
                title: 'Multiple Timeframe Analysis',
                content: 'Analyzing multiple timeframes helps confirm trends and identify potential entry and exit points.',
                interactionType: 'info-reveal',
                interactionData: {
                  revealContent: 'A common approach is to use three timeframes: a higher timeframe to identify the overall trend, an intermediate timeframe to identify the trading range, and a lower timeframe to pinpoint entry and exit points.'
                },
                points: 15
              },
              {
                id: 'timeframes_flashcard1',
                title: 'Timeframe Relationships',
                content: 'Test your knowledge of timeframe relationships.',
                interactionType: 'flashcard',
                interactionData: {
                  front: 'What is the relationship between higher and lower timeframes?',
                  back: 'Higher timeframes show the bigger picture and overall trends, while lower timeframes show more detail but also more noise. Higher timeframe signals typically have more significance than lower timeframe signals.'
                },
                points: 20
              }
            ]
          }
        ]
      },
      {
        id: 'ta_unit2',
        title: 'Key Chart Patterns',
        description: 'Recognizing patterns that signal potential price movements',
        lessons: [
          {
            id: 'ta_pattern_lesson1',
            title: 'Reversal Patterns',
            format: 'interactive',
            estimatedDuration: 20,
            interactiveContent: [
              {
                id: 'reversal_patterns_step1',
                title: 'Common Reversal Patterns',
                content: 'Reversal patterns signal that a trend is likely to change direction.',
                interactionType: 'info-reveal',
                interactionData: {
                  revealContent: 'Common reversal patterns include Head and Shoulders, Double Tops and Bottoms, Triple Tops and Bottoms, and Rounded Bottoms (Saucers).'
                },
                points: 15
              },
              {
                id: 'reversal_patterns_step2',
                title: 'Identifying Head and Shoulders',
                content: 'Which of these describes a Head and Shoulders pattern?',
                interactionType: 'multiple-choice',
                interactionData: {
                  options: [
                    { id: 'option1', text: 'Three peaks of the same height', isCorrect: false },
                    { id: 'option2', text: 'A series of higher highs and higher lows', isCorrect: false },
                    { id: 'option3', text: 'A center peak (head) with two lower peaks (shoulders) on either side', isCorrect: true },
                    { id: 'option4', text: 'A straight horizontal line with little price movement', isCorrect: false }
                  ],
                  explanation: 'A Head and Shoulders pattern consists of a center peak (head) with two lower peaks (shoulders) on either side, typically signaling a bearish reversal.'
                },
                points: 25
              }
            ]
          }
        ]
      }
    ],
    assessments: [
      {
        id: 'ta_assessment1',
        title: 'Technical Analysis Fundamentals Assessment',
        questions: [
          {
            text: 'Which chart type is most commonly used for technical analysis?',
            options: [
              'Line Chart',
              'Candlestick Chart',
              'Scatter Plot',
              'Pie Chart'
            ],
            correctAnswerIndex: 1,
            explanation: 'Candlestick charts are the most popular due to their visual representation of price movement, showing open, high, low, and close in a single candle.'
          },
          {
            text: 'What does a bullish engulfing pattern indicate?',
            options: [
              'Potential trend continuation',
              'Potential reversal from downtrend to uptrend',
              'Potential reversal from uptrend to downtrend',
              'Market indecision'
            ],
            correctAnswerIndex: 1,
            explanation: 'A bullish engulfing pattern occurs when a larger green/white candle completely engulfs the previous red/black candle, indicating a potential reversal from a downtrend to an uptrend.'
          }
        ]
      }
    ],
    recommendedNextCourses: ['day_trading_essentials', 'risk_management_101']
  };
}

function generateDayTradingCourse(level) {
  const difficulty = level || 'intermediate';
  
  return {
    course: {
      id: 'day_trading_essentials',
      title: 'Day Trading Essentials',
      description: 'Master the strategies and techniques for successful day trading.',
      difficulty,
      estimatedDuration: 75,
      xpReward: 600,
      topics: ['day trading', 'scalping', 'momentum trading', 'intraday patterns']
    },
    units: [
      {
        id: 'dt_unit1',
        title: 'Day Trading Fundamentals',
        description: 'Core concepts and requirements for day trading',
        lessons: [
          {
            id: 'dt_lesson1',
            title: 'What is Day Trading?',
            format: 'interactive',
            estimatedDuration: 15,
            interactiveContent: [
              {
                id: 'day_trading_def_step1',
                title: 'Definition of Day Trading',
                content: 'Day trading involves opening and closing positions within the same trading day.',
                interactionType: 'info-reveal',
                interactionData: {
                  revealContent: 'Unlike position trading or swing trading, day traders don\'t hold positions overnight, avoiding overnight risk and focusing on intraday price movements to generate profits.'
                },
                points: 15
              },
              {
                id: 'day_trading_def_step2',
                title: 'Day Trading Requirements',
                content: 'Which of these is NOT typically required for day trading?',
                interactionType: 'clickable-element',
                interactionData: {
                  elements: [
                    { id: 'dt_req1', text: 'Real-time market data', isCorrect: false },
                    { id: 'dt_req2', text: 'Low-latency internet connection', isCorrect: false },
                    { id: 'dt_req3', text: 'Long-term fundamental analysis', isCorrect: true },
                    { id: 'dt_req4', text: 'Quick execution platform', isCorrect: false }
                  ]
                },
                points: 20
              }
            ]
          }
        ]
      }
    ],
    assessments: [
      {
        id: 'dt_assessment1',
        title: 'Day Trading Essentials Assessment',
        questions: [
          {
            text: 'What is the primary focus of day trading?',
            options: [
              'Long-term investment returns',
              'Dividend collection',
              'Intraday price movements',
              'Company fundamentals'
            ],
            correctAnswerIndex: 2,
            explanation: 'Day trading focuses primarily on intraday price movements to generate profits, rather than long-term value or dividends.'
          }
        ]
      }
    ],
    recommendedNextCourses: ['technical_analysis_basics', 'risk_management_101']
  };
}

function generateOptionsTrading(level) {
  const difficulty = level || 'advanced';
  
  return {
    course: {
      id: 'options_trading',
      title: 'Options Trading Strategies',
      description: 'Learn advanced options trading strategies for various market conditions.',
      difficulty,
      estimatedDuration: 90,
      xpReward: 800,
      topics: ['options', 'calls', 'puts', 'spreads', 'volatility']
    },
    units: [
      {
        id: 'options_unit1',
        title: 'Options Basics',
        description: 'Fundamental concepts of options contracts',
        lessons: [
          {
            id: 'options_lesson1',
            title: 'Call and Put Options',
            format: 'interactive',
            estimatedDuration: 20,
            interactiveContent: [
              {
                id: 'options_intro_step1',
                title: 'Options Defined',
                content: 'Options are financial derivatives that give buyers the right, but not the obligation, to buy or sell an underlying asset at a specified price before a certain date.',
                interactionType: 'info-reveal',
                interactionData: {
                  revealContent: 'There are two types of options: calls and puts. A call option gives the holder the right to buy an asset at a certain price, while a put option gives the holder the right to sell an asset at a certain price.'
                },
                points: 20
              },
              {
                id: 'options_intro_step2',
                title: 'Options Components',
                content: 'Fill in the blanks with the correct options terminology:',
                interactionType: 'fill-in-blank',
                interactionData: {
                  blanks: [
                    { id: 'options_blank1', correctAnswer: 'strike' },
                    { id: 'options_blank2', correctAnswer: 'premium' },
                    { id: 'options_blank3', correctAnswer: 'expiration' }
                  ]
                },
                points: 30
              }
            ]
          }
        ]
      }
    ],
    assessments: [
      {
        id: 'options_assessment1',
        title: 'Options Trading Assessment',
        questions: [
          {
            text: 'What happens to call option value when the underlying stock price increases?',
            options: [
              'Decreases',
              'Increases',
              'Remains the same',
              'Becomes negative'
            ],
            correctAnswerIndex: 1,
            explanation: 'Call options increase in value when the underlying stock price increases, as they give the right to buy at a fixed price.'
          }
        ]
      }
    ],
    recommendedNextCourses: ['risk_management_101', 'technical_analysis_basics']
  };
}

function generateCryptoFundamentals(level) {
  const difficulty = level || 'beginner';
  
  return {
    course: {
      id: 'crypto_fundamentals',
      title: 'Cryptocurrency Trading Fundamentals',
      description: 'Learn the basics of cryptocurrency markets and trading strategies.',
      difficulty,
      estimatedDuration: 70,
      xpReward: 500,
      topics: ['cryptocurrency', 'blockchain', 'bitcoin', 'altcoins', 'crypto exchanges']
    },
    units: [
      {
        id: 'crypto_unit1',
        title: 'Understanding Cryptocurrencies',
        description: 'Basic concepts of cryptocurrencies and blockchain technology',
        lessons: [
          {
            id: 'crypto_lesson1',
            title: 'What is Blockchain?',
            format: 'interactive',
            estimatedDuration: 15,
            interactiveContent: [
              {
                id: 'blockchain_intro_step1',
                title: 'Blockchain Technology',
                content: 'Blockchain is the underlying technology that powers cryptocurrencies.',
                interactionType: 'info-reveal',
                interactionData: {
                  revealContent: 'A blockchain is a distributed, decentralized, public ledger that records transactions across many computers in a way that the record cannot be altered retroactively without altering all subsequent blocks.'
                },
                points: 15
              },
              {
                id: 'blockchain_intro_step2',
                title: 'Blockchain Properties',
                content: 'Which of these is NOT a characteristic of blockchain technology?',
                interactionType: 'clickable-element',
                interactionData: {
                  elements: [
                    { id: 'blockchain_prop1', text: 'Decentralization', isCorrect: false },
                    { id: 'blockchain_prop2', text: 'Immutability', isCorrect: false },
                    { id: 'blockchain_prop3', text: 'Centralized control', isCorrect: true },
                    { id: 'blockchain_prop4', text: 'Transparency', isCorrect: false }
                  ]
                },
                points: 20
              }
            ]
          }
        ]
      }
    ],
    assessments: [
      {
        id: 'crypto_assessment1',
        title: 'Cryptocurrency Fundamentals Assessment',
        questions: [
          {
            text: 'Which cryptocurrency has the highest market capitalization historically?',
            options: [
              'Ethereum',
              'Bitcoin',
              'Ripple',
              'Dogecoin'
            ],
            correctAnswerIndex: 1,
            explanation: 'Bitcoin has consistently maintained the highest market capitalization in the cryptocurrency market since its inception.'
          }
        ]
      }
    ],
    recommendedNextCourses: ['technical_analysis_basics', 'risk_management_101']
  };
}

function generateForexTrading(level) {
  const difficulty = level || 'intermediate';
  
  return {
    course: {
      id: 'forex_trading_intro',
      title: 'Introduction to Forex Trading',
      description: 'Master the fundamentals of currency trading in the forex market.',
      difficulty,
      estimatedDuration: 80,
      xpReward: 650,
      topics: ['forex', 'currency pairs', 'pips', 'leverage', 'fx market hours']
    },
    units: [
      {
        id: 'forex_unit1',
        title: 'Forex Market Basics',
        description: 'Understanding the forex market structure and participants',
        lessons: [
          {
            id: 'forex_lesson1',
            title: 'Currency Pairs Explained',
            format: 'interactive',
            estimatedDuration: 15,
            interactiveContent: [
              {
                id: 'currency_pairs_step1',
                title: 'Types of Currency Pairs',
                content: 'Currency pairs are categorized into different types based on liquidity and trading volume.',
                interactionType: 'info-reveal',
                interactionData: {
                  revealContent: 'The main categories are Major pairs (e.g., EUR/USD, GBP/USD), Minor pairs (e.g., EUR/GBP, EUR/CHF), and Exotic pairs (e.g., USD/TRY, USD/MXN). Major pairs are the most liquid and have the tightest spreads.'
                },
                points: 15
              },
              {
                id: 'currency_pairs_step2',
                title: 'Base and Quote Currency',
                content: 'In a currency pair like EUR/USD, which is the base currency?',
                interactionType: 'multiple-choice',
                interactionData: {
                  options: [
                    { id: 'base_option1', text: 'USD', isCorrect: false },
                    { id: 'base_option2', text: 'EUR', isCorrect: true },
                    { id: 'base_option3', text: 'Both are base currencies', isCorrect: false },
                    { id: 'base_option4', text: 'Neither is a base currency', isCorrect: false }
                  ],
                  explanation: 'In a currency pair, the first currency (EUR in EUR/USD) is the base currency. The price shows how much of the quote currency (USD) is needed to buy one unit of the base currency (EUR).'
                },
                points: 20
              }
            ]
          }
        ]
      }
    ],
    assessments: [
      {
        id: 'forex_assessment1',
        title: 'Forex Trading Assessment',
        questions: [
          {
            text: 'What is a pip in forex trading?',
            options: [
              'A type of currency',
              'The smallest price movement in a currency pair',
              'A forex trading platform',
              'A type of forex broker'
            ],
            correctAnswerIndex: 1,
            explanation: 'A pip (percentage in point) is the smallest price movement in a currency pair. For most currency pairs, a pip is 0.0001 of the quote currency.'
          }
        ]
      }
    ],
    recommendedNextCourses: ['technical_analysis_basics', 'risk_management_101']
  };
}

function generateRiskManagementCourse(level) {
  const difficulty = level || 'beginner';
  
  return {
    course: {
      id: 'risk_management_101',
      title: 'Risk Management Essentials',
      description: 'Learn how to protect your capital and manage risk effectively in trading.',
      difficulty,
      estimatedDuration: 60,
      xpReward: 450,
      topics: ['risk management', 'position sizing', 'stop loss', 'risk-reward ratio', 'drawdown']
    },
    units: [
      {
        id: 'risk_unit1',
        title: 'Understanding Trading Risk',
        description: 'Foundational concepts of risk in trading and investing',
        lessons: [
          {
            id: 'risk_lesson1',
            title: 'Position Sizing and Risk Per Trade',
            format: 'interactive',
            estimatedDuration: 15,
            interactiveContent: [
              {
                id: 'position_sizing_step1',
                title: 'The 1% Rule',
                content: 'The 1% rule is a common risk management principle in trading.',
                interactionType: 'info-reveal',
                interactionData: {
                  revealContent: 'The 1% rule suggests that you should never risk more than 1% of your trading account on a single trade. This helps preserve capital during losing streaks and ensures longevity in the markets.'
                },
                points: 15
              },
              {
                id: 'position_sizing_step2',
                title: 'Calculating Position Size',
                content: 'If you have a $10,000 account and want to risk 1% per trade with a stop loss of 50 pips on EUR/USD, how many mini lots should you trade?',
                interactionType: 'fill-in-blank',
                interactionData: {
                  blanks: [
                    { id: 'position_blank1', correctAnswer: '2' }
                  ]
                },
                points: 25
              }
            ]
          }
        ]
      }
    ],
    assessments: [
      {
        id: 'risk_assessment1',
        title: 'Risk Management Assessment',
        questions: [
          {
            text: 'What is the primary purpose of a stop-loss order?',
            options: [
              'To maximize profits',
              'To limit potential losses on a trade',
              'To avoid paying taxes on trades',
              'To increase leverage'
            ],
            correctAnswerIndex: 1,
            explanation: 'A stop-loss order is designed to limit potential losses on a trade by automatically closing the position when the price reaches a predetermined level.'
          }
        ]
      }
    ],
    recommendedNextCourses: ['technical_analysis_basics', 'day_trading_essentials']
  };
}

function generateDefaultCourse(level) {
  return generateTechnicalAnalysisCourse(level);
}

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
  
  // Generate short courses
  const shortCourses = [
    {
      id: 'technical_analysis_basics',
      title: 'Technical Analysis Fundamentals',
      description: 'Learn how to analyze price charts and identify patterns to make informed trading decisions.',
      difficulty: 'beginner',
      estimatedDuration: 60, // minutes
      xpReward: 300,
      format: 'interactive',
      completionRate: 0
    },
    {
      id: 'day_trading_essentials',
      title: 'Day Trading Essentials',
      description: 'Master the strategies and techniques for successful day trading.',
      difficulty: 'intermediate',
      estimatedDuration: 75,
      xpReward: 600,
      format: 'interactive',
      completionRate: 0
    },
    {
      id: 'options_trading',
      title: 'Options Trading Strategies',
      description: 'Learn advanced options trading strategies for various market conditions.',
      difficulty: 'advanced',
      estimatedDuration: 90,
      xpReward: 800,
      format: 'interactive',
      completionRate: 0
    },
    {
      id: 'crypto_fundamentals',
      title: 'Cryptocurrency Trading Fundamentals',
      description: 'Learn the basics of cryptocurrency markets and trading strategies.',
      difficulty: 'beginner',
      estimatedDuration: 70,
      xpReward: 500,
      format: 'interactive',
      completionRate: 0
    },
    {
      id: 'forex_trading_intro',
      title: 'Introduction to Forex Trading',
      description: 'Master the fundamentals of currency trading in the forex market.',
      difficulty: 'intermediate',
      estimatedDuration: 80,
      xpReward: 650,
      format: 'interactive',
      completionRate: 0
    },
    {
      id: 'risk_management_101',
      title: 'Risk Management Essentials',
      description: 'Learn how to protect your capital and manage risk effectively in trading.',
      difficulty: 'beginner',
      estimatedDuration: 60,
      xpReward: 450,
      format: 'interactive',
      completionRate: 0
    }
  ];
  
  // Filter courses based on knowledge level
  let filteredCourses = shortCourses;
  if (knowledgeLevel === 'beginner') {
    filteredCourses = shortCourses.filter(c => c.difficulty === 'beginner');
  } else if (knowledgeLevel === 'intermediate') {
    filteredCourses = shortCourses.filter(c => c.difficulty === 'beginner' || c.difficulty === 'intermediate');
  }
  
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
  
  // Generate achievements
  const achievements = [
    {
      id: 'first_lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      xpReward: 50,
      icon: 'trophy',
      unlocked: false
    },
    {
      id: 'course_completion',
      title: 'Course Master',
      description: 'Complete an entire course',
      xpReward: 200,
      icon: 'medal',
      unlocked: false
    },
    {
      id: 'perfect_score',
      title: 'Perfect Score',
      description: 'Get 100% on an assessment',
      xpReward: 150,
      icon: 'award',
      unlocked: false
    },
    {
      id: 'streak_7',
      title: 'Weekly Warrior',
      description: 'Maintain a 7-day learning streak',
      xpReward: 300,
      icon: 'flame',
      unlocked: false
    }
  ];
  
  // Daily challenges
  const dailyChallenges = [
    {
      id: 'daily_lesson',
      title: 'Daily Dose',
      description: 'Complete at least one lesson today',
      xpReward: 75,
      completed: false,
      expiresIn: '24h'
    },
    {
      id: 'quiz_challenge',
      title: 'Quiz Master',
      description: 'Score at least a 80% on any assessment',
      xpReward: 100,
      completed: false,
      expiresIn: '24h'
    }
  ];
  
  return {
    lessons,
    recommendedPath: {
      nextLessons,
      rationale
    },
    assessments,
    shortCourses: filteredCourses,
    achievements,
    dailyChallenges,
    spacedRepetitionTips: [
      "Review concepts 24 hours after first learning them to strengthen memory",
      "Practice a mix of different question types to enhance recall",
      "Return to previously completed lessons weekly for optimal retention"
    ]
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
      },
      points: 15
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
      },
      points: 20
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
      },
      points: 25
    },
    {
      id: `${lessonId}_step4`,
      title: "Review & Summary",
      content: `You've completed the interactive module on ${formatTitle(lessonId)}. The key takeaway is that successful trading requires discipline, knowledge, and continuous learning.`,
      interactionType: "simple-next",
      points: 10
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
      },
      points: 20
    });
  }
  
  // Add a flashcard for spaced repetition
  baseSteps.splice(1, 0, {
    id: `${lessonId}_flashcard1`,
    title: "Key Concept Flashcard",
    content: "Test your knowledge with this flashcard:",
    interactionType: "flashcard",
    interactionData: {
      front: `What is the primary focus of ${formatTitle(lessonId)}?`,
      back: `${formatTitle(lessonId)} focuses on analyzing market data to identify patterns and make informed trading decisions based on historical price action and volume.`
    },
    points: 15
  });
  
  return baseSteps;
}
