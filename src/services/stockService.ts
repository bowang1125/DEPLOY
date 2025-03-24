import axios from 'axios';

// 定義數據類型
export interface StockData {
  timestamp: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// 使用CORS代理來獲取股票數據
export const fetchStockData = async (
  symbol: string,
  interval: string = '1d',
  range: string = '6mo'
): Promise<StockData | null> => {
  try {
    // 確保時間間隔參數格式正確
    let adjustedInterval = interval;
    
    // 根據Yahoo Finance API的要求格式化interval
    // 確保格式如 1d, 1h, 15m 等
    if (!interval.match(/^\d+[dhm]$/)) {
      console.warn(`時間間隔格式不正確: ${interval}，使用默認值1d`);
      adjustedInterval = '1d';
    }
    
    // 根據時間間隔自動調整範圍，確保有足夠的數據點
    let adjustedRange = range;
    if (adjustedInterval === '1d') {
      adjustedRange = '1y'; // 日線圖使用1年數據
    } else if (adjustedInterval === '1wk') {
      adjustedRange = '5y'; // 週線圖使用5年數據
    } else if (adjustedInterval === '1mo') {
      adjustedRange = 'max'; // 月線圖使用最大範圍
    }
    
    console.log(`開始獲取股票數據: ${symbol}, 時間間隔: ${adjustedInterval}, 範圍: ${adjustedRange}`);
    
    // 處理台股代碼格式
    let adjustedSymbol = symbol;
    if (!symbol.includes('.') && !symbol.includes('-')) {
      // 如果是純數字代碼，且沒有包含點號或連字符，可能是台股代碼
      if (/^\d+$/.test(symbol)) {
        adjustedSymbol = `${symbol}.TW`;
        console.log(`檢測到可能是台股代碼，調整為: ${adjustedSymbol}`);
      }
    }
    
    // 使用多個CORS代理選項，如果一個失敗則嘗試下一個
    const corsProxies = [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/'
    ];
    
    const yahooFinanceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${adjustedSymbol}`;
    
    let response = null;
    let error = null;
    
    // 嘗試每個代理直到成功
    for (const proxy of corsProxies) {
      try {
        console.log(`嘗試使用代理: ${proxy}`);
        
        // 構建完整URL
        const fullUrl = `${proxy}${encodeURIComponent(yahooFinanceUrl)}`;
        
        // 關鍵修改：確保interval和range參數正確傳遞
        const params = {
          interval: adjustedInterval,
          range: adjustedRange,
          includePrePost: false,
          events: 'div,split',
        };
        
        console.log('發送請求參數:', params);
        
        response = await axios.get(fullUrl, {
          params,
          timeout: 15000, // 增加超時時間到15秒
        });
        
        console.log('成功獲取數據，響應狀態:', response.status);
        
        // 檢查是否有數據
        if (response.data && response.data.chart && 
            response.data.chart.result && 
            response.data.chart.result.length > 0) {
          break; // 如果成功獲取有效數據，跳出循環
        } else {
          console.warn('API響應中沒有有效數據，嘗試下一個代理');
          continue;
        }
      } catch (e) {
        error = e;
        console.error(`使用代理 ${proxy} 失敗:`, e);
        // 繼續嘗試下一個代理
      }
    }
    
    // 如果所有代理都失敗，嘗試直接請求
    if (!response || !response.data || !response.data.chart || 
        !response.data.chart.result || response.data.chart.result.length === 0) {
      console.error('所有CORS代理都失敗了或返回無效數據', error);
      
      // 嘗試直接請求（可能會因CORS而失敗，但值得一試）
      try {
        console.log('嘗試直接請求，不使用代理');
        
        response = await axios.get(yahooFinanceUrl, {
          params: {
            interval: adjustedInterval,
            range: adjustedRange,
            includePrePost: false,
            events: 'div,split',
          },
          timeout: 15000,
        });
        console.log('直接請求成功');
      } catch (directError) {
        console.error('直接請求也失敗了:', directError);
        return null;
      }
    }
    
    // 檢查響應數據結構
    if (!response.data || !response.data.chart || !response.data.chart.result || response.data.chart.result.length === 0) {
      console.error('API響應格式不正確:', response.data);
      return null;
    }
    
    const result = response.data.chart.result[0];
    
    // 檢查是否有必要的數據
    if (!result.timestamp || !result.indicators || !result.indicators.quote || result.indicators.quote.length === 0) {
      console.error('API響應中缺少必要的數據:', result);
      return null;
    }
    
    const quotes = result.indicators.quote[0];
    
    // 檢查數據完整性
    if (!quotes.open || !quotes.high || !quotes.low || !quotes.close || !quotes.volume) {
      console.error('API響應中缺少價格數據:', quotes);
      return null;
    }
    
    // 檢查返回的時間間隔是否與請求的一致
    const returnedInterval = result.meta?.dataGranularity || 'unknown';
    console.log(`請求的時間間隔: ${adjustedInterval}, 返回的時間間隔: ${returnedInterval}`);
    
    if (returnedInterval !== adjustedInterval) {
      console.warn(`警告: 返回的時間間隔 (${returnedInterval}) 與請求的時間間隔 (${adjustedInterval}) 不一致`);
    }
    
    // 處理時間戳
    const timestamps = result.timestamp.map(ts => {
      // 確保時間戳是正確的格式
      return ts * 1000; // 轉換為毫秒
    });
    
    console.log(`成功處理數據，獲取了 ${timestamps.length} 個數據點`);
    
    if (timestamps.length > 0) {
      console.log(`第一個數據點時間: ${new Date(timestamps[0]).toLocaleString()}`);
      console.log(`最後一個數據點時間: ${new Date(timestamps[timestamps.length - 1]).toLocaleString()}`);
      
      // 計算數據點之間的時間間隔（以小時為單位）
      if (timestamps.length >= 2) {
        const timeDiff = (timestamps[1] - timestamps[0]) / (1000 * 60 * 60);
        console.log(`數據點之間的時間間隔: ${timeDiff.toFixed(2)} 小時`);
      }
    }
    
    let processedData = {
      timestamp: timestamps,
      open: quotes.open,
      high: quotes.high,
      low: quotes.low,
      close: quotes.close,
      volume: quotes.volume,
    };
    
    // 如果返回的時間間隔與請求的不一致，進行數據聚合
    if (returnedInterval !== adjustedInterval) {
      console.log(`檢測到時間間隔不匹配，將 ${returnedInterval} 數據聚合為 ${adjustedInterval} 數據`);
      
      // 如果請求的是日線但返回的是分鐘級數據，嘗試重新請求日線數據
      if (adjustedInterval === '1d' && returnedInterval === '1m') {
        try {
          console.log('嘗試直接請求日線數據');
          
          // 使用第一個代理嘗試請求日線數據
          const dailyUrl = `${corsProxies[0]}${encodeURIComponent(yahooFinanceUrl)}`;
          
          const dailyResponse = await axios.get(dailyUrl, {
            params: {
              interval: '1d',
              range: '1y',
              includePrePost: false,
              events: 'div,split',
            },
            timeout: 15000,
          });
          
          if (dailyResponse.data && dailyResponse.data.chart && 
              dailyResponse.data.chart.result && 
              dailyResponse.data.chart.result.length > 0) {
            
            const dailyResult = dailyResponse.data.chart.result[0];
            
            if (dailyResult.timestamp && dailyResult.indicators && 
                dailyResult.indicators.quote && dailyResult.indicators.quote.length > 0) {
              
              const dailyQuotes = dailyResult.indicators.quote[0];
              
              if (dailyQuotes.open && dailyQuotes.high && dailyQuotes.low && 
                  dailyQuotes.close && dailyQuotes.volume) {
                
                const dailyTimestamps = dailyResult.timestamp.map(ts => ts * 1000);
                
                console.log(`成功獲取日線數據，共 ${dailyTimestamps.length} 個數據點`);
                
                return {
                  timestamp: dailyTimestamps,
                  open: dailyQuotes.open,
                  high: dailyQuotes.high,
                  low: dailyQuotes.low,
                  close: dailyQuotes.close,
                  volume: dailyQuotes.volume,
                };
              }
            }
          }
          
          console.warn('直接請求日線數據失敗或返回無效數據，回退到數據聚合');
        } catch (error) {
          console.error('直接請求日線數據失敗，回退到數據聚合', error);
        }
      }
      
      // 如果重新請求失敗或不是日線圖，則進行數據聚合
      processedData = aggregateData(processedData, returnedInterval, adjustedInterval);
    }
    
    return processedData;
  } catch (error) {
    console.error('獲取股票數據時出錯:', error);
    return null;
  }
};

// 將數據聚合為指定的時間間隔
const aggregateData = (data: StockData, fromInterval: string, toInterval: string): StockData => {
  if (!data || !data.timestamp || data.timestamp.length === 0) {
    return data;
  }
  
  console.log(`開始將 ${fromInterval} 數據聚合為 ${toInterval} 數據`);
  
  // 解析時間間隔
  const parseInterval = (interval: string): { value: number, unit: string } => {
    const match = interval.match(/^(\d+)([dhm])$/);
    if (!match) return { value: 1, unit: 'd' }; // 默認為1天
    return { value: parseInt(match[1]), unit: match[2] };
  };
  
  const fromIntervalObj = parseInterval(fromInterval);
  const toIntervalObj = parseInterval(toInterval);
  
  // 如果源時間間隔已經大於或等於目標時間間隔，則不需要聚合
  if (
    (fromIntervalObj.unit === 'm' && toIntervalObj.unit === 'm' && fromIntervalObj.value >= toIntervalObj.value) ||
    (fromIntervalObj.unit === 'h' && toIntervalObj.unit === 'm') ||
    (fromIntervalObj.unit === 'd' && (toIntervalObj.unit === 'h' || toIntervalObj.unit === 'm')) ||
    (fromIntervalObj.unit === toIntervalObj.unit && fromIntervalObj.value >= toIntervalObj.value)
  ) {
    console.log(`源時間間隔 ${fromInterval} 已經大於或等於目標時間間隔 ${toInterval}，不需要聚合`);
    return data;
  }
  
  // 根據目標時間間隔選擇聚合方法
  if (toInterval === '1d') {
    return aggregateToDaily(data);
  } else if (toInterval === '1wk') {
    return aggregateToWeekly(data);
  } else if (toInterval === '1mo') {
    return aggregateToMonthly(data);
  } else if (toInterval.endsWith('h')) {
    return aggregateToHourly(data, parseInt(toInterval));
  } else {
    console.warn(`不支持的目標時間間隔 ${toInterval}，返回原始數據`);
    return data;
  }
};

// 將數據聚合為日線數據
const aggregateToDaily = (data: StockData): StockData => {
  if (!data || !data.timestamp || data.timestamp.length === 0) {
    return data;
  }

  const dailyData: StockData = {
    timestamp: [],
    open: [],
    high: [],
    low: [],
    close: [],
    volume: []
  };

  // 將時間戳轉換為日期字符串（僅保留年月日）
  const dateStrings = data.timestamp.map(ts => {
    const date = new Date(ts);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });

  // 找出唯一的日期
  const uniqueDates = [...new Set(dateStrings)];
  
  console.log(`原始數據點數量: ${data.timestamp.length}, 唯一日期數量: ${uniqueDates.length}`);
  console.log('唯一日期示例:', uniqueDates.slice(0, 5));
  
  // 對每個唯一日期聚合數據
  uniqueDates.forEach(dateStr => {
    // 找出屬於當前日期的所有數據點索引
    const indices = dateStrings.map((d, i) => d === dateStr ? i : -1).filter(i => i !== -1);
    
    if (indices.length > 0) {
      // 獲取當天第一個數據點的開盤價
      const open = data.open[indices[0]];
      
      // 獲取當天最高價
      const high = Math.max(...indices.map(i => data.high[i]));
      
      // 獲取當天最低價
      const low = Math.min(...indices.map(i => data.low[i]));
      
      // 獲取當天最後一個數據點的收盤價
      const close = data.close[indices[indices.length - 1]];
      
      // 獲取當天總成交量
      const volume = indices.reduce((sum, i) => sum + data.volume[i], 0);
      
      // 使用當天第一個數據點的時間戳
      const timestamp = data.timestamp[indices[0]];
      
      // 添加到日線數據中
      dailyData.timestamp.push(timestamp);
      dailyData.open.push(open);
      dailyData.high.push(high);
      dailyData.low.push(low);
      dailyData.close.push(close);
      dailyData.volume.push(volume);
    }
  });

  console.log(`已將 ${data.timestamp.length} 個數據點聚合為 ${dailyData.timestamp.length} 個日線數據點`);
  
  // 驗證聚合後的數據
  if (dailyData.timestamp.length < 2) {
    console.warn('聚合後數據點不足，返回原始數據');
    return data;
  }
  
  return dailyData;
};

// 將數據聚合為週線數據
const aggregateToWeekly = (data: StockData): StockData => {
  if (!data || !data.timestamp || data.timestamp.length === 0) {
    return data;
  }

  const weeklyData: StockData = {
    timestamp: [],
    open: [],
    high: [],
    low: [],
    close: [],
    volume: []
  };

  // 將時間戳轉換為週標識（年份-週數）
  const weekIdentifiers = data.timestamp.map(ts => {
    const date = new Date(ts);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  });

  // 找出唯一的週
  const uniqueWeeks = [...new Set(weekIdentifiers)];
  
  console.log(`原始數據點數量: ${data.timestamp.length}, 唯一週數量: ${uniqueWeeks.length}`);
  console.log('唯一週示例:', uniqueWeeks.slice(0, 5));
  
  // 對每個唯一週聚合數據
  uniqueWeeks.forEach(weekId => {
    // 找出屬於當前週的所有數據點索引
    const indices = weekIdentifiers.map((w, i) => w === weekId ? i : -1).filter(i => i !== -1);
    
    if (indices.length > 0) {
      // 獲取當週第一個數據點的開盤價
      const open = data.open[indices[0]];
      
      // 獲取當週最高價
      const high = Math.max(...indices.map(i => data.high[i]));
      
      // 獲取當週最低價
      const low = Math.min(...indices.map(i => data.low[i]));
      
      // 獲取當週最後一個數據點的收盤價
      const close = data.close[indices[indices.length - 1]];
      
      // 獲取當週總成交量
      const volume = indices.reduce((sum, i) => sum + data.volume[i], 0);
      
      // 使用當週第一個數據點的時間戳
      const timestamp = data.timestamp[indices[0]];
      
      // 添加到週線數據中
      weeklyData.timestamp.push(timestamp);
      weeklyData.open.push(open);
      weeklyData.high.push(high);
      weeklyData.low.push(low);
      weeklyData.close.push(close);
      weeklyData.volume.push(volume);
    }
  });

  console.log(`已將 ${data.timestamp.length} 個數據點聚合為 ${weeklyData.timestamp.length} 個週線數據點`);
  
  // 驗證聚合後的數據
  if (weeklyData.timestamp.length < 2) {
    console.warn('聚合後數據點不足，返回原始數據');
    return data;
  }
  
  return weeklyData;
};

// 將數據聚合為月線數據
const aggregateToMonthly = (data: StockData): StockData => {
  if (!data || !data.timestamp || data.timestamp.length === 0) {
    return data;
  }

  const monthlyData: StockData = {
    timestamp: [],
    open: [],
    high: [],
    low: [],
    close: [],
    volume: []
  };

  // 將時間戳轉換為月標識（年份-月份）
  const monthIdentifiers = data.timestamp.map(ts => {
    const date = new Date(ts);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });

  // 找出唯一的月份
  const uniqueMonths = [...new Set(monthIdentifiers)];
  
  console.log(`原始數據點數量: ${data.timestamp.length}, 唯一月份數量: ${uniqueMonths.length}`);
  console.log('唯一月份示例:', uniqueMonths.slice(0, 5));
  
  // 對每個唯一月份聚合數據
  uniqueMonths.forEach(monthId => {
    // 找出屬於當前月份的所有數據點索引
    const indices = monthIdentifiers.map((m, i) => m === monthId ? i : -1).filter(i => i !== -1);
    
    if (indices.length > 0) {
      // 獲取當月第一個數據點的開盤價
      const open = data.open[indices[0]];
      
      // 獲取當月最高價
      const high = Math.max(...indices.map(i => data.high[i]));
      
      // 獲取當月最低價
      const low = Math.min(...indices.map(i => data.low[i]));
      
      // 獲取當月最後一個數據點的收盤價
      const close = data.close[indices[indices.length - 1]];
      
      // 獲取當月總成交量
      const volume = indices.reduce((sum, i) => sum + data.volume[i], 0);
      
      // 使用當月第一個數據點的時間戳
      const timestamp = data.timestamp[indices[0]];
      
      // 添加到月線數據中
      monthlyData.timestamp.push(timestamp);
      monthlyData.open.push(open);
      monthlyData.high.push(high);
      monthlyData.low.push(low);
      monthlyData.close.push(close);
      monthlyData.volume.push(volume);
    }
  });

  console.log(`已將 ${data.timestamp.length} 個數據點聚合為 ${monthlyData.timestamp.length} 個月線數據點`);
  
  // 驗證聚合後的數據
  if (monthlyData.timestamp.length < 2) {
    console.warn('聚合後數據點不足，返回原始數據');
    return data;
  }
  
  return monthlyData;
};

// 將數據聚合為小時線數據
const aggregateToHourly = (data: StockData, hours: number): StockData => {
  if (!data || !data.timestamp || data.timestamp.length === 0) {
    return data;
  }

  const hourlyData: StockData = {
    timestamp: [],
    open: [],
    high: [],
    low: [],
    close: [],
    volume: []
  };

  // 計算時間間隔（毫秒）
  const interval = hours * 60 * 60 * 1000;
  
  // 找出第一個時間戳
  const firstTimestamp = data.timestamp[0];
  
  // 計算時間段
  const timeSlots: { start: number, end: number }[] = [];
  let currentStart = firstTimestamp;
  
  while (currentStart <= data.timestamp[data.timestamp.length - 1]) {
    timeSlots.push({
      start: currentStart,
      end: currentStart + interval
    });
    currentStart += interval;
  }
  
  console.log(`原始數據點數量: ${data.timestamp.length}, 時間段數量: ${timeSlots.length}`);
  
  // 對每個時間段聚合數據
  timeSlots.forEach(slot => {
    // 找出屬於當前時間段的所有數據點索引
    const indices = data.timestamp.map((ts, i) => (ts >= slot.start && ts < slot.end) ? i : -1).filter(i => i !== -1);
    
    if (indices.length > 0) {
      // 獲取當前時間段第一個數據點的開盤價
      const open = data.open[indices[0]];
      
      // 獲取當前時間段最高價
      const high = Math.max(...indices.map(i => data.high[i]));
      
      // 獲取當前時間段最低價
      const low = Math.min(...indices.map(i => data.low[i]));
      
      // 獲取當前時間段最後一個數據點的收盤價
      const close = data.close[indices[indices.length - 1]];
      
      // 獲取當前時間段總成交量
      const volume = indices.reduce((sum, i) => sum + data.volume[i], 0);
      
      // 使用當前時間段的開始時間
      const timestamp = slot.start;
      
      // 添加到小時線數據中
      hourlyData.timestamp.push(timestamp);
      hourlyData.open.push(open);
      hourlyData.high.push(high);
      hourlyData.low.push(low);
      hourlyData.close.push(close);
      hourlyData.volume.push(volume);
    }
  });

  console.log(`已將 ${data.timestamp.length} 個數據點聚合為 ${hourlyData.timestamp.length} 個 ${hours} 小時線數據點`);
  
  // 驗證聚合後的數據
  if (hourlyData.timestamp.length < 2) {
    console.warn('聚合後數據點不足，返回原始數據');
    return data;
  }
  
  return hourlyData;
};

// 將原始數據轉換為蠟燭圖數據格式
export const transformToCandlestickData = (data: StockData): CandlestickData[] => {
  if (!data || !data.timestamp || data.timestamp.length === 0) {
    console.error('無法轉換為蠟燭圖數據: 數據為空或格式不正確');
    return [];
  }

  console.log(`開始轉換蠟燭圖數據，原始數據點數量: ${data.timestamp.length}`);
  
  const candlestickData = data.timestamp.map((time, index) => {
    // 確保時間是毫秒格式
    const timeMs = typeof time === 'number' && time < 10000000000 ? time * 1000 : time;
    
    return {
      time: timeMs / 1000, // 轉換為秒，因為圖表庫需要
      open: data.open[index],
      high: data.high[index],
      low: data.low[index],
      close: data.close[index],
    };
  }).filter(item => 
    item.open !== null && 
    item.high !== null && 
    item.low !== null && 
    item.close !== null
  );
  
  console.log(`轉換完成，有效蠟燭圖數據點數量: ${candlestickData.length}`);
  
  if (candlestickData.length > 0) {
    console.log('第一個數據點示例:', candlestickData[0]);
    console.log('最後一個數據點示例:', candlestickData[candlestickData.length - 1]);
  }
  
  return candlestickData;
};

// 計算技術指標

// 計算相對強弱指數 (RSI)
export const calculateRSI = (closePrices: number[], period: number = 14): number[] => {
  if (!closePrices || closePrices.length < period + 1) {
    console.error(`無法計算RSI: 數據點不足，需要至少 ${period + 1} 個點，但只有 ${closePrices?.length || 0} 個點`);
    return Array(closePrices?.length || 0).fill(null);
  }

  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // 初始化
  for (let i = 1; i < closePrices.length; i++) {
    const difference = closePrices[i] - closePrices[i - 1];
    gains.push(difference > 0 ? difference : 0);
    losses.push(difference < 0 ? Math.abs(difference) : 0);
  }

  // 計算第一個平均值
  let avgGain = gains.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, value) => sum + value, 0) / period;

  // 計算第一個RSI值
  let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // 避免除以零
  rsi.push(100 - (100 / (1 + rs)));

  // 計算剩餘的RSI值
  for (let i = period; i < closePrices.length - 1; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsi.push(100 - (100 / (1 + rs)));
  }

  // 填充前面的空值
  const padding = Array(period).fill(null);
  return [...padding, ...rsi];
};

// 計算移動平均線 (MA)
export const calculateMA = (data: number[], period: number): number[] => {
  if (!data || data.length < period) {
    console.error(`無法計算MA: 數據點不足，需要至少 ${period} 個點，但只有 ${data?.length || 0} 個點`);
    return Array(data?.length || 0).fill(null);
  }

  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null as any);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  
  return result;
};

// 計算指數移動平均線 (EMA)
export const calculateEMA = (data: number[], period: number): number[] => {
  if (!data || data.length < period) {
    console.error(`無法計算EMA: 數據點不足，需要至少 ${period} 個點，但只有 ${data?.length || 0} 個點`);
    return Array(data?.length || 0).fill(null);
  }

  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // 第一個EMA值使用SMA
  let ema = data.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  // 填充前面的空值
  for (let i = 0; i < period - 1; i++) {
    result.push(null as any);
  }
  
  result.push(ema);
  
  // 計算剩餘的EMA值
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
};

// 計算MACD
export const calculateMACD = (
  closePrices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[], signal: number[], histogram: number[] } => {
  if (!closePrices || closePrices.length < Math.max(fastPeriod, slowPeriod) + signalPeriod) {
    console.error(`無法計算MACD: 數據點不足`);
    return {
      macd: Array(closePrices?.length || 0).fill(null),
      signal: Array(closePrices?.length || 0).fill(null),
      histogram: Array(closePrices?.length || 0).fill(null)
    };
  }

  // 計算快速和慢速EMA
  const fastEMA = calculateEMA(closePrices, fastPeriod);
  const slowEMA = calculateEMA(closePrices, slowPeriod);
  
  // 計算MACD線 (快速EMA - 慢速EMA)
  const macdLine: number[] = [];
  for (let i = 0; i < closePrices.length; i++) {
    if (i < slowPeriod - 1) {
      macdLine.push(null as any);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // 計算信號線 (MACD的EMA)
  const validMacd = macdLine.filter(value => value !== null) as number[];
  const signalLine = calculateEMA(validMacd, signalPeriod);
  
  // 填充信號線前面的空值
  const signalPadding = Array(closePrices.length - signalLine.length).fill(null);
  const fullSignalLine = [...signalPadding, ...signalLine];
  
  // 計算柱狀圖 (MACD線 - 信號線)
  const histogram: number[] = [];
  for (let i = 0; i < closePrices.length; i++) {
    if (macdLine[i] === null || fullSignalLine[i] === null) {
      histogram.push(null as any);
    } else {
      histogram.push(macdLine[i] - fullSignalLine[i]);
    }
  }
  
  return {
    macd: macdLine,
    signal: fullSignalLine,
    histogram
  };
};

// 計算布林帶
export const calculateBollingerBands = (
  closePrices: number[],
  period: number = 20,
  multiplier: number = 2
): { upper: number[], middle: number[], lower: number[] } => {
  if (!closePrices || closePrices.length < period) {
    console.error(`無法計算布林帶: 數據點不足，需要至少 ${period} 個點，但只有 ${closePrices?.length || 0} 個點`);
    return {
      upper: Array(closePrices?.length || 0).fill(null),
      middle: Array(closePrices?.length || 0).fill(null),
      lower: Array(closePrices?.length || 0).fill(null)
    };
  }

  // 計算中軌 (SMA)
  const middle = calculateMA(closePrices, period);
  
  const upper: number[] = [];
  const lower: number[] = [];
  
  // 計算上軌和下軌
  for (let i = 0; i < closePrices.length; i++) {
    if (i < period - 1) {
      upper.push(null as any);
      lower.push(null as any);
      continue;
    }
    
    // 計算標準差
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(closePrices[i - j] - middle[i], 2);
    }
    const stdDev = Math.sqrt(sum / period);
    
    upper.push(middle[i] + multiplier * stdDev);
    lower.push(middle[i] - multiplier * stdDev);
  }
  
  return { upper, middle, lower };
};

// 計算成交量加權移動平均線 (VWAP)
export const calculateVWAP = (
  highPrices: number[],
  lowPrices: number[],
  closePrices: number[],
  volumes: number[],
  period: number = 14
): number[] => {
  if (!highPrices || !lowPrices || !closePrices || !volumes || 
      highPrices.length < period || lowPrices.length < period || 
      closePrices.length < period || volumes.length < period) {
    console.error(`無法計算VWAP: 數據點不足或格式不正確`);
    return Array(Math.max(highPrices?.length || 0, lowPrices?.length || 0, 
                          closePrices?.length || 0, volumes?.length || 0)).fill(null);
  }

  const typicalPrices: number[] = [];
  const vwap: number[] = [];
  
  // 計算典型價格 (TP = (High + Low + Close) / 3)
  for (let i = 0; i < highPrices.length; i++) {
    typicalPrices.push((highPrices[i] + lowPrices[i] + closePrices[i]) / 3);
  }
  
  // 計算VWAP
  for (let i = 0; i < typicalPrices.length; i++) {
    if (i < period - 1) {
      vwap.push(null as any);
      continue;
    }
    
    let sumTPV = 0;
    let sumVolume = 0;
    
    for (let j = 0; j < period; j++) {
      sumTPV += typicalPrices[i - j] * volumes[i - j];
      sumVolume += volumes[i - j];
    }
    
    vwap.push(sumVolume > 0 ? sumTPV / sumVolume : null as any);
  }
  
  return vwap;
};

// 計算平均真實範圍 (ATR)
export const calculateATR = (
  highPrices: number[],
  lowPrices: number[],
  closePrices: number[],
  period: number = 14
): number[] => {
  if (!highPrices || !lowPrices || !closePrices || 
      highPrices.length < period || lowPrices.length < period || closePrices.length < period) {
    console.error(`無法計算ATR: 數據點不足或格式不正確`);
    return Array(Math.max(highPrices?.length || 0, lowPrices?.length || 0, closePrices?.length || 0)).fill(null);
  }

  const trueRanges: number[] = [];
  const atr: number[] = [];
  
  // 計算真實範圍 (TR)
  for (let i = 0; i < highPrices.length; i++) {
    if (i === 0) {
      trueRanges.push(highPrices[i] - lowPrices[i]);
      continue;
    }
    
    const tr1 = highPrices[i] - lowPrices[i];
    const tr2 = Math.abs(highPrices[i] - closePrices[i - 1]);
    const tr3 = Math.abs(lowPrices[i] - closePrices[i - 1]);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // 計算ATR
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      atr.push(null as any);
      continue;
    }
    
    if (i === period - 1) {
      // 第一個ATR是簡單平均
      atr.push(trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period);
      continue;
    }
    
    // 其餘使用平滑移動平均
    atr.push(((atr[atr.length - 1] * (period - 1)) + trueRanges[i]) / period);
  }
  
  return atr;
};
