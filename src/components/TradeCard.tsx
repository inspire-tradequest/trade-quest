
import { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Clock, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TradeData {
  id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: string;
  profit?: number;
  status: 'open' | 'closed';
}

interface TradeCardProps {
  trade: TradeData;
  onClose?: (id: string) => void;
}

const TradeCard = ({ trade, onClose }: TradeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const totalValue = trade.price * trade.quantity;
  const profitClass = trade.profit
    ? trade.profit > 0
      ? 'text-trade-green-500'
      : 'text-trade-red-500'
    : '';

  return (
    <div 
      className={cn(
        "trading-card overflow-hidden",
        animateIn ? "animate-scale-in" : "opacity-0",
        isExpanded ? "shadow-xl" : ""
      )}
    >
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center">
          <div 
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center mr-3",
              trade.type === 'buy' ? "bg-trade-green-500/10" : "bg-trade-red-500/10"
            )}
          >
            {trade.type === 'buy' ? (
              <ArrowUpCircle className="h-5 w-5 text-trade-green-500" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-trade-red-500" />
            )}
          </div>
          <div>
            <div className="font-medium">{trade.symbol}</div>
            <div className="text-xs text-gray-500">{trade.name}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-semibold">${trade.price.toFixed(2)}</div>
          <div className="text-xs text-gray-500">{formatDate(trade.timestamp)}</div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Quantity</div>
              <div className="font-medium">{trade.quantity}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Value</div>
              <div className="font-medium">${totalValue.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="font-medium flex items-center">
                {trade.status === 'open' ? (
                  <>
                    <Clock className="h-3 w-3 text-trade-blue-500 mr-1" />
                    <span>Open</span>
                  </>
                ) : (
                  <>
                    <Layers className="h-3 w-3 text-gray-500 mr-1" />
                    <span>Closed</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">P/L</div>
              <div className={cn("font-medium", profitClass)}>
                {trade.profit ? (
                  <>
                    {trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}
                  </>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
          </div>
          
          {trade.status === 'open' && onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(trade.id);
              }}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors text-sm font-medium"
            >
              Close Position
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TradeCard;
