
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TradingStrategy, supabase, StrategyAnalysisRequest, StrategyAnalysisResponse } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart2, RefreshCw, Zap, ArrowRight, Check } from "lucide-react";

interface StrategyOptimizationProps {
  strategies: TradingStrategy[];
  onOptimize: () => void;
}

export default function StrategyOptimization({ strategies, onOptimize }: StrategyOptimizationProps) {
  const { toast } = useToast();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategies[0]?.id || "");
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<any | null>(null);
  
  // Optimization parameters
  const [paramRanges, setParamRanges] = useState({
    lookbackPeriod: { min: 5, max: 50, step: 1 },
    threshold: { min: 0.01, max: 0.2, step: 0.01 },
    stopLoss: { min: 0.05, max: 0.3, step: 0.01 },
    takeProfit: { min: 0.1, max: 0.5, step: 0.01 }
  });
  
  // Selected optimization parameter
  const [selectedParam, setSelectedParam] = useState<string>("lookbackPeriod");
  const [parameterValues, setParameterValues] = useState<number[]>([]);
  const [targetMetric, setTargetMetric] = useState<string>("sharpeRatio");
  
  useEffect(() => {
    const strategy = strategies.find(s => s.id === selectedStrategyId);
    setSelectedStrategy(strategy || null);
    
    // Reset results when strategy changes
    setOptimizationResults(null);
    
    // Set parameter values based on selected parameter
    if (strategy) {
      updateParameterValues(strategy, selectedParam);
    }
  }, [selectedStrategyId, strategies]);
  
  useEffect(() => {
    if (selectedStrategy) {
      updateParameterValues(selectedStrategy, selectedParam);
    }
  }, [selectedParam]);
  
  const updateParameterValues = (strategy: TradingStrategy, paramName: string) => {
    const currentValue = strategy.parameters[paramName] || 0;
    const range = paramRanges[paramName as keyof typeof paramRanges];
    
    // Create array of values around the current value
    const values: number[] = [];
    const numSteps = 5; // Number of values on each side
    
    for (let i = -numSteps; i <= numSteps; i++) {
      const value = Number((currentValue + i * range.step).toFixed(2));
      if (value >= range.min && value <= range.max) {
        values.push(value);
      }
    }
    
    // Add min and max if not already included
    if (!values.includes(range.min)) values.unshift(range.min);
    if (!values.includes(range.max)) values.push(range.max);
    
    setParameterValues([...new Set(values)].sort((a, b) => a - b));
  };
  
  const optimizeStrategy = async () => {
    if (!selectedStrategy) return;
    
    try {
      setIsOptimizing(true);
      
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate sample optimization results
      const results = [];
      const basePerformance = {
        totalReturn: Number((Math.random() * 40 - 10).toFixed(2)),
        sharpeRatio: Number((Math.random() * 2 + 0.5).toFixed(2)),
        maxDrawdown: Number((Math.random() * 15 + 5).toFixed(2)),
        winRate: Number((Math.random() * 30 + 50).toFixed(2))
      };
      
      // Generate results for each parameter value
      for (const paramValue of parameterValues) {
        // Random adjustment to the base performance
        const adjustment = (paramValue - selectedStrategy.parameters[selectedParam]) / 10;
        
        results.push({
          paramValue,
          metrics: {
            totalReturn: Number((basePerformance.totalReturn + adjustment * 5).toFixed(2)),
            sharpeRatio: Number((basePerformance.sharpeRatio + adjustment * 0.2).toFixed(2)),
            maxDrawdown: Number((basePerformance.maxDrawdown - adjustment * 2).toFixed(2)),
            winRate: Number((basePerformance.winRate + adjustment * 2).toFixed(2))
          }
        });
      }
      
      // Find optimal value based on target metric
      let optimalResult;
      
      if (targetMetric === 'sharpeRatio' || targetMetric === 'totalReturn' || targetMetric === 'winRate') {
        // Higher is better
        optimalResult = results.reduce((prev, current) => 
          (current.metrics[targetMetric] > prev.metrics[targetMetric]) ? current : prev
        );
      } else if (targetMetric === 'maxDrawdown') {
        // Lower is better
        optimalResult = results.reduce((prev, current) => 
          (current.metrics[targetMetric] < prev.metrics[targetMetric]) ? current : prev
        );
      }
      
      setOptimizationResults({
        parameter: selectedParam,
        results,
        optimalValue: optimalResult?.paramValue,
        currentValue: selectedStrategy.parameters[selectedParam],
        improvement: {
          description: `Optimizing ${selectedParam} could improve ${targetMetric} by approximately ${Math.abs((optimalResult?.metrics[targetMetric] - basePerformance[targetMetric]) / basePerformance[targetMetric] * 100).toFixed(1)}%`,
          metrics: optimalResult?.metrics
        }
      });
      
      toast({
        title: "Optimization completed",
        description: "Strategy optimization analysis has been completed"
      });
    } catch (error: any) {
      toast({
        title: "Error optimizing strategy",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const applyOptimization = async () => {
    if (!selectedStrategy || !optimizationResults?.optimalValue) return;
    
    try {
      const updatedParameters = {
        ...selectedStrategy.parameters,
        [selectedParam]: optimizationResults.optimalValue
      };
      
      await supabase
        .from('trading_strategies')
        .update({
          parameters: updatedParameters
        })
        .eq('id', selectedStrategy.id);
      
      toast({
        title: "Optimization applied",
        description: `${selectedParam} has been updated to ${optimizationResults.optimalValue}`
      });
      
      onOptimize();
      
      // Reset results
      setOptimizationResults(null);
    } catch (error: any) {
      toast({
        title: "Error applying optimization",
        description: error.message,
        variant: "destructive"
      });
    }
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
      </div>
      
      {selectedStrategy && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Optimization Parameters</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Parameter to Optimize</Label>
                  <Select 
                    value={selectedParam} 
                    onValueChange={setSelectedParam}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parameter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lookbackPeriod">Lookback Period</SelectItem>
                      <SelectItem value="threshold">Signal Threshold</SelectItem>
                      <SelectItem value="stopLoss">Stop Loss</SelectItem>
                      <SelectItem value="takeProfit">Take Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Optimization Target</Label>
                  <Select 
                    value={targetMetric} 
                    onValueChange={setTargetMetric}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sharpeRatio">Sharpe Ratio</SelectItem>
                      <SelectItem value="totalReturn">Total Return</SelectItem>
                      <SelectItem value="maxDrawdown">Max Drawdown</SelectItem>
                      <SelectItem value="winRate">Win Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Current Value: {selectedStrategy.parameters[selectedParam]}</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={paramRanges[selectedParam as keyof typeof paramRanges].min} 
                      onChange={(e) => {
                        const newRanges = { ...paramRanges };
                        newRanges[selectedParam as keyof typeof paramRanges].min = Number(e.target.value);
                        setParamRanges(newRanges);
                        updateParameterValues(selectedStrategy, selectedParam);
                      }}
                      className="w-16"
                    />
                    <Slider 
                      value={[selectedStrategy.parameters[selectedParam]]}
                      min={paramRanges[selectedParam as keyof typeof paramRanges].min}
                      max={paramRanges[selectedParam as keyof typeof paramRanges].max}
                      step={paramRanges[selectedParam as keyof typeof paramRanges].step}
                      className="flex-1"
                    />
                    <Input 
                      type="number" 
                      value={paramRanges[selectedParam as keyof typeof paramRanges].max} 
                      onChange={(e) => {
                        const newRanges = { ...paramRanges };
                        newRanges[selectedParam as keyof typeof paramRanges].max = Number(e.target.value);
                        setParamRanges(newRanges);
                        updateParameterValues(selectedStrategy, selectedParam);
                      }}
                      className="w-16"
                    />
                  </div>
                </div>
                
                <Button onClick={optimizeStrategy} disabled={isOptimizing} className="w-full">
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Optimize Parameter
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Optimization Results</h3>
              
              {optimizationResults ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Current: {optimizationResults.currentValue}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-green-500">Optimal: {optimizationResults.optimalValue}</span>
                    </div>
                    <p className="text-sm text-gray-500">{optimizationResults.improvement.description}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Expected Performance Improvement</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        <div className="text-xs text-gray-500">Sharpe Ratio</div>
                        <div className="font-medium">
                          {optimizationResults.improvement.metrics.sharpeRatio}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        <div className="text-xs text-gray-500">Total Return</div>
                        <div className={`font-medium ${optimizationResults.improvement.metrics.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {optimizationResults.improvement.metrics.totalReturn >= 0 ? '+' : ''}
                          {optimizationResults.improvement.metrics.totalReturn}%
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        <div className="text-xs text-gray-500">Max Drawdown</div>
                        <div className="font-medium text-red-500">
                          -{optimizationResults.improvement.metrics.maxDrawdown}%
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        <div className="text-xs text-gray-500">Win Rate</div>
                        <div className="font-medium">
                          {optimizationResults.improvement.metrics.winRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <div className="h-40 flex items-center justify-center">
                      <BarChart2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Parameter optimization chart showing performance across tested values
                    </p>
                  </div>
                  
                  <Button onClick={applyOptimization} className="w-full">
                    <Check className="mr-2 h-4 w-4" />
                    Apply Optimal Value
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <BarChart2 className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No optimization results yet</h3>
                  <p className="text-gray-500 mt-2 mb-6">
                    Run an optimization to find the best parameter values
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
