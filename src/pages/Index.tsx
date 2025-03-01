
import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Award, 
  BookOpen,
  ArrowRight,
  BarChart, 
  CreditCard, 
  DollarSign,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MarketOverview from '@/components/MarketOverview';
import TradeCard, { TradeData } from '@/components/TradeCard';
import Chart from '@/components/Chart';
import AchievementCard, { Achievement } from '@/components/AchievementCard';
import { cn } from '@/lib/utils';

// Mock data for portfolio chart
const generateChartData = (days: number, startPrice: number) => {
  const data = [];
  let currentPrice = startPrice;
  
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Create more natural-looking price movement
    const change = (Math.random() - 0.48) * 2; // Slight upward bias
    currentPrice = Math.max(currentPrice + change, 0);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: currentPrice
    });
  }
  
  return data;
};

const Index = () => {
  const [portfolioValue, setPortfolioValue] = useState(10000);
  const [portfolioChange, setPortfolioChange] = useState(5.2);
  const [portfolioData, setPortfolioData] = useState(generateChartData(30, 10000));
  const [recentTrades, setRecentTrades] = useState<TradeData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setRecentTrades([
        {
          id: '1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          type: 'buy',
          price: 175.42,
          quantity: 5,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'open'
        },
        {
          id: '2',
          symbol: 'BTC',
          name: 'Bitcoin',
          type: 'sell',
          price: 61245.30,
          quantity: 0.05,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          profit: 150.25,
          status: 'closed'
        }
      ]);
      
      setAchievements([
        {
          id: '1',
          title: 'First Trade',
          description: 'Complete your first trade on the platform',
          icon: 'award',
          progress: 100,
          unlocked: true,
          points: 50,
          date: new Date(Date.now() - 604800000).toISOString()
        },
        {
          id: '2',
          title: 'Market Master',
          description: 'Complete all beginner trading lessons',
          icon: 'sparkles',
          progress: 60,
          unlocked: false,
          points: 100
        }
      ]);
      
      setAnimate(true);
    }, 300);
  }, []);

  const statsItems = [
    { label: 'Account Value', value: `$${portfolioValue.toLocaleString()}`, icon: DollarSign, color: 'bg-trade-blue-50 text-trade-blue-600' },
    { label: 'Trades Made', value: '12', icon: CreditCard, color: 'bg-purple-50 text-purple-600' },
    { label: 'Win Rate', value: '58%', icon: BarChart, color: 'bg-green-50 text-green-600' },
    { label: 'Trading Days', value: '15', icon: Calendar, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 fade-in text-center lg:text-left">
          <div className="badge badge-primary mb-2">Welcome to TradeQuest</div>
          <h1 className="text-3xl font-bold mb-2">Your Trading Dashboard</h1>
          <p className="text-gray-500 max-w-3xl">
            Practice trading in a risk-free environment. Learn strategies, compete with others, and build your trading skills.
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsItems.map((item, index) => (
            <div 
              key={index} 
              className={cn(
                "trading-card",
                animate ? "animate-fade-in" : "opacity-0",
                { "animation-delay-100": index === 1 },
                { "animation-delay-200": index === 2 },
                { "animation-delay-300": index === 3 }
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center mb-3",
                item.color
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="text-sm text-gray-500">{item.label}</div>
              <div className="text-2xl font-bold mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            <div className={cn(
              "trading-card",
              animate ? "animate-fade-in" : "opacity-0"
            )}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Portfolio Performance</h2>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl font-bold mr-2">
                      ${portfolioValue.toLocaleString()}
                    </span>
                    <span className={cn(
                      "flex items-center text-sm",
                      portfolioChange >= 0 ? "text-trade-green-500" : "text-trade-red-500"
                    )}>
                      {portfolioChange >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      )}
                      {portfolioChange >= 0 ? "+" : ""}{portfolioChange}%
                    </span>
                  </div>
                </div>
                <div className="space-x-2">
                  <button className="px-3 py-1 text-sm border border-gray-200 hover:border-gray-300 rounded-md">1D</button>
                  <button className="px-3 py-1 text-sm border border-gray-200 hover:border-gray-300 rounded-md">1W</button>
                  <button className="px-3 py-1 text-sm bg-trade-blue-50 text-trade-blue-600 border border-trade-blue-100 rounded-md">1M</button>
                  <button className="px-3 py-1 text-sm border border-gray-200 hover:border-gray-300 rounded-md">1Y</button>
                </div>
              </div>
              
              <Chart 
                data={portfolioData}
                color="dynamic"
                height={300}
              />
            </div>
            
            <div className={cn(
              "trading-card",
              animate ? "animate-fade-in animation-delay-200" : "opacity-0"
            )}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Recent Trading Activity</h2>
                <Link 
                  to="/simulator" 
                  className="text-trade-blue-600 hover:text-trade-blue-700 text-sm flex items-center"
                >
                  Trade Now
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentTrades.map(trade => (
                  <TradeCard key={trade.id} trade={trade} />
                ))}
                
                {recentTrades.length === 0 && (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">No trades yet</h3>
                    <p className="text-gray-500 text-sm mt-1 mb-4">Start trading to see your activity here</p>
                    <Link 
                      to="/simulator" 
                      className="px-4 py-2 bg-trade-blue-600 hover:bg-trade-blue-700 text-white rounded-md transition-colors"
                    >
                      Start Trading
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-8">
            <MarketOverview />
            
            <div className={cn(
              "trading-card",
              animate ? "animate-fade-in animation-delay-300" : "opacity-0"
            )}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-trade-blue-500 mr-2" />
                  <h2 className="text-lg font-medium">Achievements</h2>
                </div>
                <Link 
                  to="/profile" 
                  className="text-trade-blue-600 hover:text-trade-blue-700 text-sm flex items-center"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {achievements.map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
            
            <div className={cn(
              "trading-card",
              animate ? "animate-fade-in animation-delay-400" : "opacity-0"
            )}>
              <div className="flex items-center mb-4">
                <BookOpen className="h-5 w-5 text-trade-blue-500 mr-2" />
                <h2 className="text-lg font-medium">Learning Progress</h2>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Course Completion</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-trade-blue-500 rounded-full" style={{ width: '25%' }} />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-trade-blue-100 text-trade-blue-600 flex items-center justify-center mr-3">
                      <span className="font-medium">1</span>
                    </div>
                    <div>
                      <div className="font-medium">Trading Basics</div>
                      <div className="text-xs text-gray-500">3/5 lessons completed</div>
                    </div>
                  </div>
                  <Link
                    to="/learn"
                    className="text-trade-blue-600 hover:text-trade-blue-700"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mr-3">
                      <span className="font-medium">2</span>
                    </div>
                    <div>
                      <div className="font-medium">Technical Analysis</div>
                      <div className="text-xs text-gray-500">0/6 lessons completed</div>
                    </div>
                  </div>
                  <Link
                    to="/learn"
                    className="text-trade-blue-600 hover:text-trade-blue-700"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
              
              <Link
                to="/learn"
                className="mt-4 w-full py-2 bg-trade-blue-50 hover:bg-trade-blue-100 text-trade-blue-600 rounded-md transition-colors text-sm font-medium flex items-center justify-center"
              >
                Continue Learning
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
