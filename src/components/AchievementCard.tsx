
import { useState, useEffect } from 'react';
import { Award, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'award' | 'sparkles';
  progress: number; // 0-100
  unlocked: boolean;
  points: number;
  date?: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  className?: string;
}

const AchievementCard = ({ achievement, className }: AchievementCardProps) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Delay animation for staggered effect
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (achievement.icon) {
      case 'award':
        return <Award className="h-5 w-5" />;
      case 'sparkles':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  return (
    <div 
      className={cn(
        "trading-card relative overflow-hidden transition-all duration-300",
        animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        achievement.unlocked 
          ? "border-trade-blue-100 hover:border-trade-blue-200" 
          : "border-gray-100 hover:border-gray-200",
        className
      )}
    >
      <div className="flex items-start">
        <div 
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center mr-4",
            achievement.unlocked 
              ? "bg-trade-blue-100 text-trade-blue-600" 
              : "bg-gray-100 text-gray-400"
          )}
        >
          {getIcon()}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{achievement.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{achievement.description}</p>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium">{achievement.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  achievement.unlocked ? "bg-trade-blue-500" : "bg-gray-300"
                )}
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
        <div className="text-sm">
          <span className="text-gray-500">Reward: </span>
          <span className="font-medium">{achievement.points} pts</span>
        </div>
        
        {achievement.unlocked ? (
          achievement.date && (
            <div className="text-xs text-gray-500">
              Unlocked on {new Date(achievement.date).toLocaleDateString()}
            </div>
          )
        ) : (
          <div className="flex items-center text-xs text-gray-500">
            <Lock className="h-3 w-3 mr-1" />
            <span>Locked</span>
          </div>
        )}
      </div>
      
      {achievement.unlocked && (
        <div className="absolute top-3 right-3">
          <span className="badge badge-success flex items-center">
            <Award className="h-3 w-3 mr-1" />
            <span>Achieved</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default AchievementCard;
