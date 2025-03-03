
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Share2, Link, Copy, Check, Lock, Globe } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface StrategyShareProps {
  strategyId: string;
  strategyName: string;
  strategyType: string;
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    winRate: number;
  };
}

export default function StrategyShare({ strategyId, strategyName, strategyType, performance }: StrategyShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleShare = async () => {
    if (!user) return;
    
    setIsSharing(true);
    try {
      // Update the strategy visibility in the database
      const { data, error } = await supabase
        .from('trading_strategies')
        .update({
          is_public: isPublic,
          share_note: shareNote,
        })
        .eq('id', strategyId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Generate a share link
      const shareUrl = `${window.location.origin}/strategy/${strategyId}`;
      setShareLink(shareUrl);
      
      toast({
        title: "Strategy shared successfully",
        description: isPublic 
          ? "Your strategy is now publicly available." 
          : "Your strategy link has been created.",
      });
    } catch (error: any) {
      toast({
        title: "Error sharing strategy",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    });
  };
  
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share Strategy
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Trading Strategy</DialogTitle>
          <DialogDescription>
            Let other traders learn from your strategy or keep it private with a shareable link.
          </DialogDescription>
        </DialogHeader>
        
        {!shareLink ? (
          <>
            <div className="space-y-4 py-2">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">{strategyName}</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Type</div>
                      <div className="font-medium">{strategyType}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Return</div>
                      <div className="font-medium">{formatPercent(performance.totalReturn)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Win Rate</div>
                      <div className="font-medium">{formatPercent(performance.winRate)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="public-mode" 
                  checked={isPublic} 
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public-mode" className="flex items-center cursor-pointer">
                  {isPublic ? (
                    <>
                      <Globe className="h-4 w-4 mr-2 text-green-500" />
                      Make publicly visible in community
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2 text-amber-500" />
                      Only visible to people with the link
                    </>
                  )}
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="share-note">Add a note (optional)</Label>
                <Textarea
                  id="share-note"
                  placeholder="Share some thoughts about your strategy..."
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleShare} disabled={isSharing}>
                {isSharing ? "Creating share link..." : "Share Strategy"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-muted p-4">
              <div className="text-sm mb-2 flex items-center">
                <Link className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Share link</span>
              </div>
              <div className="flex items-center">
                <Input 
                  value={shareLink} 
                  readOnly 
                  className="flex-1 pr-12" 
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-[32px]"
                  onClick={copyShareLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-4 flex">
              {isPublic ? (
                <div className="flex text-sm">
                  <Globe className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Publicly visible</p>
                    <p className="text-muted-foreground">
                      Your strategy will appear in the community feed and be discoverable by other users.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex text-sm">
                  <Lock className="h-4 w-4 mr-2 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Private link only</p>
                    <p className="text-muted-foreground">
                      Only people with this link can view your strategy. It won't appear in the community feed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
