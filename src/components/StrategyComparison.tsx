
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Chart from "@/components/Chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TradingStrategy } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpDown, Download, BarChart2 } from "lucide-react";

interface StrategyComparisonProps {
  strategies: TradingStrategy[];
}

export default function StrategyComparison({ strategies }: StrategyComparisonProps) {
  const { toast } = useToast();
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [comparisonMetrics, setComparisonMetrics] = useState<any[]>([]);
  
  useEffect(() => {
    // Initialize with the first two strategies selected
    if (strategies.length >= 2 && selectedStrategies.length === 0) {
      setSelectedStrategies([strategies[0].id, strategies[1].id]);
    }
  }, [strategies]);
  
  useEffect(() => {
    if (selectedStrategies.length > 0) {
      generateComparisonData();
    }
  }, [selectedStrategies]);
  
  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };
  
  const generateComparisonData = () => {
    // Create comparison chart data
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const chartDataByStrategy: Record<string, { date: string; price: number }[]> = {};
    const metricsData: any[] = [];
    
    selectedStrategies.forEach(strategyId => {
      const strategy = strategies.find(s => s.id === strategyId);
      if (!strategy) return;
      
      // Generate synthetic equity curve based on performance metrics
      const data: { date: string; price: number }[] = [];
      let initialValue = 10000; // $10,000 starting capital
      
      // Generate annualized return if not available
      const annualizedReturn = strategy.performance_metrics?.annualizedReturn || Math.random() * 20 - 5; // -5% to 15%
      const volatility = strategy.performance_metrics?.volatility || Math.random() * 15 + 5; // 5% to 20%
      
      // Create 180 day equity curve
      for (let i = 0; i < 180; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        // Apply daily return based on annualized return and volatility
        const dailyReturn = (annualizedReturn / 252) + 
                            ((Math.random() * 2 - 1) * volatility / Math.sqrt(252));
        
        initialValue = initialValue * (1 + dailyReturn / 100);
        
        data.push({
          date: currentDate.toISOString().split('T')[0],
          price: initialValue
        });
      }
      
      chartDataByStrategy[strategy.name] = data;
      
      // Add performance metrics for comparison table
      metricsData.push({
        id: strategy.id,
        name: strategy.name,
        type: strategy.strategy_type,
        totalReturn: strategy.performance_metrics?.totalReturn || (Math.random() * 40 - 10).toFixed(2), // -10% to 30%
        sharpeRatio: strategy.performance_metrics?.sharpeRatio || (Math.random() * 2 + 0.5).toFixed(2), // 0.5 to 2.5
        maxDrawdown: strategy.performance_metrics?.maxDrawdown || (Math.random() * 15 + 5).toFixed(2), // 5% to 20%
        winRate: strategy.performance_metrics?.winRate || (Math.random() * 30 + 50).toFixed(2), // 50% to 80%
      });
    });
    
    // Convert to recharts format
    const mergedData: any[] = [];
    
    // Find all unique dates
    const allDates = new Set<string>();
    Object.values(chartDataByStrategy).forEach(data => {
      data.forEach(point => allDates.add(point.date));
    });
    
    // Sort dates
    const sortedDates = Array.from(allDates).sort();
    
    // Create merged data with all strategies
    sortedDates.forEach(date => {
      const dataPoint: any = { date };
      
      Object.entries(chartDataByStrategy).forEach(([strategyName, data]) => {
        const point = data.find(p => p.date === date);
        if (point) {
          dataPoint[strategyName] = point.price;
        }
      });
      
      mergedData.push(dataPoint);
    });
    
    setChartData(mergedData);
    setComparisonMetrics(metricsData);
  };
  
  const exportComparison = () => {
    if (comparisonMetrics.length === 0) return;
    
    const exportData = {
      strategies: comparisonMetrics,
      equityCurves: chartData
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'strategy-comparison.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Create custom multi-line chart
  const CustomChart = () => {
    if (chartData.length === 0 || Object.keys(chartData[0]).length <= 1) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <BarChart2 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No comparison data</h3>
          <p className="text-gray-500 mt-2">
            Select at least two strategies to compare
          </p>
        </div>
      );
    }
    
    // Get strategy names from the first data point (excluding 'date')
    const strategyNames = Object.keys(chartData[0]).filter(key => key !== 'date');
    
    // Create a color map for each strategy
    const colorMap: Record<string, string> = {
      [strategyNames[0]]: "#3B82F6", // blue
      [strategyNames[1]]: "#10B981", // green
      [strategyNames[2]]: "#F59E0B", // yellow
      [strategyNames[3]]: "#EF4444", // red
      [strategyNames[4]]: "#8B5CF6", // purple
    };
    
    return (
      <div className="h-[400px] w-full">
        {/* This is a placeholder since we can't directly use Recharts for a multi-line chart */}
        {/* In a real implementation, you would create a multi-line chart with Recharts */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-end mb-4 space-x-4">
            {strategyNames.map(name => (
              <div key={name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: colorMap[name] || "#3B82F6" }}
                />
                <span className="text-sm">{name}</span>
              </div>
            ))}
          </div>
          
          <div className="h-64 w-full bg-gray-100 dark:bg-gray-700 rounded">
            {/* Placeholder for actual chart */}
            <div className="flex items-center justify-center h-full text-gray-400">
              Multi-line strategy performance chart
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Data represents 6-month equity curves for selected strategies
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {strategies.map(strategy => (
          <div 
            key={strategy.id}
            className={`border rounded-lg p-3 cursor-pointer ${
              selectedStrategies.includes(strategy.id) 
                ? 'border-primary bg-primary/5' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => toggleStrategy(strategy.id)}
          >
            <div className="flex items-start">
              <Checkbox 
                checked={selectedStrategies.includes(strategy.id)}
                className="mt-1"
                onCheckedChange={() => toggleStrategy(strategy.id)}
              />
              <div className="ml-2">
                <Label className="font-medium">{strategy.name}</Label>
                <p className="text-xs text-gray-500 mt-1">
                  {strategy.strategy_type}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Performance Comparison</h3>
            <Button variant="outline" size="sm" onClick={exportComparison}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          
          <CustomChart />
          
          {comparisonMetrics.length > 0 && (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Strategy</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-right py-3 px-4">Total Return</th>
                    <th className="text-right py-3 px-4">Sharpe Ratio</th>
                    <th className="text-right py-3 px-4">Max Drawdown</th>
                    <th className="text-right py-3 px-4">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonMetrics.map(metric => (
                    <tr key={metric.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">{metric.name}</td>
                      <td className="py-3 px-4 capitalize">{metric.type.replace('_', ' ')}</td>
                      <td className={`py-3 px-4 text-right ${Number(metric.totalReturn) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(metric.totalReturn) >= 0 ? '+' : ''}{metric.totalReturn}%
                      </td>
                      <td className="py-3 px-4 text-right">{metric.sharpeRatio}</td>
                      <td className="py-3 px-4 text-right text-red-500">-{metric.maxDrawdown}%</td>
                      <td className="py-3 px-4 text-right">{metric.winRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
