
import { useState, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle,
  Info,
  BookOpen,
  History,
  AlertTriangle,
  DollarSign,
  Percent,
  RefreshCcw
} from 'lucide-react';
import Chart from '@/components/Chart';
import TradeCard, { TradeData } from '@/components/TradeCard';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Mock data generation for the price chart
const generatePriceData = (days: number, volatility: number = 1, trend: number = 0) => {
  const data = [];
  let price = 100;
  
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate a more realistic price movement with some randomness
    const change = ((Math.random() - 0.5) * volatility) + (trend * 0.01);
    price = Math.max(price * (1 + change), 0.1);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(2))
    });
  }
  
  return data;
};

const Simulator = () => {
  const [currentAsset, setCurrentAsset] = useState({
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.42,
    change: 1.25,
    changePercent: 0.72
  });
  
  const [priceData, setPriceData] = useState(generatePriceData(30, 2));
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState(1);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [accountValue, setAccountValue] = useState(10000);
  const [loadingChart, setLoadingChart] = useState(false);
  
  const assets = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.42, change: 1.25, changePercent: 0.72 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 192.36, change: -2.45, changePercent: -1.26 },
    { symbol: 'MSFT', name: 'Microsoft', price: 415.56, change: 3.22, changePercent: 0.78 },
    { symbol: 'AMZN', name: 'Amazon', price: 182.41, change: 0.65, changePercent: 0.36 },
    { symbol: 'BTC', name: 'Bitcoin', price: 61245.30, change: 1527.83, changePercent: 2.56 },
    { symbol: 'ETH', name: 'Ethereum', price: 3423.91, change: 78.32, changePercent: 2.34 },
  ];

  useEffect(() => {
    // Load any saved trades from localStorage
    const savedTrades = localStorage.getItem('tradequest_trades');
    if (savedTrades) {
      setTrades(JSON.parse(savedTrades));
    }
    
    const savedAccountValue = localStorage.getItem('tradequest_account');
    if (savedAccountValue) {
      setAccountValue(JSON.parse(savedAccountValue));
    }
  }, []);
  
  // Save trades to localStorage when they change
  useEffect(() => {
    localStorage.setItem('tradequest_trades', JSON.stringify(trades));
  }, [trades]);
  
  useEffect(() => {
    localStorage.setItem('tradequest_account', JSON.stringify(accountValue));
  }, [accountValue]);

  const changeAsset = (symbol: string) => {
    setLoadingChart(true);
    const asset = assets.find(a => a.symbol === symbol);
    if (asset) {
      setCurrentAsset(asset);
      
      // Generate new price data with different volatility based on asset
      let volatility = 2;
      let trend = 0;
      
      if (symbol === 'BTC' || symbol === 'ETH') {
        volatility = 4; // Crypto is more volatile
        trend = 0.5; // Slight upward trend
      } else if (symbol === 'TSLA') {
        volatility = 3; // Tesla is volatile
        trend = 0;
      } else if (symbol === 'AAPL' || symbol === 'MSFT') {
        volatility = 1.5; // Blue chips are less volatile
        trend = 0.2; // Slight upward trend
      }
      
      setTimeout(() => {
        setPriceData(generatePriceData(30, volatility, trend));
        setLoadingChart(false);
      }, 500);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setQuantity(value);
    }
  };

  const executeTrade = () => {
    if (quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a quantity greater than 0",
        variant: "destructive"
      });
      return;
    }

    const tradeValue = currentAsset.price * quantity;
    
    if (tradeType === 'buy' && tradeValue > accountValue) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough funds to place this trade",
        variant: "destructive"
      });
      return;
    }

    // Create new trade
    const newTrade: TradeData = {
      id: Date.now().toString(),
      symbol: currentAsset.symbol,
      name: currentAsset.name,
      type: tradeType,
      price: currentAsset.price,
      quantity: quantity,
      timestamp: new Date().toISOString(),
      status: 'open'
    };

    // Update account value
    if (tradeType === 'buy') {
      setAccountValue(prev => prev - tradeValue);
    } else {
      setAccountValue(prev => prev + tradeValue);
    }

    // Add to trades
    setTrades(prev => [newTrade, ...prev]);

    toast({
      title: "Trade executed",
      description: `${tradeType === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${currentAsset.symbol} at $${currentAsset.price}`,
      variant: "default"
    });

    // Reset quantity
    setQuantity(1);
  };

  const closeTrade = (id: string) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;

    // Calculate profit/loss
    const currentPrice = currentAsset.price;
    const tradePrice = trade.price;
    const tradeValue = trade.quantity * tradePrice;
    const currentValue = trade.quantity * currentPrice;
    let profit = 0;

    if (trade.type === 'buy') {
      profit = currentValue - tradeValue;
      setAccountValue(prev => prev + currentValue);
    } else {
      profit = tradeValue - currentValue;
      setAccountValue(prev => prev - currentValue);
    }

    // Update trade
    setTrades(prev => prev.map(t => 
      t.id === id 
        ? { ...t, status: 'closed', profit } 
        : t
    ));

    toast({
      title: "Position closed",
      description: `Closed ${trade.symbol} position with ${profit >= 0 ? 'profit' : 'loss'} of $${Math.abs(profit).toFixed(2)}`,
      variant: profit >= 0 ? "default" : "destructive"
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="badge badge-primary mb-2">Trading Simulator</div>
          <h1 className="text-3xl font-bold mb-2">Practice Trading</h1>
          <p className="text-gray-500 max-w-3xl">
            Simulate real market trading with virtual money. Learn to trade without risk.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - Chart and asset selector */}
          <div className="lg:col-span-2 space-y-6">
            <div className="trading-card">
              <div className="flex flex-wrap items-center justify-between mb-6">
                <div>
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold mr-3">{currentAsset.symbol}</h2>
                    <span className="text-gray-500">{currentAsset.name}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-xl font-semibold mr-2">
                      ${currentAsset.price.toLocaleString()}
                    </span>
                    <span className={cn(
                      "flex items-center",
                      currentAsset.change >= 0 ? "text-trade-green-500" : "text-trade-red-500"
                    )}>
                      {currentAsset.change >= 0 ? (
                        <ArrowUpCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 mr-1" />
                      )}
                      {currentAsset.change >= 0 ? "+" : ""}{currentAsset.change} ({currentAsset.change >= 0 ? "+" : ""}{currentAsset.changePercent}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex mt-4 lg:mt-0">
                  <button 
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-trade-blue-50 text-trade-blue-600 ml-2"
                    onClick={() => {
                      setPriceData(generatePriceData(30, 2));
                      setLoadingChart(true);
                      setTimeout(() => setLoadingChart(false), 500);
                    }}
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                  <button 
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 ml-2"
                    title="Technical Analysis"
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                  <button 
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 ml-2"
                    title="Historical Data"
                  >
                    <History className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {loadingChart ? (
                <div className="chart-container flex items-center justify-center bg-gray-50">
                  <div className="animate-pulse-subtle text-gray-400">Loading chart...</div>
                </div>
              ) : (
                <Chart 
                  data={priceData}
                  color={currentAsset.change >= 0 ? '#10B981' : '#EF4444'}
                  height={350}
                />
              )}
              
              <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {assets.map(asset => (
                  <button
                    key={asset.symbol}
                    onClick={() => changeAsset(asset.symbol)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md transition-all",
                      currentAsset.symbol === asset.symbol
                        ? "bg-trade-blue-50 text-trade-blue-600 font-medium"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    {asset.symbol}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Trade execution section */}
            <div className="trading-card">
              <h3 className="text-lg font-bold mb-4">Execute Trade</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trade Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTradeType('buy')}
                        className={cn(
                          "py-2 rounded-md flex items-center justify-center transition-colors",
                          tradeType === 'buy' 
                            ? "bg-trade-green-500 text-white" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <ArrowUpCircle className="h-4 w-4 mr-2" />
                        Buy
                      </button>
                      <button
                        onClick={() => setTradeType('sell')}
                        className={cn(
                          "py-2 rounded-md flex items-center justify-center transition-colors",
                          tradeType === 'sell' 
                            ? "bg-trade-red-500 text-white" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <ArrowDownCircle className="h-4 w-4 mr-2" />
                        Sell
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <div className="relative">
                      <input
                        id="quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-trade-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Order Summary</h4>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Market Price</span>
                      <span className="font-medium">${currentAsset.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Quantity</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Estimated Cost</span>
                      <span className="font-medium">${(currentAsset.price * quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Account Balance</span>
                      <span className="font-medium">${accountValue.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {tradeType === 'buy' && accountValue < currentAsset.price * quantity && (
                    <div className="flex items-start text-xs text-trade-red-500 mb-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                      <span>
                        Insufficient funds. Your account balance is less than the trade amount.
                      </span>
                    </div>
                  )}
                  
                  <button
                    onClick={executeTrade}
                    disabled={quantity <= 0 || (tradeType === 'buy' && accountValue < currentAsset.price * quantity)}
                    className={cn(
                      "w-full py-3 rounded-md font-medium transition-colors",
                      tradeType === 'buy' 
                        ? "bg-trade-green-500 hover:bg-trade-green-600 text-white" 
                        : "bg-trade-red-500 hover:bg-trade-red-600 text-white",
                      (quantity <= 0 || (tradeType === 'buy' && accountValue < currentAsset.price * quantity))
                        && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {tradeType === 'buy' ? 'Buy' : 'Sell'} {currentAsset.symbol}
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-xs flex items-start text-gray-500">
                <Info className="h-3.5 w-3.5 mt-0.5 mr-1 flex-shrink-0" />
                <span>
                  This is a simulated trading environment. No real money is involved. Practice trading risk-free.
                </span>
              </div>
            </div>
          </div>
          
          {/* Right column - Trade history */}
          <div className="space-y-6">
            <div className="trading-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Portfolio Summary</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-500">Account Value</span>
                  </div>
                  <div className="text-xl font-bold">${accountValue.toFixed(2)}</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Percent className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-500">Total Return</span>
                  </div>
                  <div className="text-xl font-bold">
                    {accountValue > 10000 
                      ? `+${((accountValue / 10000 - 1) * 100).toFixed(2)}%` 
                      : `${((accountValue / 10000 - 1) * 100).toFixed(2)}%`}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Assets Breakdown</h4>
                <div className="h-10 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-trade-blue-500" style={{ width: '45%' }} />
                  <div className="h-full bg-trade-green-500" style={{ width: '30%' }} />
                  <div className="h-full bg-amber-500" style={{ width: '25%' }} />
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-trade-blue-500 rounded-full mr-1" />
                    <span>Stocks (45%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-trade-green-500 rounded-full mr-1" />
                    <span>Crypto (30%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-amber-500 rounded-full mr-1" />
                    <span>Cash (25%)</span>
                  </div>
                </div>
              </div>
            </div>
          
            <div className="trading-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Open Positions</h3>
              </div>
              
              <div className="space-y-3">
                {trades.filter(t => t.status === 'open').length > 0 ? (
                  trades
                    .filter(t => t.status === 'open')
                    .map(trade => (
                      <TradeCard 
                        key={trade.id} 
                        trade={trade}
                        onClose={closeTrade} 
                      />
                    ))
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-500">No open positions</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="trading-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Trade History</h3>
              </div>
              
              <div className="space-y-3">
                {trades.filter(t => t.status === 'closed').length > 0 ? (
                  trades
                    .filter(t => t.status === 'closed')
                    .slice(0, 3)
                    .map(trade => (
                      <TradeCard key={trade.id} trade={trade} />
                    ))
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-500">No trade history</div>
                  </div>
                )}
              </div>
              
              {trades.filter(t => t.status === 'closed').length > 3 && (
                <button className="mt-4 w-full py-2 text-trade-blue-600 bg-trade-blue-50 hover:bg-trade-blue-100 rounded-md text-sm transition-colors">
                  View All History
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
