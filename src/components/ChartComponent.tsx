import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData, LineStyle } from 'lightweight-charts';
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
  indicators?: {
    ma?: number[][];
    ema?: number[][];
    macd?: {
      macd: number[];
      signal: number[];
      histogram: number[];
    };
    rsi?: number[];
    bollingerBands?: {
      upper: number[];
      middle: number[];
      lower: number[];
    };
    volume?: number[];
    fibonacci?: {
      levels: { [key: string]: number };
      trend: 'up' | 'down';
    };
  };
  activeIndicators?: {
    ma?: boolean;
    ema?: boolean;
    macd?: boolean;
    rsi?: boolean;
    bollingerBands?: boolean;
    volume?: boolean;
    fibonacci?: boolean;
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
  indicators = {},
  activeIndicators = {},
}: ChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const indicatorSeriesRef = useRef<{[key: string]: ISeriesApi<any>}>({});

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
      indicatorSeriesRef.current = {};
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
          secondsVisible: false,
          tickMarkFormatter: (time) => {
            const date = new Date(time * 1000);
            return date.toLocaleDateString('zh-TW', {
              month: '2-digit',
              day: '2-digit',
            });
          },
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
        
        // 確保時間格式正確
        const formattedData = data.map(item => {
          // 確保時間格式正確
          let time = item.time;
          
          // 如果是數字類型的時間戳
          if (typeof time === 'number') {
            // 如果是秒級時間戳（小於10000000000），轉換為毫秒
            if (time < 10000000000) {
              time = time * 1000;
            }
          }
          
          // 確保時間是UTC時間
          const date = new Date(time);
          
          return {
            ...item,
            time: date.getTime() / 1000 // 轉回秒級時間戳，因為圖表庫需要
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
          indicatorSeriesRef.current = {};
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
        // 確保時間格式正確
        let time = item.time;
        
        // 如果是數字類型的時間戳
        if (typeof time === 'number') {
          // 如果是秒級時間戳（小於10000000000），轉換為毫秒
          if (time < 10000000000) {
            time = time * 1000;
          }
        }
        
        // 確保時間是UTC時間
        const date = new Date(time);
        
        return {
          ...item,
          time: date.getTime() / 1000 // 轉回秒級時間戳，因為圖表庫需要
        };
      });
      
      seriesRef.current.setData(formattedData);
    }
  }, [data]);

  // 處理指標顯示
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || data.length === 0) return;

    console.log('ChartComponent: 更新技術指標');
    
    // 清除所有現有指標
    Object.values(indicatorSeriesRef.current).forEach(series => {
      if (chartRef.current) {
        chartRef.current.removeSeries(series);
      }
    });
    indicatorSeriesRef.current = {};

    // 準備時間數據
    const times = data.map(item => {
      let time = item.time;
      if (typeof time === 'number' && time < 10000000000) {
        time = time * 1000;
      }
      const date = new Date(time);
      return date.getTime() / 1000;
    });

    // 添加MA指標
    if (activeIndicators.ma && indicators.ma && indicators.ma.length > 0) {
      indicators.ma.forEach((maValues, index) => {
        if (maValues && maValues.length > 0) {
          const maData: LineData[] = [];
          
          for (let i = 0; i < Math.min(times.length, maValues.length); i++) {
            if (maValues[i] !== null) {
              maData.push({
                time: times[i],
                value: maValues[i]
              });
            }
          }
          
          const colors = ['#f59e0b', '#10b981', '#3b82f6'];
          const maSeries = chartRef.current?.addLineSeries({
            color: colors[index % colors.length],
            lineWidth: 2,
            title: `MA${[10, 20, 50][index % 3]}`,
          });
          
          if (maSeries) {
            maSeries.setData(maData);
            indicatorSeriesRef.current[`ma${index}`] = maSeries;
          }
        }
      });
    }

    // 添加EMA指標
    if (activeIndicators.ema && indicators.ema && indicators.ema.length > 0) {
      indicators.ema.forEach((emaValues, index) => {
        if (emaValues && emaValues.length > 0) {
          const emaData: LineData[] = [];
          
          for (let i = 0; i < Math.min(times.length, emaValues.length); i++) {
            if (emaValues[i] !== null) {
              emaData.push({
                time: times[i],
                value: emaValues[i]
              });
            }
          }
          
          const colors = ['#ec4899', '#8b5cf6', '#06b6d4'];
          const emaSeries = chartRef.current?.addLineSeries({
            color: colors[index % colors.length],
            lineWidth: 2,
            lineStyle: LineStyle.Dotted,
            title: `EMA${[12, 26, 50][index % 3]}`,
          });
          
          if (emaSeries) {
            emaSeries.setData(emaData);
            indicatorSeriesRef.current[`ema${index}`] = emaSeries;
          }
        }
      });
    }

    // 添加MACD指標
    if (activeIndicators.macd && indicators.macd) {
      const { macd, signal, histogram } = indicators.macd;
      
      if (macd && macd.length > 0) {
        // 創建MACD線
        const macdData: LineData[] = [];
        for (let i = 0; i < Math.min(times.length, macd.length); i++) {
          if (macd[i] !== null) {
            macdData.push({
              time: times[i],
              value: macd[i]
            });
          }
        }
        
        const macdSeries = chartRef.current?.addLineSeries({
          color: '#3b82f6',
          lineWidth: 2,
          title: 'MACD',
          priceScaleId: 'macd',
          priceFormat: {
            type: 'price',
            precision: 4,
            minMove: 0.0001,
          },
        });
        
        if (macdSeries) {
          macdSeries.setData(macdData);
          indicatorSeriesRef.current.macd = macdSeries;
        }
      }
      
      if (signal && signal.length > 0) {
        // 創建信號線
        const signalData: LineData[] = [];
        for (let i = 0; i < Math.min(times.length, signal.length); i++) {
          if (signal[i] !== null) {
            signalData.push({
              time: times[i],
              value: signal[i]
            });
          }
        }
        
        const signalSeries = chartRef.current?.addLineSeries({
          color: '#ef4444',
          lineWidth: 2,
          title: 'Signal',
          priceScaleId: 'macd',
          priceFormat: {
            type: 'price',
            precision: 4,
            minMove: 0.0001,
          },
        });
        
        if (signalSeries) {
          signalSeries.setData(signalData);
          indicatorSeriesRef.current.signal = signalSeries;
        }
      }
      
      if (histogram && histogram.length > 0) {
        // 創建柱狀圖
        const histogramData: LineData[] = [];
        for (let i = 0; i < Math.min(times.length, histogram.length); i++) {
          if (histogram[i] !== null) {
            histogramData.push({
              time: times[i],
              value: histogram[i],
              color: histogram[i] >= 0 ? '#10b981' : '#ef4444'
            });
          }
        }
        
        const histogramSeries = chartRef.current?.addHistogramSeries({
          color: '#10b981',
          title: 'Histogram',
          priceScaleId: 'macd',
          priceFormat: {
            type: 'price',
            precision: 4,
            minMove: 0.0001,
          },
        });
        
        if (histogramSeries) {
          histogramSeries.setData(histogramData);
          indicatorSeriesRef.current.histogram = histogramSeries;
        }
      }
    }

    // 添加RSI指標
    if (activeIndicators.rsi && indicators.rsi && indicators.rsi.length > 0) {
      const rsiData: LineData[] = [];
      
      for (let i = 0; i < Math.min(times.length, indicators.rsi.length); i++) {
        if (indicators.rsi[i] !== null) {
          rsiData.push({
            time: times[i],
            value: indicators.rsi[i]
          });
        }
      }
      
      const rsiSeries = chartRef.current?.addLineSeries({
        color: '#8b5cf6',
        lineWidth: 2,
        title: 'RSI',
        priceScaleId: 'rsi',
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });
      
      if (rsiSeries) {
        rsiSeries.setData(rsiData);
        indicatorSeriesRef.current.rsi = rsiSeries;
        
        // 添加超買超賣線
        const overboughtData: LineData[] = [];
        const oversoldData: LineData[] = [];
        
        if (times.length > 0) {
          overboughtData.push({ time: times[0], value: 70 });
          overboughtData.push({ time: times[times.length - 1], value: 70 });
          
          oversoldData.push({ time: times[0], value: 30 });
          oversoldData.push({ time: times[times.length - 1], value: 30 });
        }
        
        const overboughtSeries = chartRef.current?.addLineSeries({
          color: 'rgba(239, 68, 68, 0.5)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceScaleId: 'rsi',
        });
        
        const oversoldSeries = chartRef.current?.addLineSeries({
          color: 'rgba(16, 185, 129, 0.5)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceScaleId: 'rsi',
        });
        
        if (overboughtSeries && oversoldSeries) {
          overboughtSeries.setData(overboughtData);
          oversoldSeries.setData(oversoldData);
          indicatorSeriesRef.current.overbought = overboughtSeries;
          indicatorSeriesRef.current.oversold = oversoldSeries;
        }
      }
    }

    // 添加布林帶指標
    if (activeIndicators.bollingerBands && indicators.bollingerBands) {
      const { upper, middle, lower } = indicators.bollingerBands;
      
      if (middle && middle.length > 0) {
        // 中軌
        const middleData: LineData[] = [];
        for (let i = 0; i < Math.min(times.length, middle.length); i++) {
          if (middle[i] !== null) {
            middleData.push({
              time: times[i],
              value: middle[i]
            });
          }
        }
        
        const middleSeries = chartRef.current?.addLineSeries({
          color: '#3b82f6',
          lineWidth: 2,
          title: 'BB Middle',
        });
        
        if (middleSeries) {
          middleSeries.setData(middleData);
          indicatorSeriesRef.current.bbMiddle = middleSeries;
        }
      }
      
      if (upper && upper.length > 0) {
        // 上軌
        const upperData: LineData[] = [];
        for (let i = 0; i < Math.min(times.length, upper.length); i++) {
          if (upper[i] !== null) {
            upperData.push({
              time: times[i],
              value: upper[i]
            });
          }
        }
        
        const upperSeries = chartRef.current?.addLineSeries({
          color: 'rgba(59, 130, 246, 0.5)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'BB Upper',
        });
        
        if (upperSeries) {
          upperSeries.setData(upperData);
          indicatorSeriesRef.current.bbUpper = upperSeries;
        }
      }
      
      if (lower && lower.length > 0) {
        // 下軌
        const lowerData: LineData[] = [];
        for (let i = 0; i < Math.min(times.length, lower.length); i++) {
          if (lower[i] !== null) {
            lowerData.push({
              time: times[i],
              value: lower[i]
            });
          }
        }
        
        const lowerSeries = chartRef.current?.addLineSeries({
          color: 'rgba(59, 130, 246, 0.5)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'BB Lower',
        });
        
        if (lowerSeries) {
          lowerSeries.setData(lowerData);
          indicatorSeriesRef.current.bbLower = lowerSeries;
        }
      }
    }

    // 添加成交量指標
    if (activeIndicators.volume && indicators.volume && indicators.volume.length > 0) {
      const volumeData = [];
      
      for (let i = 0; i < Math.min(times.length, indicators.volume.length); i++) {
        if (indicators.volume[i] !== null) {
          volumeData.push({
            time: times[i],
            value: indicators.volume[i],
            color: i > 0 && data[i].close > data[i-1].close ? '#10b981' : '#ef4444'
          });
        }
      }
      
      const volumeSeries = chartRef.current?.addHistogramSeries({
        color: '#10b981',
        priceScaleId: 'volume',
        priceFormat: {
          type: 'volume',
        },
        title: 'Volume',
      });
      
      if (volumeSeries) {
        volumeSeries.setData(volumeData);
        indicatorSeriesRef.current.volume = volumeSeries;
      }
    }

    // 添加斐波那契回調水平
    if (activeIndicators.fibonacci && indicators.fibonacci) {
      const { levels, trend } = indicators.fibonacci;
      
      if (levels && times.length > 0) {
        const fibLevels = ['0', '0.236', '0.382', '0.5', '0.618', '0.786', '1'];
        const colors = [
          'rgba(239, 68, 68, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(6, 182, 212, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(139, 92, 246, 0.7)',
        ];
        
        fibLevels.forEach((level, index) => {
          if (levels[level] !== undefined) {
            const levelData = [
              { time: times[0], value: levels[level] },
              { time: times[times.length - 1], value: levels[level] }
            ];
            
            const levelSeries = chartRef.current?.addLineSeries({
              color: colors[index],
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              title: `Fib ${level}`,
            });
            
            if (levelSeries) {
              levelSeries.setData(levelData);
              indicatorSeriesRef.current[`fib${level}`] = levelSeries;
            }
          }
        });
      }
    }

  }, [indicators, activeIndicators, data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default ChartComponent;
