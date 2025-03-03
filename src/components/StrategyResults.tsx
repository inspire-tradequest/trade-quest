
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Chart from "@/components/Chart";
import { TradingStrategy, supabase, StrategyAnalysisRequest, StrategyAnalysisResponse } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Download, TrendingUp, TrendingDown, Percent, DollarSign, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import TradeCard from "@/components/TradeCard";

interface StrategyResultsProps {
  strategies: TradingStrategy[];
}

export default function StrategyResults({ strategies }: StrategyResultsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategies[0]?.id || "");
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<StrategyAnalysisResponse | null>(null);
  const [chartData, setChartData] = useState<{ date: string; price: number }[]>([]);
  
  // Time periods for backtesting
  const [timeframe, setTimeframe] = useState<"1m" | "3m" | "6m" | "1y" | "max">("6m");
  
  useEffect(() => {
    const strategy = strategies.find(s => s.id === selectedStrategyId);
    setSelectedStrategy(strategy || null);
    
    // Reset results when strategy changes
    setResult(null);
  }, [selectedStrategyId, strategies]);
  
  // Generate sample chart data
  useEffect(() => {
    if (result) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      
      // Generate equity curve from performance data
      const data: { date: string; price: number }[] = [];
      let initialValue = 10000; // $10,000 starting capital
      
      // Create 180 day equity curve
      for (let i = 0; i < 180; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        // Apply daily return based on annualized return and volatility
        const dailyReturn = (result.performance.annualizedReturn / 252) + 
                            ((Math.random() * 2 - 1) * result.performance.volatility / Math.sqrt(252));
        
        initialValue = initialValue * (1 + dailyReturn / 100);
        
        data.push({
          date: currentDate.toISOString().split('T')[0],
          price: initialValue
        });
      }
      
      setChartData(data);
    }
  }, [result]);
  
  const runBacktest = async () => {
    if (!selectedStrategy || !user) return;
    
    try {
      setIsRunning(true);
      
      // Prepare request for strategy analysis
      const request: StrategyAnalysisRequest = {
        strategyType: selectedStrategy.strategy_type as any,
        parameters: selectedStrategy.parameters,
        assets: ["AAPL", "MSFT", "GOOGL", "AMZN"], // Sample assets
        timeframe: {
          start: getStartDate(timeframe),
          end: new Date().toISOString()
        },
        initialCapital: 10000 // $10,000 starting capital
      };
      
      // Call Supabase Edge Function to analyze strategy
      const analysisResult = await supabase.aiApi.analyzeStrategy(request);
      setResult(analysisResult);
      
      // Update strategy with performance metrics
      if (selectedStrategy.id) {
        await supabase
          .from('trading_strategies')
          .update({
            performance_metrics: analysisResult.performance
          })
          .eq('id', selectedStrategy.id);
      }
      
      toast({
        title: "Backtest completed",
        description: "Strategy analysis has been completed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error running backtest",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const getStartDate = (period: string): string => {
    const date = new Date();
    switch (period) {
      case "1m":
        date.setMonth(date.getMonth() - 1);
        break;
      case "3m":
        date.setMonth(date.getMonth() - 3);
        break;
      case "6m":
        date.setMonth(date.getMonth() - 6);
        break;
      case "1y":
        date.setFullYear(date.getFullYear() - 1);
        break;
      case "max":
        date.setFullYear(date.getFullYear() - 5);
        break;
    }
    return date.toISOString();
  };
  
  const exportResults = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `strategy-backtest-${selectedStrategy?.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-72">
          <Select 
            value={selectedStrategyId} 
            onValueChange={setSelectedStrategyId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a strategy" />
            </SelectTrigger>
            <SelectContent>
              {strategies.map(strategy => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select 
            value={timeframe} 
            onValueChange={(value) => setTimeframe(value as any)}
          >
            <SelectTrigger className="w-full sm:w-24">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="max">Max</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={runBacktest} disabled={isRunning || !selectedStrategy}>
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              "Run Backtest"
            )}
          </Button>
          
          {result && (
            <Button variant="outline" onClick={exportResults}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>
      
      {selectedStrategy && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {result ? (
              <div>
                <div className="p-6">
                  <Chart 
                    data={chartData} 
                    height={300} 
                    color={result.performance.totalReturn > 0 ? "#10B981" : "#EF4444"}
                  />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-t">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Total Return</div>
                    <div className="flex items-center text-xl font-semibold">
                      {result.performance.totalReturn >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                      )}
                      {result.performance.totalReturn.toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Sharpe Ratio</div>
                    <div className="flex items-center text-xl font-semibold">
                      {result.performance.sharpeRatio.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Max Drawdown</div>
                    <div className="flex items-center text-xl font-semibold">
                      <Percent className="h-5 w-5 text-red-500 mr-1" />
                      {result.performance.maxDrawdown.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Win Rate</div>
                    <div className="flex items-center text-xl font-semibold">
                      <Percent className="h-5 w-5 text-green-500 mr-1" />
                      {result.performance.winRate.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                {result.trades && result.trades.length > 0 && (
                  <div className="p-6 border-t">
                    <h3 className="text-lg font-medium mb-4">Trade History</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {result.trades.slice(0, 5).map((trade, index) => (
                        <TradeCard 
                          key={index}
                          trade={{
                            id: `trade-${index}`,
                            symbol: trade.asset,
                            name: trade.asset,
                            type: trade.direction,
                            price: trade.entryPrice,
                            quantity: 1, // Placeholder
                            timestamp: trade.entryDate,
                            profit: trade.profit,
                            status: 'closed'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No backtest results yet</h3>
                <p className="text-gray-500 mt-2">
                  Run a backtest to view performance metrics and trade history
                </p>
                <Button 
                  className="mt-4" 
                  onClick={runBacktest} 
                  disabled={isRunning || !selectedStrategy}
                >
                  Run Backtest
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
