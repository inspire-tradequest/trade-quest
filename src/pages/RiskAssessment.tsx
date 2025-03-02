
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, BarChart, ArrowDown, ArrowUp, Info } from "lucide-react";
import { aiApi, RiskAssessmentResponse } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export default function RiskAssessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [timeHorizon, setTimeHorizon] = useState(12); // Default 12 months
  const [customAssets, setCustomAssets] = useState<{assetId: string, ticker: string, weight: number}[]>([
    { assetId: 'aapl', ticker: 'AAPL', weight: 25 },
    { assetId: 'msft', ticker: 'MSFT', weight: 25 },
    { assetId: 'amzn', ticker: 'AMZN', weight: 25 },
    { assetId: 'goog', ticker: 'GOOG', weight: 25 }
  ]);
  const [assessment, setAssessment] = useState<RiskAssessmentResponse | null>(null);

  const updateAssetWeight = (index: number, weight: number) => {
    const newAssets = [...customAssets];
    newAssets[index].weight = weight;
    setCustomAssets(newAssets);
  };

  const addAsset = () => {
    setCustomAssets([...customAssets, { assetId: '', ticker: '', weight: 0 }]);
  };

  const removeAsset = (index: number) => {
    const newAssets = [...customAssets];
    newAssets.splice(index, 1);
    setCustomAssets(newAssets);
  };

  const updateAssetTicker = (index: number, ticker: string) => {
    const newAssets = [...customAssets];
    newAssets[index].ticker = ticker;
    newAssets[index].assetId = ticker.toLowerCase();
    setCustomAssets(newAssets);
  };

  const analyzeRisk = async () => {
    if (!user) return;
    
    // Validate total weight is 100%
    const totalWeight = customAssets.reduce((sum, asset) => sum + asset.weight, 0);
    if (Math.abs(totalWeight - 100) > 1) {
      toast({
        title: "Invalid allocation",
        description: "Asset weights must sum to 100%",
        variant: "destructive",
      });
      return;
    }
    
    // Validate all tickers are filled
    if (customAssets.some(asset => !asset.ticker)) {
      toast({
        title: "Missing information",
        description: "Please provide a ticker for all assets",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const assets = customAssets.map(asset => ({
        assetId: asset.assetId,
        weight: asset.weight
      }));
      
      const response = await aiApi.getRiskAssessment({
        assets,
        timeHorizon
      });
      
      setAssessment(response);
      
      toast({
        title: "Risk assessment completed",
        description: "AI has analyzed your portfolio risk profile.",
      });
    } catch (error: any) {
      toast({
        title: "Error analyzing risk",
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
        <h1 className="text-3xl font-bold">Portfolio Risk Assessment</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Evaluate the risk profile of your investment portfolio
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Composition</CardTitle>
              <CardDescription>Define your portfolio allocation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Investment Timeframe (months)</label>
                <Select
                  value={timeHorizon.toString()}
                  onValueChange={(value) => setTimeHorizon(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">1 year</SelectItem>
                    <SelectItem value="24">2 years</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Assets</label>
                  <div className="text-sm text-gray-500">
                    Total: {customAssets.reduce((sum, asset) => sum + asset.weight, 0)}%
                  </div>
                </div>
                
                {customAssets.map((asset, index) => (
                  <div key={index} className="flex space-x-2 items-center">
                    <Input
                      value={asset.ticker}
                      onChange={(e) => updateAssetTicker(index, e.target.value)}
                      placeholder="Ticker"
                      className="w-24"
                    />
                    <Input
                      type="number"
                      value={asset.weight}
                      onChange={(e) => updateAssetWeight(index, parseInt(e.target.value) || 0)}
                      placeholder="Weight %"
                      min="0"
                      max="100"
                      className="w-20"
                    />
                    <span className="text-sm">%</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeAsset(index)}
                      disabled={customAssets.length <= 1}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addAsset}
                  className="w-full"
                >
                  + Add Asset
                </Button>
              </div>
              
              <Button 
                onClick={analyzeRisk} 
                disabled={isLoading} 
                className="w-full"
              >
                {isLoading ? (
                  <>Analyzing Risk...</>
                ) : (
                  <>Analyze Risk</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {assessment ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Risk Analysis</CardTitle>
                    <div className={`text-sm px-3 py-1 rounded-full ${
                      assessment.overallRiskScore < 40 ? 'bg-green-100 text-green-800' : 
                      assessment.overallRiskScore < 70 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {assessment.overallRiskScore < 40 ? 'Low Risk' : 
                       assessment.overallRiskScore < 70 ? 'Medium Risk' : 
                       'High Risk'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-500">Risk Score</span>
                      <span className="font-medium">{assessment.overallRiskScore}/100</span>
                    </div>
                    <Progress value={assessment.overallRiskScore} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Volatility</div>
                      <div className="text-xl font-bold">
                        {assessment.volatilityMetrics.standardDeviation.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500">Standard Deviation</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Max Drawdown</div>
                      <div className="text-xl font-bold text-red-600">
                        -{assessment.volatilityMetrics.maxDrawdown.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500">Potential Loss</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Sharpe Ratio</div>
                      <div className="text-xl font-bold">
                        {assessment.volatilityMetrics.sharpeRatio.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Risk-Adjusted Return</div>
                    </div>
                  </div>
                  
                  <h3 className="font-medium mb-3">Risk Breakdown</h3>
                  <div className="space-y-3 mb-6">
                    {Object.entries(assessment.riskBreakdown).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} Risk</span>
                          <span>{value}%</span>
                        </div>
                        <Progress value={value} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Analysis</CardTitle>
                  <CardDescription>How your portfolio might perform in different market conditions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(assessment.scenarioAnalysis).map(([scenario, impact]) => (
                      <div key={scenario} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{scenario.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className="text-sm text-gray-500">Estimated impact</div>
                        </div>
                        <div className={`flex items-center ${
                          impact < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {impact < 0 ? (
                            <ArrowDown className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowUp className="h-4 w-4 mr-1" />
                          )}
                          <span className="font-bold">{impact.toFixed(2)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full flex flex-col justify-center items-center p-10 text-center">
              <AlertTriangle className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2">No risk assessment yet</h3>
              <p className="text-gray-500 mb-6">
                Analyze the risk profile of your portfolio based on asset allocation and market conditions.
              </p>
              <Button onClick={analyzeRisk} disabled={isLoading}>
                Analyze Portfolio Risk
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
