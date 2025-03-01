
import { useState, useEffect } from 'react';
import { 
  LineChart, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp,
  Refresh
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock market data
const mockMarkets = [
  { id: 1, name: 'S&P 500', symbol: 'SPY', price: 478.25, change: 1.25, changePercent: 0.26 },
  { id: 2, name: 'NASDAQ', symbol: 'QQQ', price: 435.92, change: -0.87, changePercent: -0.2 },
  { id: 3, name: 'Bitcoin', symbol: 'BTC', price: 61245.30, change: 1527.83, changePercent: 2.56 },
  { id: 4, name: 'Apple', symbol: 'AAPL', price: 175.42, change: 0.86, changePercent: 0.49 },
  { id: 5, name: 'Tesla', symbol: 'TSLA', price: 192.36, change: -2.45, changePercent: -1.26 },
];

const MarketOverview = () => {
  const [markets, setMarkets] = useState(mockMarkets);
  const [loading, setLoading] = useState(false);

  // Simulate refreshing market data
  const refreshMarkets = () => {
    setLoading(true);
    setTimeout(() => {
      const updatedMarkets = markets.map(market => {
        const changeMultiplier = Math.random() > 0.5 ? 1 : -1;
        const changeAmount = parseFloat((Math.random() * 2).toFixed(2));
        const newPrice = parseFloat((market.price + (changeAmount * changeMultiplier)).toFixed(2));
        const newChange = parseFloat((newPrice - market.price + market.change).toFixed(2));
        const newChangePercent = parseFloat(((newChange / newPrice) * 100).toFixed(2));
        
        return {
          ...market,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent
        };
      });
      
      setMarkets(updatedMarkets);
      setLoading(false);
    }, 800);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshMarkets, 30000);
    return () => clearInterval(interval);
  }, [markets]);

  return (
    <div className="trading-card">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 text-trade-blue-500 mr-2" />
          <h2 className="text-lg font-medium">Market Overview</h2>
        </div>
        <button 
          onClick={refreshMarkets} 
          disabled={loading}
          className="text-gray-500 hover:text-trade-blue-500 transition-colors"
        >
          <Refresh className={cn(
            "w-5 h-5", 
            loading && "animate-spin"
          )} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="font-medium pb-2">Asset</th>
              <th className="font-medium pb-2">Price</th>
              <th className="font-medium pb-2">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {markets.map((market) => (
              <tr 
                key={market.id} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 pr-2">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <LineChart className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-medium">{market.symbol}</div>
                      <div className="text-xs text-gray-500">{market.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-2">
                  <span className="font-medium">${market.price.toLocaleString()}</span>
                </td>
                <td className="py-3">
                  <div className="flex items-center">
                    {market.change >= 0 ? (
                      <ArrowUpCircle className="h-4 w-4 text-trade-green-500 mr-1" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-trade-red-500 mr-1" />
                    )}
                    <span className={cn(
                      "font-medium",
                      market.change >= 0 ? "text-trade-green-500" : "text-trade-red-500"
                    )}>
                      {market.change >= 0 ? "+" : ""}{market.change} ({market.change >= 0 ? "+" : ""}{market.changePercent}%)
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketOverview;
