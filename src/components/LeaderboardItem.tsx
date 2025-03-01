
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, User as UserIcon, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LeaderboardUser {
  id: string;
  name: string;
  profileImage?: string;
  rank: number;
  previousRank: number;
  points: number;
  winRate: number;
  return: number;
  isCurrentUser?: boolean;
}

interface LeaderboardItemProps {
  user: LeaderboardUser;
  className?: string;
}

const LeaderboardItem = ({ user, className }: LeaderboardItemProps) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, user.rank * 75); // Staggered animation based on rank
    
    return () => clearTimeout(timer);
  }, [user.rank]);

  const rankChange = user.previousRank - user.rank;

  return (
    <div 
      className={cn(
        "trading-card flex items-center transition-all duration-300",
        animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        user.isCurrentUser && "border-trade-blue-200 bg-trade-blue-50/50",
        className
      )}
    >
      <div className="flex items-center">
        <div className="w-10 text-center mr-3">
          {user.rank <= 3 ? (
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center",
              user.rank === 1 && "bg-yellow-100 text-yellow-700",
              user.rank === 2 && "bg-gray-100 text-gray-700",
              user.rank === 3 && "bg-amber-100 text-amber-700",
            )}>
              <Award className="h-4 w-4" />
            </div>
          ) : (
            <span className="text-lg font-semibold text-gray-500">#{user.rank}</span>
          )}
        </div>
        
        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center mr-3 overflow-hidden">
          {user.profileImage ? (
            <img 
              src={user.profileImage} 
              alt={user.name} 
              className="h-full w-full object-cover"
              onLoad={(e) => (e.target as HTMLImageElement).classList.add('loaded')}
              loading="lazy"
            />
          ) : (
            <UserIcon className="h-4 w-4 text-gray-500" />
          )}
        </div>
        
        <div>
          <div className="font-medium flex items-center">
            {user.name}
            {user.isCurrentUser && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-trade-blue-100 text-trade-blue-800 rounded-full">
                You
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-0.5">
            {rankChange > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-trade-green-500 mr-1" />
                <span className="text-trade-green-500">Up {rankChange} {rankChange === 1 ? 'position' : 'positions'}</span>
              </>
            ) : rankChange < 0 ? (
              <>
                <TrendingDown className="h-3 w-3 text-trade-red-500 mr-1" />
                <span className="text-trade-red-500">Down {Math.abs(rankChange)} {Math.abs(rankChange) === 1 ? 'position' : 'positions'}</span>
              </>
            ) : (
              <span>Unchanged</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="ml-auto grid grid-cols-3 gap-4 text-right">
        <div>
          <div className="text-xs text-gray-500">Points</div>
          <div className="font-medium">{user.points.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Win Rate</div>
          <div className="font-medium">{user.winRate}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Return</div>
          <div className={cn(
            "font-medium",
            user.return > 0 ? "text-trade-green-500" : user.return < 0 ? "text-trade-red-500" : ""
          )}>
            {user.return > 0 ? '+' : ''}{user.return}%
          </div>
        </div>
      </div>
      
      <button className="ml-4 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
};

export default LeaderboardItem;
