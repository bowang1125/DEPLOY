import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

interface ChartComponentProps {
  data?: CandlestickData[];
  width?: number;
  height?: number;
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}

export const ChartComponent = ({
  data = [],
  width = 600,
  height = 300,
  colors = {
    backgroundColor: '#1f2937',
    lineColor: '#3b82f6',
    textColor: '#d1d5db',
    areaTopColor: '#3b82f6',
    areaBottomColor: 'rgba(59, 130, 246, 0.1)',
  },
}: ChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('ChartComponent: 初始化圖表，數據點數量:', data.length);
    
    // 檢查數據格式
    if (data.length > 0) {
      console.log('ChartComponent: 數據樣本:', data[0]);
    }

    // 清除之前的圖表
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    try {
      // 創建新圖表
      const chart = createChart(chartContainerRef.current, {
        width,
        height,
        layout: {
          background: { type: ColorType.Solid, color: colors.backgroundColor || '#1f2937' },
          textColor: colors.textColor || '#d1d5db',
        },
        grid: {
          vertLines: {
            color: 'rgba(42, 46, 57, 0.6)',
          },
          horzLines: {
            color: 'rgba(42, 46, 57, 0.6)',
          },
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.3)',
          timeVisible: true,
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: 'rgba(59, 130, 246, 0.5)',
            style: 0,
          },
          horzLine: {
            width: 1,
            color: 'rgba(59, 130, 246, 0.5)',
            style: 0,
          },
        },
        handleScroll: {
          vertTouchDrag: true,
        },
      });

      // 添加蠟燭圖系列
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      // 設置數據
      if (data.length > 0) {
        console.log('ChartComponent: 設置蠟燭圖數據');
        
        // 確保時間格式正確 (檢查是否需要轉換為毫秒)
        const formattedData = data.map(item => {
          // 如果時間是秒級時間戳，轉換為毫秒
          const time = typeof item.time === 'number' && item.time < 10000000000 
            ? item.time * 1000 
            : item.time;
            
          return {
            ...item,
            time
          };
        });
        
        candlestickSeries.setData(formattedData);
        console.log('ChartComponent: 數據設置完成');
      } else {
        console.warn('ChartComponent: 沒有數據可顯示');
      }

      // 保存引用
      chartRef.current = chart;
      seriesRef.current = candlestickSeries;

      // 調整大小以適應容器
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !entries[0].contentRect) return;
        const { width: newWidth, height: newHeight } = entries[0].contentRect;
        chart.resize(newWidth, newHeight);
      });

      resizeObserver.observe(chartContainerRef.current);

      // 清理函數
      return () => {
        console.log('ChartComponent: 清理圖表');
        resizeObserver.disconnect();
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current = null;
        }
      };
    } catch (error) {
      console.error('ChartComponent: 創建圖表時出錯:', error);
    }
  }, [data, width, height, colors]);

  // 更新數據
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      console.log('ChartComponent: 更新圖表數據');
      
      // 確保時間格式正確
      const formattedData = data.map(item => {
        // 如果時間是秒級時間戳，轉換為毫秒
        const time = typeof item.time === 'number' && item.time < 10000000000 
          ? item.time * 1000 
          : item.time;
          
        return {
          ...item,
          time
        };
      });
      
      seriesRef.current.setData(formattedData);
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default ChartComponent;
