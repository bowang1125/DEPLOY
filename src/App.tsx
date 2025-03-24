import { useState, useEffect, useCallback } from 'react';
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
  calculateMA,
  calculateEMA,
  calculateMACD,
  calculateBollingerBands,
  calculateFibonacciLevels,
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
  const [errorMessage, setErrorMessage] = useState<string>('');
  
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
  
  // 技術指標狀態
  const [activeIndicators, setActiveIndicators] = useState<{
    ma: boolean;
    ema: boolean;
    macd: boolean;
    rsi: boolean;
    bollingerBands: boolean;
    volume: boolean;
    fibonacci: boolean;
  }>({
    ma: false,
    ema: false,
    macd: false,
    rsi: false,
    bollingerBands: false,
    volume: false,
    fibonacci: false
  });
  
  const [indicators, setIndicators] = useState<{
    ma: number[][] | null;
    ema: number[][] | null;
    macd: {
      macd: number[];
      signal: number[];
      histogram: number[];
    } | null;
    rsi: number[] | null;
    bollingerBands: {
      upper: number[];
      middle: number[];
      lower: number[];
    } | null;
    volume: number[] | null;
    fibonacci: {
      levels: { [key: string]: number };
      trend: 'up' | 'down';
    } | null;
  }>({
    ma: null,
    ema: null,
    macd: null,
    rsi: null,
    bollingerBands: null,
    volume: null,
    fibonacci: null
  });
  
  // 處理分析請求
  const handleAnalyze = async () => {
    if (!symbol.trim()) {
      setErrorMessage('請輸入股票代號');
      return;
    }
    
    setIsAnalyzing(true);
    setErrorMessage('');
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
    
    // 重置指標
    setIndicators({
      ma: null,
      ema: null,
      macd: null,
      rsi: null,
      bollingerBands: null,
      volume: null,
      fibonacci: null
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
      
      console.log(`開始分析: ${adjustedSymbol}, 時間間隔: ${timeframe}`);
      
      // 獲取股票數據
      const stockData = await fetchStockData(adjustedSymbol, timeframe, '1y');
      
      if (!stockData) {
        setErrorMessage(`找不到股票代號 ${symbol} 的數據，請確認代號是否正確`);
        setIsAnalyzing(false);
        return;
      }
      
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
        
        // 計算其他技術指標
        // MA
        const ma10 = calculateMA(stockData.close, 10);
        const ma20 = calculateMA(stockData.close, 20);
        const ma50 = calculateMA(stockData.close, 50);
        
        // EMA
        const ema12 = calculateEMA(stockData.close, 12);
        const ema26 = calculateEMA(stockData.close, 26);
        const ema50 = calculateEMA(stockData.close, 50);
        
        // MACD
        const macd = calculateMACD(stockData.close);
        
        // 布林帶
        const bollingerBands = calculateBollingerBands(stockData.close);
        
        // 斐波那契回調
        const fibonacci = calculateFibonacciLevels(stockData.high, stockData.low);
        
        // 更新指標
        setIndicators({
          ma: [ma10, ma20, ma50],
          ema: [ema12, ema26, ema50],
          macd,
          rsi: rsiValues,
          bollingerBands,
          volume: stockData.volume,
          fibonacci
        });
      } else {
        setErrorMessage(`找不到股票代號 ${symbol} 的數據，請確認代號是否正確`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setErrorMessage(`分析過程中出錯: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 處理指標按鈕點擊
  const handleIndicatorToggle = useCallback((indicator: keyof typeof activeIndicators) => {
    setActiveIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  }, []);
  
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
    
    const buyStopLoss = lastPrice - lastATR * 2;
    const sellStopLoss = lastPrice + lastATR * 2;
    
    return `
      當前ATR值: ${lastATR.toFixed(2)}
      多頭止損位: ${buyStopLoss.toFixed(2)} (當前價格 - 2ATR)
      空頭止損位: ${sellStopLoss.toFixed(2)} (當前價格 + 2ATR)
    `;
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 頂部導航欄 */}
      <nav className="bg-gray-800 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <a href="#" className="text-xl md:text-2xl font-bold text-blue-400 glow-text">專業投資分析平台</a>
          
          <div className="hidden md:flex space-x-6">
            <a href="#" className="hover:text-blue-400 transition-colors">首頁</a>
            <a href="#" className="hover:text-blue-400 transition-colors">回測歷史</a>
            <a href="#" className="hover:text-blue-400 transition-colors">關於</a>
          </div>
          
          <button 
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
        
        {/* 移動端菜單 */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 bg-gray-700 rounded shadow-lg p-2">
            <a href="#" className="block p-2 hover:bg-gray-600 rounded">首頁</a>
            <a href="#" className="block p-2 hover:bg-gray-600 rounded">回測歷史</a>
            <a href="#" className="block p-2 hover:bg-gray-600 rounded">關於</a>
          </div>
        )}
      </nav>
      
      {/* 主要內容 */}
      <div className="container mx-auto p-4 md:p-6">
        {/* 輸入區域 */}
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6 border border-blue-900/20">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-blue-300">輸入股票/期貨代號</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                onChange={(e) => setMarketType(e.target.value as 'us' | 'tw' | 'futures')}
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
          
          {/* 錯誤訊息 */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
              {errorMessage}
            </div>
          )}
        </div>
        
        {/* 主要內容區域 - 響應式設計 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* K線圖區域 */}
          <div className="lg:col-span-2 bg-gray-800 p-3 md:p-4 rounded-lg shadow-lg border border-blue-900/20">
            <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-4 text-blue-300">K線圖</h3>
            <div className="aspect-video bg-gray-700 rounded chart-container">
              {candlestickData.length > 0 ? (
                <ChartComponent 
                  data={candlestickData} 
                  indicators={indicators}
                  activeIndicators={activeIndicators}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {isAnalyzing ? '載入中...' : '輸入股票代號並點擊分析以顯示K線圖'}
                </div>
              )}
            </div>
            
            {/* 技術指標按鈕 */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button 
                onClick={() => handleIndicatorToggle('ma')}
                className={`px-3 py-1 rounded text-xs md:text-sm ${activeIndicators.ma ? 'bg-orange-600' : 'bg-gray-600 hover:bg-gray-500'}`}
              >
                MA
              </button>
              <button 
                onClick={() => handleIndicatorToggle('ema')}
                className={`px-3 py-1 rounded text-xs md:text-sm ${activeIndicators.ema ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'}`}
              >
                EMA
              </button>
              <button 
                onClick={() => handleIndicatorToggle('macd')}
                className={`px-3 py-1 rounded text-xs md:text-sm ${activeIndicators.macd ? 'bg-pink-600' : 'bg-gray-600 hover:bg-gray-500'}`}
              >
                MACD
              </button>
              <button 
                onClick={() => handleIndicatorToggle('rsi')}
                className={`px-3 py-1 rounded text-xs md:text-sm ${activeIndicators.rsi ? 'bg-purple-600' : 'bg-gray-600 hover:bg-gray-500'}`}
              >
                RSI
              </button>
              <button 
                onClick={() => handleIndicatorToggle('bollingerBands')}
                className={`px-3 py-1 rounded text-xs md:text-sm ${activeIndicators.bollingerBands ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
              >
                布林帶
              </button>
              <button 
                onClick={() => handleIndicatorToggle('volume')}
                className={`px-3 py-1 rounded text-xs md:text-sm ${activeIndicators.volume ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'}`}
              >
                成交量
              </button>
              <button 
                onClick={() => handleIndicatorToggle('fibonacci')}
                className={`px-3 py-1 rounded text-xs md:text-sm ${activeIndicators.fibonacci ? 'bg-indigo-600' : 'bg-gray-600 hover:bg-gray-500'}`}
              >
                斐波那契
              </button>
            </div>
          </div>
          
          {/* 技術指標分析區域 */}
          <div className="bg-gray-800 p-3 md:p-4 rounded-lg shadow-lg border border-blue-900/20">
            <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-4 text-blue-300">技術指標分析</h3>
            
            <div className="space-y-3 md:space-y-4">
              <TechCard title="艾略特波浪理論">
                <p>{getWaveAnalysis()}</p>
              </TechCard>
              
              <TechCard title="市場結構 (高點低點識別)">
                <p>{getMarketStructureAnalysis()}</p>
              </TechCard>
              
              <TechCard title="RSI背離">
                <p>{getRSIDivergenceAnalysis()}</p>
              </TechCard>
              
              <TechCard title="VWAP">
                <p>{getVWAPAnalysis()}</p>
              </TechCard>
              
              <TechCard title="ATR動態止損">
                <p className="whitespace-pre-line">{getATRStopLossAnalysis()}</p>
              </TechCard>
              
              <TechCard title="市場情緒">
                <p>{candlestickData.length > 0 ? '市場情緒中性' : '尚未分析'}</p>
              </TechCard>
              
              <TechCard title="綜合建議" className="border-l-4 border-blue-500">
                <p className="font-medium text-lg">{getLatestSignal()}</p>
                {analysisResult.backtestResult && (
                  <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                    <div>勝率: {(analysisResult.backtestResult.winRate * 100).toFixed(1)}%</div>
                    <div>獲利因子: {analysisResult.backtestResult.profitFactor.toFixed(2)}</div>
                    <div>最大回撤: {(analysisResult.backtestResult.maxDrawdown * 100).toFixed(1)}%</div>
                    <div>年化收益: {(analysisResult.backtestResult.annualReturn * 100).toFixed(1)}%</div>
                  </div>
                )}
              </TechCard>
            </div>
          </div>
        </div>
      </div>
      
      {/* 頁腳 */}
      <footer className="bg-gray-800 p-4 mt-8 text-center text-gray-400 text-sm">
        <p>© 2025 專業投資分析平台 | 免責聲明：本網站提供的分析僅供參考，不構成投資建議</p>
      </footer>
      
      {/* 全局樣式 */}
      <style jsx global>{`
        .glow-text {
          text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        
        .tech-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .tech-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .pulse-button {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
      `}</style>
    </div>
  );
}

export default App;
