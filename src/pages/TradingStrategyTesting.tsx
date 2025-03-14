
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TradingStrategy } from "@/integrations/supabase/client";
import { Sliders, BarChart3, Zap, Share2, Play } from "lucide-react";
import StrategyForm from "@/components/StrategyForm";
import StrategyResults from "@/components/StrategyResults";
import StrategyComparison from "@/components/StrategyComparison";
import StrategyOptimization from "@/components/StrategyOptimization";

// Define the proper type structure for our Trading Strategy to match what StrategyResults expects
interface FullTradingStrategy {
  id: string;
  name: string;
  parameters: Record<string, any>;
  strategyType: string;
  timeframe: { start: string; end: string; };
  initialCapital: number;
  assets: string[];
}

export default function TradingStrategyTesting() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<FullTradingStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("create");
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchStrategies();
    }
  }, [user]);

  const fetchStrategies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('trading_strategies')
        .select('*')
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setStrategies(data || []);
      
      // Convert the first strategy to the expected format if available
      if (data && data.length > 0) {
        const strategy = data[0];
        setSelectedStrategy({
          id: strategy.id,
          name: strategy.name || 'Unnamed Strategy',
          parameters: strategy.parameters || {},
          strategyType: strategy.strategy_type || 'custom',
          timeframe: {
            start: strategy.start_date || '2023-01-01',
            end: strategy.end_date || '2023-12-31'
          },
          initialCapital: strategy.initial_capital || 10000,
          assets: strategy.assets || ['BTC', 'ETH']
        });
      }
    } catch (error: any) {
      toast({
        title: "Error fetching strategies",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Trading Strategy Testing</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Create, test, and optimize your trading strategies
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 max-w-2xl mb-4">
          <TabsTrigger value="create">
            <Sliders className="h-4 w-4 mr-2" />
            Create
          </TabsTrigger>
          <TabsTrigger value="backtest">
            <Play className="h-4 w-4 mr-2" />
            Backtest
          </TabsTrigger>
          <TabsTrigger value="compare">
            <BarChart3 className="h-4 w-4 mr-2" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="optimize">
            <Zap className="h-4 w-4 mr-2" />
            Optimize
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Strategy</CardTitle>
              <CardDescription>
                Define your trading strategy parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StrategyForm 
                onSave={fetchStrategies} 
                existingStrategy={null}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backtest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backtest Results</CardTitle>
              <CardDescription>
                View the performance of your strategy on historical data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strategies.length > 0 && selectedStrategy ? (
                <StrategyResults 
                  strategy={selectedStrategy} 
                  onSaveStrategy={fetchStrategies} 
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No strategies to test</p>
                  <Button onClick={() => setActiveTab("create")}>
                    Create Your First Strategy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compare Strategies</CardTitle>
              <CardDescription>
                Compare the performance of multiple strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strategies.length > 1 ? (
                <StrategyComparison strategies={strategies} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Need at least two strategies to compare</p>
                  <Button onClick={() => setActiveTab("create")}>
                    Create More Strategies
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimize Strategy</CardTitle>
              <CardDescription>
                Fine-tune your strategy parameters for better performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strategies.length > 0 ? (
                <StrategyOptimization strategies={strategies} onOptimize={fetchStrategies} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No strategies to optimize</p>
                  <Button onClick={() => setActiveTab("create")}>
                    Create Your First Strategy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
