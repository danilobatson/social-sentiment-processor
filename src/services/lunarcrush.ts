import { LunarCrushResponse, CoinData, SingleCoinResponse } from '@/types/lunarcrush';

const BASE_URL = 'https://lunarcrush.com/api4/public';


const getApiKey = () => {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  if (!apiKey) {
    throw new Error('LUNARCRUSH_API_KEY environment variable is required');
  }
  return apiKey;
};

const makeRequest = async <T>(endpoint: string): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key - check your LunarCrush credentials');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded - upgrade your plan or try again later');
      }
      if (response.status >= 500) {
        throw new Error('LunarCrush API is temporarily unavailable');
      }

      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error('LunarCrush API Error:', error.message);
      throw error;
    }
    throw new Error('Unknown error occurred while fetching data');
  }
};

// Convert single coin response to match our CoinData interface
const normalizeSingleCoinData = (response: SingleCoinResponse): CoinData => {
  return {
    id: response.data.id,
    symbol: response.data.symbol,
    name: response.data.name,
    price: response.data.price,
    sentiment: 0, // Not available in single coin endpoint
    interactions_24h: 0, // Not available in single coin endpoint
    social_volume_24h: 0, // Not available in single coin endpoint
    social_dominance: 0, // Not available in single coin endpoint
    percent_change_24h: response.data.percent_change_24h,
    galaxy_score: response.data.galaxy_score,
    alt_rank: response.data.alt_rank,
    market_cap: response.data.market_cap,
    last_updated_price: Date.now() / 1000,
    topic: response.config.topic,
    logo: `https://cdn.lunarcrush.com/${response.data.symbol.toLowerCase()}.png`,
  };
};

// Fetch all coins (efficient for batch processing)
export const getAllCoins = async (): Promise<CoinData[]> => {
  const response = await makeRequest<LunarCrushResponse>('/coins/list/v1');
  return response.data;
};

// Fetch single coin by symbol (efficient for individual lookups)
export const getCoinBySymbol = async (symbol: string): Promise<CoinData | null> => {
  try {
    const response = await makeRequest<SingleCoinResponse>(`/coins/${symbol.toUpperCase()}/v1`);
    return normalizeSingleCoinData(response);
  } catch (error) {
    // Return null if coin not found, otherwise re-throw
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

// Fetch multiple coins by symbols (uses individual endpoint for efficiency)
export const getCoinsBySymbols = async (symbols: string[]): Promise<CoinData[]> => {
  const coinPromises = symbols.map(symbol => getCoinBySymbol(symbol));
  const results = await Promise.allSettled(coinPromises);

  return results
    .filter((result): result is PromiseFulfilledResult<CoinData> =>
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);
};

// For sentiment analysis, we need the full list (has sentiment data)
export const getCoinsWithSentiment = async (symbols?: string[]): Promise<CoinData[]> => {
  const allCoins = await getAllCoins();

  let filteredCoins = allCoins;

  if (symbols && symbols.length > 0) {
    const upperSymbols = symbols.map(s => s.toUpperCase());
    filteredCoins = allCoins.filter(coin =>
      upperSymbols.includes(coin.symbol.toUpperCase())
    );
  }

  // Deduplicate by symbol - keep the one with highest market cap
  const deduplicatedCoins = Object.values(
    filteredCoins.reduce((acc, coin) => {
      const symbol = coin.symbol.toUpperCase();

      // If we haven't seen this symbol, or this coin has higher market cap
      if (!acc[symbol] || coin.market_cap > acc[symbol].market_cap) {
        acc[symbol] = coin;
      }

      return acc;
    }, {} as Record<string, CoinData>)
  );

  return deduplicatedCoins;
};

export const getTopCoins = async (limit: number = 100): Promise<CoinData[]> => {
  const allCoins = await getAllCoins();
  return allCoins
    .sort((a, b) => b.market_cap - a.market_cap)
    .slice(0, limit);
};

export const detectSentimentChange = (current: number, previous?: number): 'spike' | 'drop' | 'normal' => {
  if (!previous) return 'normal';

  const change = current - previous;
  const percentChange = Math.abs(change) / previous;

  // Significant change if >20% difference and crosses important thresholds
  if (percentChange > 0.2) {
    if (change > 0 && current >= 80) return 'spike';
    if (change < 0 && current <= 20) return 'drop';
  }

  return 'normal';
};
