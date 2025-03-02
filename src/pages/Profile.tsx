
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, LogOut, Upload, Trophy } from "lucide-react";
import ProgressBar from "@/components/ui/progress-bar";

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateProfile = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and update your profile information
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-xl">
                    {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{profile?.username || user?.email}</CardTitle>
              <CardDescription>Trader Level {profile?.level || 1}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <ProgressBar value={(profile?.experience_points || 0) % 100} className="flex-1 mr-4" />
                <span className="text-sm text-gray-500">{profile?.experience_points || 0} XP</span>
              </div>
              <Button className="w-full" variant="outline" onClick={() => {}}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Avatar
              </Button>
              <Button className="w-full" variant="destructive" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Set your username" 
                />
              </div>
              <Button onClick={updateProfile} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your earned badges and rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Trophy className="h-8 w-8 text-yellow-500 mb-1" />
                    <span className="text-xs text-center">Beginner Trader</span>
                  </div>
                ))}
                {Array(2).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg opacity-40">
                    <Trophy className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-center">Locked</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
