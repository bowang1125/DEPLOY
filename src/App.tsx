import { useState, useEffect } from 'react';
import ChartComponent from './components/ChartComponent';
import { 
  fetchStockData, 
  transformToCandlestickData, 
  calculateRSI, 
  calculateVWAP, 
  calculateATR, 
  identifyMarketStructure, 
  detectRSIDivergence, 
  generateTradingSignals,
  backtest,
  CandlestickData
} from './services/stockService';

// 技術指標卡片組件
interface TechCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const TechCard = ({ title, children, className = '' }: TechCardProps) => {
  return (
    <div className={`p-3 bg-gray-700 rounded tech-card ${className}`}>
      <h4 className="font-medium text-blue-400 glow-text">{title}</h4>
      <div className="text-gray-300 mt-1">{children}</div>
    </div>
  );
};

// 主頁面組件
function App() {
  const [symbol, setSymbol] = useState<string>('');
  const [marketType, setMarketType] = useState<'us' | 'tw' | 'futures'>('us');
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // 股票數據狀態
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<{
    rsi: number[] | null;
    vwap: number[] | null;
    atr: number[] | null;
    marketStructure: { highs: number[], lows: number[] } | null;
    rsiDivergence: { bullishDivergence: boolean[], bearishDivergence: boolean[] } | null;
    signals: { buySignals: boolean[], sellSignals: boolean[] } | null;
    backtestResult: {
      winRate: number;
      profitFactor: number;
      maxDrawdown: number;
      annualReturn: number;
    } | null;
  }>({
    rsi: null,
    vwap: null,
    atr: null,
    marketStructure: null,
    rsiDivergence: null,
    signals: null,
    backtestResult: null
  });
  
  // 處理分析請求
  const handleAnalyze = async () => {
    if (!symbol.trim()) return;
    
    setIsAnalyzing(true);
    setCandlestickData([]);
    setAnalysisResult({
      rsi: null,
      vwap: null,
      atr: null,
      marketStructure: null,
      rsiDivergence: null,
      signals: null,
      backtestResult: null
    });
    
    try {
      // 根據市場類型調整股票代號
      let adjustedSymbol = symbol;
      if (marketType === 'tw') {
        adjustedSymbol = `${symbol}.TW`;
      } else if (marketType === 'futures') {
        // 期貨代號可能需要特殊處理
        if (symbol.toLowerCase() === 'gold') adjustedSymbol = 'GC=F';
        else if (symbol.toLowerCase() === 'corn') adjustedSymbol = 'ZC=F';
        else if (symbol.toLowerCase() === 'wheat') adjustedSymbol = 'ZW=F';
        else adjustedSymbol = `${symbol}=F`;
      }
      
      // 獲取股票數據
      const stockData = await fetchStockData(adjustedSymbol, timeframe, '1y');
      
      if (stockData && stockData.timestamp.length > 0) {
        // 轉換為蠟燭圖數據
        const candleData = transformToCandlestickData(stockData);
        setCandlestickData(candleData);
        
        // 計算技術指標
        const rsiValues = calculateRSI(stockData.close);
        const vwapValues = calculateVWAP(stockData.high, stockData.low, stockData.close, stockData.volume);
        const atrValues = calculateATR(stockData.high, stockData.low, stockData.close);
        
        // 識別市場結構
        const marketStructure = identifyMarketStructure(stockData.high, stockData.low);
        
        // 檢測RSI背離
        const rsiDivergence = detectRSIDivergence(stockData.close, rsiValues);
        
        // 生成交易信號
        const signals = generateTradingSignals(
          stockData.close,
          rsiValues,
          vwapValues,
          atrValues,
          marketStructure,
          rsiDivergence
        );
        
        // 回測
        const backtestResult = backtest(stockData.close, signals.buySignals, signals.sellSignals);
        
        // 更新分析結果
        setAnalysisResult({
          rsi: rsiValues,
          vwap: vwapValues,
          atr: atrValues,
          marketStructure,
          rsiDivergence,
          signals,
          backtestResult: {
            winRate: backtestResult.winRate,
            profitFactor: backtestResult.profitFactor,
            maxDrawdown: backtestResult.maxDrawdown,
            annualReturn: backtestResult.annualReturn
          }
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 獲取最新的交易信號
  const getLatestSignal = () => {
    if (!analysisResult.signals || !candlestickData.length) return '尚未分析';
    
    const { buySignals, sellSignals } = analysisResult.signals;
    const lastIndex = buySignals.length - 1;
    
    if (buySignals[lastIndex]) return '買入信號';
    if (sellSignals[lastIndex]) return '賣出信號';
    
    // 檢查最近的幾個數據點
    for (let i = lastIndex; i > Math.max(0, lastIndex - 5); i--) {
      if (buySignals[i]) return '最近有買入信號';
      if (sellSignals[i]) return '最近有賣出信號';
    }
    
    return '無明確信號';
  };
  
  // 獲取波浪理論分析
  const getWaveAnalysis = () => {
    if (!analysisResult.marketStructure || !candlestickData.length) return '尚未分析';
    
    const { highs, lows } = analysisResult.marketStructure;
    
    // 簡單的波浪理論分析邏輯
    const significantHighs = highs.filter(h => h !== null);
    const significantLows = lows.filter(l => l !== null);
    
    if (significantHighs.length < 2 || significantLows.length < 2) {
      return '數據不足以進行波浪分析';
    }
    
    // 檢查是否處於上升趨勢或下降趨勢
    const lastHigh = significantHighs[significantHighs.length - 1];
    const prevHigh = significantHighs[significantHighs.length - 2];
    const lastLow = significantLows[significantLows.length - 1];
    const prevLow = significantLows[significantLows.length - 2];
    
    if (lastHigh > prevHigh && lastLow > prevLow) {
      return '處於上升趨勢，可能在波浪3或波浪5';
    } else if (lastHigh < prevHigh && lastLow < prevLow) {
      return '處於下降趨勢，可能在波浪A或波浪C';
    } else if (lastHigh < prevHigh && lastLow > prevLow) {
      return '處於調整階段，可能在波浪2或波浪4';
    } else {
      return '波浪形態不明確';
    }
  };
  
  // 獲取市場結構分析
  const getMarketStructureAnalysis = () => {
    if (!analysisResult.marketStructure || !candlestickData.length) return '尚未分析';
    
    const { highs, lows } = analysisResult.marketStructure;
    
    // 檢查最近的高點和低點
    const recentHighs = highs.slice(-10).filter(h => h !== null);
    const recentLows = lows.slice(-10).filter(l => l !== null);
    
    if (recentHighs.length === 0 && recentLows.length === 0) {
      return '近期無明顯的高點或低點';
    }
    
    if (recentHighs.length > recentLows.length) {
      return '近期形成多個高點，可能處於頂部區域';
    } else if (recentLows.length > recentHighs.length) {
      return '近期形成多個低點，可能處於底部區域';
    } else {
      // 檢查是否形成更高的高點和更高的低點
      if (recentHighs.length >= 2 && recentLows.length >= 2) {
        const lastHigh = recentHighs[recentHighs.length - 1];
        const prevHigh = recentHighs[recentHighs.length - 2];
        const lastLow = recentLows[recentLows.length - 1];
        const prevLow = recentLows[recentLows.length - 2];
        
        if (lastHigh > prevHigh && lastLow > prevLow) {
          return '形成更高的高點和更高的低點，上升趨勢確認';
        } else if (lastHigh < prevHigh && lastLow < prevLow) {
          return '形成更低的高點和更低的低點，下降趨勢確認';
        }
      }
      
      return '市場結構不明確';
    }
  };
  
  // 獲取RSI背離分析
  const getRSIDivergenceAnalysis = () => {
    if (!analysisResult.rsiDivergence || !candlestickData.length) return '尚未分析';
    
    const { bullishDivergence, bearishDivergence } = analysisResult.rsiDivergence;
    
    // 檢查最近的背離
    const recentBullish = bullishDivergence.slice(-10).some(d => d);
    const recentBearish = bearishDivergence.slice(-10).some(d => d);
    
    if (recentBullish && recentBearish) {
      return '檢測到混合背離信號，市場可能處於轉折點';
    } else if (recentBullish) {
      return '檢測到看漲背離，價格可能即將上漲';
    } else if (recentBearish) {
      return '檢測到看跌背離，價格可能即將下跌';
    } else {
      return '未檢測到明顯的RSI背離';
    }
  };
  
  // 獲取VWAP分析
  const getVWAPAnalysis = () => {
    if (!analysisResult.vwap || !candlestickData.length) return '尚未分析';
    
    const vwapValues = analysisResult.vwap;
    const lastValidIndex = vwapValues.findIndex((v, i, arr) => i >= arr.length - 5 && v !== null);
    
    if (lastValidIndex === -1) return 'VWAP數據不足';
    
    const lastPrice = candlestickData[candlestickData.length - 1].close;
    const lastVWAP = vwapValues[lastValidIndex];
    
    if (lastPrice > lastVWAP) {
      return '價格位於VWAP上方，顯示看漲壓力';
    } else if (lastPrice < lastVWAP) {
      return '價格位於VWAP下方，顯示看跌壓力';
    } else {
      return '價格接近VWAP，處於平衡狀態';
    }
  };
  
  // 獲取ATR動態止損分析
  const getATRStopLossAnalysis = () => {
    if (!analysisResult.atr || !candlestickData.length) return '尚未分析';
    
    const atrValues = analysisResult.atr;
    const lastValidIndex = atrValues.findIndex((v, i, arr) => i >= arr.length - 5 && v !== null);
    
    if (lastValidIndex === -1) return 'ATR數據不足';
    
    const lastPrice = candlestickData[candlestickData.length - 1].close;
    const lastATR = atrValues[lastValidIndex];
    
    // 計算動態止損位置（使用2倍ATR）
    const longStopLoss = Math.round((lastPrice - 2 * lastATR) * 100) / 100;
    const shortStopLoss = Math.round((lastPrice + 2 * lastATR) * 100) / 100;
    
    return `多頭止損位: ${longStopLoss}, 空頭止損位: ${shortStopLoss}`;
  };
  
  // 獲取市場情緒分析
  const getMarketSentimentAnalysis = () => {
    if (!analysisResult.rsi || !candlestickData.length) return '尚未分析';
    
    const rsiValues = analysisResult.rsi;
    const lastValidIndex = rsiValues.findIndex((v, i, arr) => i >= arr.length - 5 && v !== null);
    
    if (lastValidIndex === -1) return 'RSI數據不足';
    
    const lastRSI = rsiValues[lastValidIndex];
    
    if (lastRSI > 70) {
      return '市場過熱，可能出現回調';
    } else if (lastRSI < 30) {
      return '市場超賣，可能出現反彈';
    } else if (lastRSI > 50) {
      return '市場偏向樂觀';
    } else if (lastRSI < 50) {
      return '市場偏向謹慎';
    } else {
      return '市場情緒中性';
    }
  };
  
  // 獲取綜合建議
  const getOverallRecommendation = () => {
    if (!analysisResult.signals || !candlestickData.length) return '請先進行分析以獲取交易建議';
    
    const latestSignal = getLatestSignal();
    
    if (latestSignal.includes('買入')) {
      return '綜合技術指標顯示看漲信號，考慮買入';
    } else if (latestSignal.includes('賣出')) {
      return '綜合技術指標顯示看跌信號，考慮賣出';
    } else {
      return '無明確信號，建議觀望';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 頂部導航欄 - 響應式設計 */}
      <header className="bg-gray-800 p-4 shadow-lg border-b border-blue-900/30">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-blue-400 glow-text">專業投資分析平台</h1>
          
          {/* 桌面版導航 */}
          <nav className="hidden md:block">
            <ul className="flex space-x-4">
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors">首頁</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors">回測歷史</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors">關於</a></li>
            </ul>
          </nav>
          
          {/* 移動版漢堡菜單按鈕 */}
          <button 
            className="md:hidden text-gray-300 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* 移動版下拉菜單 */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 py-2 border-t border-gray-700">
            <ul className="space-y-2">
              <li><a href="#" className="block px-4 py-1 text-gray-300 hover:text-blue-400 transition-colors">首頁</a></li>
              <li><a href="#" className="block px-4 py-1 text-gray-300 hover:text-blue-400 transition-colors">回測歷史</a></li>
              <li><a href="#" className="block px-4 py-1 text-gray-300 hover:text-blue-400 transition-colors">關於</a></li>
            </ul>
          </div>
        )}
      </header>
      
      <main className="container mx-auto p-4">
        {/* 搜索區域 - 響應式設計 */}
        <div className="mb-6 bg-gray-800 p-4 rounded-lg shadow-lg border border-blue-900/20">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-blue-300">輸入股票/期貨代號</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <input 
                type="text" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="輸入美股、海外期貨或台股代號" 
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <select 
                value={marketType}
                onChange={(e) => setMarketType(e.target.value as any)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="us">美股</option>
                <option value="tw">台股</option>
                <option value="futures">海外期貨</option>
              </select>
            </div>
            
            <div>
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="1d">日線圖</option>
                <option value="1h">小時圖</option>
                <option value="15m">15分鐘圖</option>
                <option value="5m">5分鐘圖</option>
                <option value="1m">1分鐘圖</option>
                <option value="1wk">週線圖</option>
                <option value="1mo">月線圖</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !symbol.trim()}
              className={`
                bg-blue-600 hover:bg-blue-700 px-4 md:px-6 py-2 rounded font-medium transition-colors
                flex items-center space-x-2 pulse-button
                ${isAnalyzing || !symbol.trim() ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm md:text-base">分析中...</span>
                </>
              ) : (
                <span className="text-sm md:text-base">開始分析</span>
              )}
            </button>
          </div>
        </div>
        
        {/* 主要內容區域 - 響應式設計 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* K線圖區域 */}
          <div className="lg:col-span-2 bg-gray-800 p-3 md:p-4 rounded-lg shadow-lg border border-blue-900/20">
            <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-4 text-blue-300">K線圖</h3>
            <div className="aspect-video bg-gray-700 rounded chart-container">
              {candlestickData.length > 0 ? (
                <ChartComponent data={candlestickData} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 md:h-12 w-8 md:w-12 mx-auto text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-400 text-sm md:text-base">輸入股票代號並點擊分析以顯示K線圖</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 指標按鈕 - 響應式設計 */}
            <div className="mt-3 md:mt-4 flex flex-wrap gap-1 md:gap-2">
              <button className="px-2 md:px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm transition-colors">MA</button>
              <button className="px-2 md:px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm transition-colors">EMA</button>
              <button className="px-2 md:px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm transition-colors">MACD</button>
              <button className="px-2 md:px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm transition-colors">RSI</button>
              <button className="px-2 md:px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm transition-colors">布林帶</button>
              <button className="px-2 md:px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm transition-colors">成交量</button>
              <button className="px-2 md:px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm transition-colors">斐波那契</button>
            </div>
          </div>
          
          {/* 技術指標分析區域 */}
          <div className="bg-gray-800 p-3 md:p-4 rounded-lg shadow-lg border border-blue-900/20">
            <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-4 text-blue-300">技術指標分析</h3>
            <div className="space-y-3 md:space-y-4 text-sm md:text-base">
              <TechCard title="艾略特波浪理論">
                <p>{getWaveAnalysis()}</p>
              </TechCard>
              
              <TechCard title="市場結構（高點低點識別）">
                <p>{getMarketStructureAnalysis()}</p>
              </TechCard>
              
              <TechCard title="RSI背離">
                <p>{getRSIDivergenceAnalysis()}</p>
              </TechCard>
              
              <TechCard title="VWAP">
                <p>{getVWAPAnalysis()}</p>
              </TechCard>
              
              <TechCard title="ATR動態止損">
                <p>{getATRStopLossAnalysis()}</p>
              </TechCard>
              
              <TechCard title="市場情緒">
                <p>{getMarketSentimentAnalysis()}</p>
              </TechCard>
              
              <div className="mt-4 md:mt-6 p-3 bg-blue-900/20 rounded border border-blue-800/30">
                <h4 className="font-medium text-blue-400">綜合建議</h4>
                <p className="text-gray-300 mt-1">{getOverallRecommendation()}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 回測結果區域 - 響應式設計 */}
        <div className="mt-4 md:mt-6 bg-gray-800 p-3 md:p-4 rounded-lg shadow-lg border border-blue-900/20">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-blue-300 mb-2 md:mb-0">回測結果</h3>
            <div className="flex space-x-2">
              <button className="px-3 md:px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm transition-colors">
                設置參數
              </button>
              <button 
                className="px-3 md:px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs md:text-sm transition-colors"
                disabled={!candlestickData.length}
              >
                開始回測
              </button>
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 md:p-4 rounded chart-container">
            {/* 回測統計卡片 - 響應式設計 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-4">
              <div className="bg-gray-800 p-2 md:p-3 rounded">
                <div className="text-gray-400 text-xs md:text-sm">勝率</div>
                <div className="text-base md:text-xl font-semibold text-blue-400">
                  {analysisResult.backtestResult ? 
                    `${(analysisResult.backtestResult.winRate * 100).toFixed(2)}%` : 
                    '--'}
                </div>
              </div>
              <div className="bg-gray-800 p-2 md:p-3 rounded">
                <div className="text-gray-400 text-xs md:text-sm">盈虧比</div>
                <div className="text-base md:text-xl font-semibold text-blue-400">
                  {analysisResult.backtestResult ? 
                    analysisResult.backtestResult.profitFactor.toFixed(2) : 
                    '--'}
                </div>
              </div>
              <div className="bg-gray-800 p-2 md:p-3 rounded">
                <div className="text-gray-400 text-xs md:text-sm">最大回撤</div>
                <div className="text-base md:text-xl font-semibold text-blue-400">
                  {analysisResult.backtestResult ? 
                    `${(analysisResult.backtestResult.maxDrawdown * 100).toFixed(2)}%` : 
                    '--'}
                </div>
              </div>
              <div className="bg-gray-800 p-2 md:p-3 rounded">
                <div className="text-gray-400 text-xs md:text-sm">年化收益</div>
                <div className="text-base md:text-xl font-semibold text-blue-400">
                  {analysisResult.backtestResult ? 
                    `${(analysisResult.backtestResult.annualReturn * 100).toFixed(2)}%` : 
                    '--'}
                </div>
              </div>
            </div>
            
            {/* 回測圖表區域 */}
            <div className="aspect-[3/1] bg-gray-800 rounded flex items-center justify-center">
              {analysisResult.backtestResult ? (
                <div className="w-full h-full p-2 md:p-4">
                  <p className="text-center mb-2 md:mb-4 text-sm md:text-base">回測結果圖表</p>
                  {/* 這裡可以添加回測結果圖表 */}
                </div>
              ) : (
                <p className="text-gray-400 text-sm md:text-base">請先進行回測以查看結果圖表</p>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* 頁腳 - 響應式設計 */}
      <footer className="bg-gray-800 p-3 md:p-4 mt-6 md:mt-8 border-t border-blue-900/30">
        <div className="container mx-auto text-center text-gray-400 text-xs md:text-sm">
          <p>© 2025 專業投資分析平台 | 免責聲明：本網站提供的分析僅供參考，不構成投資建議</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
