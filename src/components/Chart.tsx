
import { useEffect, useRef } from 'react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartData {
  date: string;
  price: number;
}

interface ChartProps {
  data: ChartData[];
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showAxis?: boolean;
  height?: number | string;
  className?: string;
  referenceLine?: number;
}

const Chart = ({
  data,
  color = "#3B82F6",
  showGrid = true,
  showTooltip = true,
  showAxis = true,
  height = 300,
  className,
  referenceLine
}: ChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = chartRef.current;
    if (el) {
      el.classList.add('animate-fade-in');
    }
  }, []);

  // Calculate price difference from first to last point
  const priceChange = data.length >= 2 
    ? data[data.length - 1].price - data[0].price 
    : 0;
  
  // Dynamically adjust color based on price movement
  const dynamicColor = priceChange >= 0 ? '#10B981' : '#EF4444';
  const chartColor = color === 'dynamic' ? dynamicColor : color;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100">
          <p className="text-gray-500 text-xs">{label}</p>
          <p className="font-medium text-sm">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={chartRef} className={cn("chart-container", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 20,
            bottom: 5,
          }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#f0f0f0" 
              vertical={false} 
            />
          )}
          
          {showAxis && (
            <>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
            </>
          )}
          
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          
          {referenceLine !== undefined && (
            <ReferenceLine 
              y={referenceLine} 
              stroke="#9CA3AF" 
              strokeDasharray="3 3" 
            />
          )}
          
          <Line
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
            animationDuration={1000}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
