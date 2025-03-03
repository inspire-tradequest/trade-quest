
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { StrategyAnalysisResponse } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface StrategyResultsProps {
  strategy: {
    id: string;
    name: string;
    parameters: Record<string, any>;
    strategyType: string;
    timeframe: {
      start: string;
      end: string;
    };
    initialCapital: number;
    assets: string[];
  };
  onSaveStrategy: () => void;
}

export default function StrategyResults({ strategy, onSaveStrategy }: StrategyResultsProps) {
  const [results, setResults] = useState<StrategyAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("performance");
  const { toast } = useToast();

  const runBacktest = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('trading-strategy-analysis', {
        body: {
          strategyType: strategy.strategyType,
          parameters: strategy.parameters,
          assets: strategy.assets,
          timeframe: strategy.timeframe,
          initialCapital: strategy.initialCapital
        }
      });

      if (error) throw error;
      
      setResults(data as StrategyAnalysisResponse);
    } catch (error: any) {
      toast({
        title: "Error running backtest",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format percentage values
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Format trade data for chart
  const getChartData = () => {
    if (!results?.trades) return [];
    
    let cumulativeReturn = 0;
    return results.trades.map((trade, index) => {
      cumulativeReturn += trade.profitPercentage;
      return {
        name: `Trade ${index + 1}`,
        date: new Date(trade.exitDate).toLocaleDateString(),
        profit: trade.profit,
        profitPercentage: trade.profitPercentage,
        cumulativeReturn,
        asset: trade.asset
      };
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Strategy Backtest Results</span>
          <div>
            {!results && (
              <Button onClick={runBacktest} disabled={isLoading}>
                {isLoading ? "Running..." : "Run Backtest"}
              </Button>
            )}
            {results && (
              <Button variant="outline" onClick={onSaveStrategy} className="ml-2">
                Save Strategy
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{formatPercent(results.performance.totalReturn)}</div>
                    <div className="text-muted-foreground">Total Return</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{formatPercent(results.performance.annualizedReturn)}</div>
                    <div className="text-muted-foreground">Annualized Return</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{results.performance.sharpeRatio.toFixed(2)}</div>
                    <div className="text-muted-foreground">Sharpe Ratio</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{formatPercent(results.performance.maxDrawdown)}</div>
                    <div className="text-muted-foreground">Max Drawdown</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{formatPercent(results.performance.winRate)}</div>
                    <div className="text-muted-foreground">Win Rate</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{formatPercent(results.performance.volatility)}</div>
                    <div className="text-muted-foreground">Volatility</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="trades">
              {/* Trades table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Asset</th>
                      <th className="text-left py-2">Direction</th>
                      <th className="text-left py-2">Entry Date</th>
                      <th className="text-left py-2">Entry Price</th>
                      <th className="text-left py-2">Exit Date</th>
                      <th className="text-left py-2">Exit Price</th>
                      <th className="text-right py-2">Profit</th>
                      <th className="text-right py-2">Profit %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.trades.map((trade, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-2">{trade.asset}</td>
                        <td className="py-2">
                          <span className={trade.direction === 'buy' ? 'text-green-600' : 'text-red-600'}>
                            {trade.direction.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2">{new Date(trade.entryDate).toLocaleDateString()}</td>
                        <td className="py-2">${trade.entryPrice.toFixed(2)}</td>
                        <td className="py-2">{new Date(trade.exitDate).toLocaleDateString()}</td>
                        <td className="py-2">${trade.exitPrice.toFixed(2)}</td>
                        <td className={`py-2 text-right ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${trade.profit.toFixed(2)}
                        </td>
                        <td className={`py-2 text-right ${trade.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(trade.profitPercentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="chart">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cumulativeReturn" stroke="#8884d8" name="Cumulative Return" />
                    <Line type="monotone" dataKey="profitPercentage" stroke="#82ca9d" name="Trade Return %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="optimization">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Suggested Parameter Changes</h3>
                  <div className="space-y-3">
                    {results.optimization.suggestedChanges.map((suggestion, index) => (
                      <div key={index} className="flex items-start p-3 border rounded-md">
                        <div className="mr-3 mt-0.5">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <div className="font-medium">{suggestion.parameter}</div>
                          <div className="text-sm text-muted-foreground">
                            Change from <span className="font-mono">{JSON.stringify(suggestion.currentValue)}</span> to{" "}
                            <span className="font-mono">{JSON.stringify(suggestion.suggestedValue)}</span>
                          </div>
                          <div className="text-sm mt-1">{suggestion.expectedImprovement}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Alternative Strategies</h3>
                  <div className="space-y-3">
                    {results.optimization.alternativeStrategies.map((altStrategy, index) => (
                      <div key={index} className="p-3 border rounded-md">
                        <div className="font-medium">{altStrategy.name}</div>
                        <div className="text-sm text-muted-foreground">{altStrategy.description}</div>
                        <div className="text-sm mt-1 text-green-600">{altStrategy.potentialImprovement}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <div className="inline-block p-3 rounded-full bg-muted mb-4">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No Results Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              Run the backtest to see how your strategy would have performed historically.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
