
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Zap, Clock, User, Users } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string | null;
  performance_score: number;
  rank: number;
  level: number;
  experience_points: number;
  top_asset: string | null;
  trades_count: number;
  win_rate: number;
  is_current_user: boolean;
}

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'alltime'>('week');
  const [category, setCategory] = useState<'performance' | 'experience' | 'trades'>('performance');
  const { user } = useAuth();
  
  useEffect(() => {
    fetchLeaderboardData();
  }, [timeframe, category, user]);
  
  const fetchLeaderboardData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-leaderboard', {
        body: {
          userId: user.id,
          timeframe,
          category
        }
      });
      
      if (error) throw error;
      
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2: return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3: return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-white border-gray-200';
    }
  };
  
  const getCategoryIcon = () => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'experience': return <Zap className="h-5 w-5 text-purple-500" />;
      case 'trades': return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <TrendingUp className="h-5 w-5 text-green-500" />;
    }
  };
  
  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'alltime': return 'All Time';
      default: return 'This Week';
    }
  };
  
  const getCategoryLabel = () => {
    switch (category) {
      case 'performance': return 'Trading Performance';
      case 'experience': return 'Experience Points';
      case 'trades': return 'Trading Activity';
      default: return 'Trading Performance';
    }
  };
  
  const getScoreLabel = () => {
    switch (category) {
      case 'performance': return 'Return';
      case 'experience': return 'XP';
      case 'trades': return 'Trades';
      default: return 'Score';
    }
  };
  
  const formatScore = (score: number) => {
    switch (category) {
      case 'performance': return `${score.toFixed(2)}%`;
      case 'experience': return score.toLocaleString();
      case 'trades': return score.toLocaleString();
      default: return score.toLocaleString();
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-primary" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top traders in the community</CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <TabsList>
              <TabsTrigger 
                value="week" 
                onClick={() => setTimeframe('week')}
                className={timeframe === 'week' ? 'bg-primary text-primary-foreground' : ''}
              >
                Week
              </TabsTrigger>
              <TabsTrigger 
                value="month" 
                onClick={() => setTimeframe('month')}
                className={timeframe === 'month' ? 'bg-primary text-primary-foreground' : ''}
              >
                Month
              </TabsTrigger>
              <TabsTrigger 
                value="alltime" 
                onClick={() => setTimeframe('alltime')}
                className={timeframe === 'alltime' ? 'bg-primary text-primary-foreground' : ''}
              >
                All Time
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={category} onValueChange={(value) => setCategory(value as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="performance">
              <TrendingUp className="mr-2 h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="experience">
              <Zap className="mr-2 h-4 w-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="trades">
              <Clock className="mr-2 h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={category} className="mt-0">
            <div className="text-sm text-muted-foreground mb-4 flex items-center">
              {getCategoryIcon()} 
              <span className="ml-2">{getCategoryLabel()} - {getTimeframeLabel()}</span>
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No data available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to join the leaderboard!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboardData.map((userData) => (
                  <div 
                    key={userData.id}
                    className={`flex items-center p-3 rounded-md border ${
                      userData.is_current_user ? 'border-primary bg-primary/5' : 'border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 font-medium text-sm border ${getPositionStyle(userData.rank)}`}>
                      {userData.rank}
                    </div>
                    
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={userData.avatar_url || undefined} alt={userData.username} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium">{userData.username}</span>
                        {userData.is_current_user && (
                          <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                        <span className="flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          Level {userData.level}
                        </span>
                        {userData.top_asset && (
                          <span className="ml-2 border-l pl-2">
                            Top: {userData.top_asset}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">{formatScore(userData.performance_score)}</div>
                      <div className="text-xs text-muted-foreground">{getScoreLabel()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
