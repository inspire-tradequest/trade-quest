
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, BarChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { aiApi, MarketTrendResponse } from "@/integrations/supabase/client";
import Chart from "@/components/Chart";
import { Progress } from "@/components/ui/progress";

export default function MarketAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tickers, setTickers] = useState(['AAPL', 'MSFT', 'AMZN', 'GOOG']);
  const [newTicker, setNewTicker] = useState('');
  const [timeframe, setTimeframe] = useState('week');
  const [indicators, setIndicators] = useState<string[]>(['rsi', 'macd', 'moving_average']);
  const [analysis, setAnalysis] = useState<MarketTrendResponse | null>(null);
  
  // Mock data for the chart
  const generateChartData = (ticker: string, trend: 'up' | 'down' | 'sideways') => {
    const days = 30;
    const data = [];
    let currentPrice = 100 + Math.random() * 50;
    
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Create price movement based on trend
      let change;
      if (trend === 'up') {
        change = (Math.random() - 0.3) * 2; // Upward bias
      } else if (trend === 'down') {
        change = (Math.random() - 0.7) * 2; // Downward bias
      } else {
        change = (Math.random() - 0.5) * 2; // Sideways movement
      }
      
      currentPrice = Math.max(currentPrice + change, 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: currentPrice
      });
    }
    
    return data;
  };

  const addTicker = () => {
    if (newTicker && !tickers.includes(newTicker)) {
      setTickers([...tickers, newTicker.toUpperCase()]);
      setNewTicker('');
    }
  };

  const removeTicker = (ticker: string) => {
    setTickers(tickers.filter(t => t !== ticker));
  };

  const toggleIndicator = (indicator: string) => {
    if (indicators.includes(indicator)) {
      setIndicators(indicators.filter(i => i !== indicator));
    } else {
      setIndicators([...indicators, indicator]);
    }
  };

  const analyzeMarket = async () => {
    if (!user) return;
    
    if (tickers.length === 0) {
      toast({
        title: "No assets selected",
        description: "Please add at least one ticker to analyze",
        variant: "destructive",
      });
      return;
    }
    
    if (indicators.length === 0) {
      toast({
        title: "No indicators selected",
        description: "Please select at least one technical indicator",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await aiApi.getMarketTrendAnalysis({
        assets: tickers,
        timeframe: timeframe as any,
        indicators
      });
      
      setAnalysis(response);
      
      toast({
        title: "Market analysis completed",
        description: "AI has analyzed market trends for your selected assets.",
      });
    } catch (error: any) {
      toast({
        title: "Error analyzing market",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Market Trend Analysis</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Get AI-powered market trends and technical analysis
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Parameters</CardTitle>
              <CardDescription>Select assets and indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Timeframe</label>
                <Select
                  value={timeframe}
                  onValueChange={setTimeframe}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">1 Day</SelectItem>
                    <SelectItem value="week">1 Week</SelectItem>
                    <SelectItem value="month">1 Month</SelectItem>
                    <SelectItem value="quarter">3 Months</SelectItem>
                    <SelectItem value="year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Assets</label>
                <div className="flex space-x-2">
                  <Input
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value)}
                    placeholder="Add ticker (e.g., AAPL)"
                  />
                  <Button onClick={addTicker}>Add</Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {tickers.map((ticker) => (
                    <div 
                      key={ticker} 
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                    >
                      {ticker}
                      <button 
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        onClick={() => removeTicker(ticker)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Technical Indicators</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rsi" 
                      checked={indicators.includes('rsi')}
                      onCheckedChange={() => toggleIndicator('rsi')}
                    />
                    <label htmlFor="rsi" className="text-sm">Relative Strength Index (RSI)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="macd" 
                      checked={indicators.includes('macd')}
                      onCheckedChange={() => toggleIndicator('macd')}
                    />
                    <label htmlFor="macd" className="text-sm">Moving Average Convergence Divergence (MACD)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="moving_average" 
                      checked={indicators.includes('moving_average')}
                      onCheckedChange={() => toggleIndicator('moving_average')}
                    />
                    <label htmlFor="moving_average" className="text-sm">Moving Averages</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="bollinger_bands" 
                      checked={indicators.includes('bollinger_bands')}
                      onCheckedChange={() => toggleIndicator('bollinger_bands')}
                    />
                    <label htmlFor="bollinger_bands" className="text-sm">Bollinger Bands</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="volume" 
                      checked={indicators.includes('volume')}
                      onCheckedChange={() => toggleIndicator('volume')}
                    />
                    <label htmlFor="volume" className="text-sm">Volume Analysis</label>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={analyzeMarket} 
                disabled={isLoading} 
                className="w-full"
              >
                {isLoading ? (
                  <>Analyzing Market...</>
                ) : (
                  <>Analyze Market Trends</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {analysis ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Sentiment</CardTitle>
                  <CardDescription>Overall market sentiment based on news, social media, and analyst opinions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Overall Sentiment</div>
                      <div className={`text-xl font-bold ${
                        analysis.marketSentiment.overall === 'positive' ? 'text-green-600' :
                        analysis.marketSentiment.overall === 'negative' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {analysis.marketSentiment.overall.charAt(0).toUpperCase() + analysis.marketSentiment.overall.slice(1)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">News Score</div>
                      <div className="text-xl font-bold">{analysis.marketSentiment.newsScore}/100</div>
                      <Progress 
                        value={analysis.marketSentiment.newsScore} 
                        className={analysis.marketSentiment.newsScore > 50 ? 'bg-green-100' : 'bg-red-100'} 
                      />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Social Media</div>
                      <div className="text-xl font-bold">{analysis.marketSentiment.socialMediaScore}/100</div>
                      <Progress 
                        value={analysis.marketSentiment.socialMediaScore} 
                        className={analysis.marketSentiment.socialMediaScore > 50 ? 'bg-green-100' : 'bg-red-100'} 
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Analysts Consensus</div>
                    <div className="text-base">{analysis.marketSentiment.analystsConsensus}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Asset Analysis</CardTitle>
                  <CardDescription>Technical analysis for your selected assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {analysis.trends.map((trend) => (
                      <div key={trend.assetId} className="border rounded-lg p-4">
                        <div className="flex justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{trend.ticker}</h3>
                            <div className={`text-sm px-2 py-1 rounded inline-block ${
                              trend.currentTrend === 'bullish' ? 'bg-green-100 text-green-800' : 
                              trend.currentTrend === 'bearish' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {trend.currentTrend.charAt(0).toUpperCase() + trend.currentTrend.slice(1)} ({trend.strength}% strength)
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg flex items-center">
                              {trend.prediction.direction === 'up' ? (
                                <ArrowUpRight className="h-5 w-5 text-green-600 mr-1" />
                              ) : trend.prediction.direction === 'down' ? (
                                <ArrowDownRight className="h-5 w-5 text-red-600 mr-1" />
                              ) : (
                                <TrendingUp className="h-5 w-5 text-yellow-600 mr-1" />
                              )}
                              ${trend.prediction.targetPrice.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Target ({trend.prediction.confidence}% confidence)
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <Chart 
                            data={generateChartData(trend.ticker, trend.prediction.direction)}
                            color={trend.prediction.direction === 'up' ? 'green' : 
                                 trend.prediction.direction === 'down' ? 'red' : 'blue'}
                            height={200}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2">Technical Signals</h4>
                            <div className="space-y-2">
                              {trend.signals.map((signal, index) => (
                                <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                  <span>{signal.indicator}</span>
                                  <span className={`font-medium ${
                                    signal.signal === 'buy' ? 'text-green-600' :
                                    signal.signal === 'sell' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>
                                    {signal.signal.toUpperCase()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Support & Resistance</h4>
                            <div className="space-y-2">
                              <div className="text-sm p-2 bg-gray-50 rounded">
                                <div className="flex justify-between">
                                  <span>Resistance</span>
                                  <span className="font-medium">${trend.resistanceLevels[0].toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="text-sm p-2 bg-gray-50 rounded">
                                <div className="flex justify-between">
                                  <span>Support</span>
                                  <span className="font-medium">${trend.supportLevels[0].toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full flex flex-col justify-center items-center p-10 text-center">
              <TrendingUp className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2">No market analysis yet</h3>
              <p className="text-gray-500 mb-6">
                Analyze current market trends for your selected assets using technical indicators and AI.
              </p>
              <Button onClick={analyzeMarket} disabled={isLoading}>
                Analyze Market Trends
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
