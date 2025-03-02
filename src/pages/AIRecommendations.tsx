import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, BarChart, AlertCircle, CheckCircle } from "lucide-react";
import { aiApi, RecommendationResponse, AIRecommendation, PortfolioHolding } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

type RiskToleranceType = 'low' | 'medium' | 'high';

export default function AIRecommendations() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState<RiskToleranceType>(profile?.risk_tolerance || 'medium');
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [savedRecommendations, setSavedRecommendations] = useState<AIRecommendation[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user) {
      fetchSavedRecommendations();
    }
  }, [user, refreshTrigger]);

  const fetchSavedRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('recommendation_type', 'investment')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSavedRecommendations(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching recommendations",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRecommendations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get the user's current portfolio
      const { data: portfolioData } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!portfolioData) throw new Error('No portfolio found');
      
      const { data: holdings } = await supabase
        .from('portfolio_holdings')
        .select('asset_id, quantity, current_value')
        .eq('portfolio_id', portfolioData.id);
      
      const currentPortfolio = holdings?.map((h: PortfolioHolding) => ({
        assetId: h.asset_id,
        amount: h.current_value
      })) || [];
      
      const response = await aiApi.getInvestmentRecommendations({
        userId: user.id,
        riskTolerance: riskTolerance,
        investmentGoals: profile?.investment_goals || [],
        timeHorizon: profile?.time_horizon || 'medium',
        currentPortfolio
      });
      
      setRecommendations(response);
      setRefreshTrigger(prev => prev + 1); // Trigger refresh of saved recommendations
      
      toast({
        title: "Recommendations generated",
        description: "AI has analyzed your profile and generated investment recommendations.",
      });
    } catch (error: any) {
      toast({
        title: "Error generating recommendations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('ai_recommendations')
        .update({ is_read: true })
        .eq('id', id);
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error updating recommendation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRiskToleranceChange = (value: string) => {
    setRiskTolerance(value as RiskToleranceType);
  };

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Investment Recommendations</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Get personalized investment recommendations based on your profile and market conditions
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Generate Recommendations</CardTitle>
              <CardDescription>Adjust parameters for AI analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Tolerance</label>
                <Select
                  value={riskTolerance}
                  onValueChange={handleRiskToleranceChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Conservative</SelectItem>
                    <SelectItem value="medium">Moderate</SelectItem>
                    <SelectItem value="high">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={getRecommendations} 
                disabled={isLoading} 
                className="w-full"
              >
                {isLoading ? (
                  <>Analyzing...</>
                ) : (
                  <>Generate Recommendations</>
                )}
              </Button>
              
              {savedRecommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Recent Recommendations</h3>
                  <div className="space-y-2">
                    {savedRecommendations.map((rec) => (
                      <div 
                        key={rec.id} 
                        className={`p-3 rounded-lg border ${rec.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'} cursor-pointer`}
                        onClick={() => {
                          setRecommendations(rec.content);
                          if (!rec.is_read) markAsRead(rec.id);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm">
                              {new Date(rec.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {!rec.is_read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {recommendations ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Analysis</CardTitle>
                  <CardDescription>AI-generated insights about your portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Diversification</div>
                      <div className="text-2xl font-bold mb-2">
                        {recommendations.portfolioMetrics.diversificationScore}/100
                      </div>
                      <Progress value={recommendations.portfolioMetrics.diversificationScore} />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Risk Level</div>
                      <div className="text-2xl font-bold mb-2">
                        {recommendations.portfolioMetrics.riskScore}/100
                      </div>
                      <Progress value={recommendations.portfolioMetrics.riskScore} />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Expected Return</div>
                      <div className="text-2xl font-bold mb-2">
                        {recommendations.portfolioMetrics.expectedAnnualReturn.toFixed(2)}%
                      </div>
                      <Progress 
                        value={recommendations.portfolioMetrics.expectedAnnualReturn} 
                        max={30}
                        className="bg-green-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Investments</CardTitle>
                  <CardDescription>Personalized investment opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h3 className="font-bold">{rec.ticker} - {rec.name}</h3>
                            <div className="text-sm text-gray-500">{rec.type.toUpperCase()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{rec.allocationPercentage}%</div>
                            <div className="text-sm text-gray-500">Allocation</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center mb-2">
                          <div className={`text-sm px-2 py-1 rounded ${
                            rec.riskLevel === 'low' ? 'bg-green-100 text-green-800' : 
                            rec.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {rec.riskLevel} risk
                          </div>
                          <div className="ml-2 text-sm">
                            Expected return: {rec.expectedReturn.average.toFixed(2)}% 
                            <span className="text-gray-500">
                              ({rec.expectedReturn.pessimistic.toFixed(1)}% to {rec.expectedReturn.optimistic.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm mt-2">{rec.rationale}</p>
                        
                        <div className="flex justify-end mt-4">
                          <Button variant="outline" size="sm" className="mr-2">Learn More</Button>
                          <Button size="sm">Add to Watchlist</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full flex flex-col justify-center items-center p-10 text-center">
              <BarChart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2">No recommendations yet</h3>
              <p className="text-gray-500 mb-6">
                Generate personalized investment recommendations based on your risk profile and market conditions.
              </p>
              <Button onClick={getRecommendations} disabled={isLoading}>
                Generate Recommendations
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
