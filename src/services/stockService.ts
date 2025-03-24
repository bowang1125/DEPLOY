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
    console.log(`開始獲取股票數據: ${symbol}, 時間間隔: ${interval}, 範圍: ${range}`);
    
    // 使用多個CORS代理選項，如果一個失敗則嘗試下一個
    const corsProxies = [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/'
    ];
    
    const yahooFinanceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    
    let response = null;
    let error = null;
    
    // 嘗試每個代理直到成功
    for (const proxy of corsProxies) {
      try {
        console.log(`嘗試使用代理: ${proxy}`);
        
        // 構建完整URL
        const fullUrl = `${proxy}${encodeURIComponent(yahooFinanceUrl)}`;
        
        response = await axios.get(fullUrl, {
          params: {
            interval,
            range,
            includePrePost: false,
            events: 'div,split',
          },
          timeout: 10000, // 10秒超時
        });
        
        console.log('成功獲取數據');
        break; // 如果成功，跳出循環
      } catch (e) {
        error = e;
        console.error(`使用代理 ${proxy} 失敗:`, e);
        // 繼續嘗試下一個代理
      }
    }
    
    // 如果所有代理都失敗
    if (!response) {
      console.error('所有CORS代理都失敗了', error);
      
      // 嘗試直接請求（可能會因CORS而失敗，但值得一試）
      try {
        console.log('嘗試直接請求，不使用代理');
        response = await axios.get(yahooFinanceUrl, {
          params: {
            interval,
            range,
            includePrePost: false,
            events: 'div,split',
          },
          timeout: 10000,
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
    
    console.log(`成功處理數據，獲取了 ${result.timestamp.length} 個數據點`);
    
    return {
      timestamp: result.timestamp,
      open: quotes.open,
      high: quotes.high,
      low: quotes.low,
      close: quotes.close,
      volume: quotes.volume,
    };
  } catch (error) {
    console.error('獲取股票數據時出錯:', error);
    return null;
  }
};

// 將原始數據轉換為蠟燭圖數據格式
export const transformToCandlestickData = (data: StockData): CandlestickData[] => {
  if (!data || !data.timestamp || data.timestamp.length === 0) {
    console.error('無法轉換為蠟燭圖數據: 數據為空或格式不正確');
    return [];
  }

  console.log(`開始轉換蠟燭圖數據，原始數據點數量: ${data.timestamp.length}`);
  
  const candlestickData = data.timestamp.map((time, index) => ({
    time: time * 1000, // 確保時間戳是毫秒格式，適用於圖表庫
    open: data.open[index],
    high: data.high[index],
    low: data.low[index],
    close: data.close[index],
  })).filter(item => 
    item.open !== null && 
    item.high !== null && 
    item.low !== null && 
    item.close !== null
  );
  
  console.log(`轉換完成，有效蠟燭圖數據點數量: ${candlestickData.length}`);
  
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

// 檢測市場結構（高點低點識別）
export const identifyMarketStructure = (
  highPrices: number[],
  lowPrices: number[],
  period: number = 10
): { highs: number[], lows: number[] } => {
  if (!highPrices || !lowPrices || 
      highPrices.length < period * 2 + 1 || lowPrices.length < period * 2 + 1) {
    console.error(`無法識別市場結構: 數據點不足或格式不正確`);
    return { 
      highs: Array(Math.max(highPrices?.length || 0, lowPrices?.length || 0)).fill(null),
      lows: Array(Math.max(highPrices?.length || 0, lowPrices?.length || 0)).fill(null)
    };
  }

  const highs: number[] = Array(highPrices.length).fill(null);
  const lows: number[] = Array(lowPrices.length).fill(null);
  
  // 識別高點
  for (let i = period; i < highPrices.length - period; i++) {
    let isHigh = true;
    
    for (let j = 1; j <= period; j++) {
      if (highPrices[i] <= highPrices[i - j] || highPrices[i] <= highPrices[i + j]) {
        isHigh = false;
        break;
      }
    }
    
    if (isHigh) {
      highs[i] = highPrices[i];
    }
  }
  
  // 識別低點
  for (let i = period; i < lowPrices.length - period; i++) {
    let isLow = true;
    
    for (let j = 1; j <= period; j++) {
      if (lowPrices[i] >= lowPrices[i - j] || lowPrices[i] >= lowPrices[i + j]) {
        isLow = false;
        break;
      }
    }
    
    if (isLow) {
      lows[i] = lowPrices[i];
    }
  }
  
  return { highs, lows };
};

// 檢測RSI背離
export const detectRSIDivergence = (
  closePrices: number[],
  rsiValues: number[],
  period: number = 14
): { bullishDivergence: boolean[], bearishDivergence: boolean[] } => {
  if (!closePrices || !rsiValues || 
      closePrices.length < period * 2 || rsiValues.length < period * 2) {
    console.error(`無法檢測RSI背離: 數據點不足或格式不正確`);
    return { 
      bullishDivergence: Array(Math.max(closePrices?.length || 0, rsiValues?.length || 0)).fill(false),
      bearishDivergence: Array(Math.max(closePrices?.length || 0, rsiValues?.length || 0)).fill(false)
    };
  }

  const bullishDivergence: boolean[] = Array(closePrices.length).fill(false);
  const bearishDivergence: boolean[] = Array(closePrices.length).fill(false);
  
  // 從RSI值開始的位置開始檢測（前面有null值）
  for (let i = period * 2; i < closePrices.length; i++) {
    // 檢測看跌背離（價格創新高但RSI未創新高）
    if (closePrices[i] > closePrices[i - period] && 
        rsiValues[i] < rsiValues[i - period] && 
        rsiValues[i] > 70) {
      bearishDivergence[i] = true;
    }
    
    // 檢測看漲背離（價格創新低但RSI未創新低）
    if (closePrices[i] < closePrices[i - period] && 
        rsiValues[i] > rsiValues[i - period] && 
        rsiValues[i] < 30) {
      bullishDivergence[i] = true;
    }
  }
  
  return { bullishDivergence, bearishDivergence };
};

// 生成交易信號
export const generateTradingSignals = (
  closePrices: number[],
  rsiValues: number[],
  vwapValues: number[],
  atrValues: number[],
  marketStructure: { highs: number[], lows: number[] },
  rsiDivergence: { bullishDivergence: boolean[], bearishDivergence: boolean[] }
): { buySignals: boolean[], sellSignals: boolean[] } => {
  if (!closePrices || closePrices.length === 0) {
    console.error(`無法生成交易信號: 價格數據為空或格式不正確`);
    return { 
      buySignals: [],
      sellSignals: []
    };
  }

  const buySignals: boolean[] = Array(closePrices.length).fill(false);
  const sellSignals: boolean[] = Array(closePrices.length).fill(false);
  
  for (let i = 30; i < closePrices.length; i++) {
    // 買入信號條件
    const buyConditions = [
      rsiValues[i] !== null && rsiValues[i] < 30, // RSI超賣
      rsiDivergence.bullishDivergence[i], // RSI看漲背離
      marketStructure.lows[i] !== null, // 市場結構低點
      vwapValues[i] !== null && closePrices[i] > vwapValues[i], // 價格在VWAP上方
    ];
    
    // 賣出信號條件
    const sellConditions = [
      rsiValues[i] !== null && rsiValues[i] > 70, // RSI超買
      rsiDivergence.bearishDivergence[i], // RSI看跌背離
      marketStructure.highs[i] !== null, // 市場結構高點
      vwapValues[i] !== null && closePrices[i] < vwapValues[i], // 價格在VWAP下方
    ];
    
    // 如果滿足至少兩個買入條件，生成買入信號
    if (buyConditions.filter(Boolean).length >= 2) {
      buySignals[i] = true;
    }
    
    // 如果滿足至少兩個賣出條件，生成賣出信號
    if (sellConditions.filter(Boolean).length >= 2) {
      sellSignals[i] = true;
    }
  }
  
  return { buySignals, sellSignals };
};

// 回測函數
export const backtest = (
  closePrices: number[],
  buySignals: boolean[],
  sellSignals: boolean[],
  initialCapital: number = 10000
): {
  equity: number[];
  trades: { entry: number; exit: number; profit: number; }[];
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  annualReturn: number;
} => {
  if (!closePrices || !buySignals || !sellSignals || 
      closePrices.length === 0 || buySignals.length === 0 || sellSignals.length === 0) {
    console.error(`無法執行回測: 數據為空或格式不正確`);
    return { 
      equity: [initialCapital],
      trades: [],
      winRate: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      annualReturn: 0
    };
  }

  const equity: number[] = [initialCapital];
  const trades: { entry: number; exit: number; profit: number; }[] = [];
  
  let inPosition = false;
  let entryPrice = 0;
  let entryIndex = 0;
  
  // 模擬交易
  for (let i = 0; i < closePrices.length; i++) {
    // 更新權益曲線
    equity.push(equity[equity.length - 1]);
    
    // 買入信號且不在倉位中
    if (buySignals[i] && !inPosition) {
      inPosition = true;
      entryPrice = closePrices[i];
      entryIndex = i;
    }
    // 賣出信號且在倉位中
    else if ((sellSignals[i] || i === closePrices.length - 1) && inPosition) {
      inPosition = false;
      const exitPrice = closePrices[i];
      const profit = exitPrice - entryPrice;
      const profitPercent = profit / entryPrice;
      
      // 更新權益
      equity[equity.length - 1] = equity[equity.length - 1] * (1 + profitPercent);
      
      // 記錄交易
      trades.push({
        entry: entryPrice,
        exit: exitPrice,
        profit: profitPercent * 100, // 轉換為百分比
      });
    }
  }
  
  // 計算績效指標
  const winningTrades = trades.filter(trade => trade.profit > 0);
  const losingTrades = trades.filter(trade => trade.profit <= 0);
  
  const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
  
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profit, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit, 0));
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  
  // 計算最大回撤
  let maxDrawdown = 0;
  let peak = equity[0];
  
  for (const value of equity) {
    if (value > peak) {
      peak = value;
    }
    
    const drawdown = (peak - value) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  // 計算年化收益率（假設250個交易日/年）
  const totalReturn = (equity[equity.length - 1] - initialCapital) / initialCapital;
  const years = closePrices.length / 250;
  const annualReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
  
  return {
    equity,
    trades,
    winRate,
    profitFactor,
    maxDrawdown,
    annualReturn,
  };
};
