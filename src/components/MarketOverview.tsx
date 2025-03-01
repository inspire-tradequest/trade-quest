import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface MarketData {
  symbol: string;
  price: number;
  change: number;
}

const MarketOverview = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([
    { symbol: "AAPL", price: 175.00, change: 0.5 },
    { symbol: "GOOG", price: 2700.00, change: -0.2 },
    { symbol: "TSLA", price: 700.00, change: 1.2 },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate fetching market data
    const fetchMarketData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      setMarketData([
        { symbol: "AAPL", price: 176.50, change: 0.8 },
        { symbol: "GOOG", price: 2705.00, change: 0.1 },
        { symbol: "TSLA", price: 695.00, change: -0.7 },
      ]);
      setIsLoading(false);
    };

    fetchMarketData();
  }, []);

  const refreshMarketData = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate faster refresh
    setMarketData([
      { symbol: "AAPL", price: 177.20, change: 0.4 },
      { symbol: "GOOG", price: 2710.00, change: 0.2 },
      { symbol: "TSLA", price: 702.00, change: 0.9 },
    ]);
    setIsLoading(false);
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Market Overview</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshMarketData}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
        <CardDescription>
          Real-time snapshot of popular stocks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketData.map((item) => (
            <div key={item.symbol} className="space-y-1">
              <p className="text-sm font-medium">{item.symbol}</p>
              <p className="text-xl font-bold">${item.price.toFixed(2)}</p>
              <p
                className={
                  item.change >= 0
                    ? "text-trade-green-500"
                    : "text-trade-red-500"
                }
              >
                {item.change >= 0 ? "+" : ""}
                {item.change.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketOverview;
