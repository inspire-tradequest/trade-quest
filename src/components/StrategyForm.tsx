
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { TradingStrategy } from "@/integrations/supabase/client";
import { RefreshCw, Save } from "lucide-react";

interface StrategyFormProps {
  onSave: () => void;
  existingStrategy: TradingStrategy | null;
}

export default function StrategyForm({ onSave, existingStrategy }: StrategyFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState(existingStrategy?.name || "");
  const [description, setDescription] = useState(existingStrategy?.description || "");
  const [strategyType, setStrategyType] = useState<string>(existingStrategy?.strategy_type || "momentum");
  
  // Strategy-specific parameters
  const [lookbackPeriod, setLookbackPeriod] = useState(
    existingStrategy?.parameters?.lookbackPeriod || 14
  );
  const [threshold, setThreshold] = useState(
    existingStrategy?.parameters?.threshold || 0.05
  );
  const [stopLoss, setStopLoss] = useState(
    existingStrategy?.parameters?.stopLoss || 0.10
  );
  const [takeProfit, setTakeProfit] = useState(
    existingStrategy?.parameters?.takeProfit || 0.20
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save strategies",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const strategyData = {
        user_id: user.id,
        name,
        description,
        strategy_type: strategyType,
        parameters: {
          lookbackPeriod: Number(lookbackPeriod),
          threshold: Number(threshold),
          stopLoss: Number(stopLoss),
          takeProfit: Number(takeProfit),
        },
        performance_metrics: {}, // This will be populated after backtesting
      };
      
      if (existingStrategy) {
        // Update existing strategy
        const { error } = await supabase
          .from('trading_strategies')
          .update(strategyData)
          .eq('id', existingStrategy.id);
          
        if (error) throw error;
        
        toast({
          title: "Strategy updated",
          description: "Your trading strategy has been updated successfully",
        });
      } else {
        // Create new strategy
        const { error } = await supabase
          .from('trading_strategies')
          .insert(strategyData);
          
        if (error) throw error;
        
        toast({
          title: "Strategy created",
          description: "Your trading strategy has been created successfully",
        });
      }
      
      onSave();
      
      // Reset form if creating new strategy
      if (!existingStrategy) {
        setName("");
        setDescription("");
      }
      
    } catch (error: any) {
      toast({
        title: "Error saving strategy",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Strategy Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Trading Strategy"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your strategy"
        />
      </div>
      
      <div className="space-y-3">
        <Label>Strategy Type</Label>
        <RadioGroup
          value={strategyType}
          onValueChange={setStrategyType}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
            <RadioGroupItem value="momentum" id="momentum" />
            <Label htmlFor="momentum" className="cursor-pointer">Momentum</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
            <RadioGroupItem value="mean_reversion" id="mean_reversion" />
            <Label htmlFor="mean_reversion" className="cursor-pointer">Mean Reversion</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
            <RadioGroupItem value="trend_following" id="trend_following" />
            <Label htmlFor="trend_following" className="cursor-pointer">Trend Following</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
            <RadioGroupItem value="breakout" id="breakout" />
            <Label htmlFor="breakout" className="cursor-pointer">Breakout</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="lookbackPeriod">Lookback Period (days)</Label>
          <Input
            id="lookbackPeriod"
            type="number"
            min="1"
            max="200"
            value={lookbackPeriod}
            onChange={(e) => setLookbackPeriod(Number(e.target.value))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="threshold">Signal Threshold (%)</Label>
          <Input
            id="threshold"
            type="number"
            step="0.01"
            min="0.01"
            max="20"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stopLoss">Stop Loss (%)</Label>
          <Input
            id="stopLoss"
            type="number"
            step="0.01"
            min="0.01"
            max="50"
            value={stopLoss}
            onChange={(e) => setStopLoss(Number(e.target.value))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="takeProfit">Take Profit (%)</Label>
          <Input
            id="takeProfit"
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            value={takeProfit}
            onChange={(e) => setTakeProfit(Number(e.target.value))}
            required
          />
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {existingStrategy ? "Update Strategy" : "Save Strategy"}
          </>
        )}
      </Button>
    </form>
  );
}
