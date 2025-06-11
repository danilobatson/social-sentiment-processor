// src/types/lunarcrush.ts

export interface CoinData {
	id: number;
	symbol: string;
	name: string;
	price: number;
	sentiment: number;
	interactions_24h: number;
	social_volume_24h: number;
	social_dominance: number;
	percent_change_24h: number;
	galaxy_score: number;
	alt_rank: number;
	market_cap: number;
	last_updated_price: number;
	topic: string;
	logo: string;
}

export interface LunarCrushResponse {
	data: CoinData[];
}

export interface SentimentAlert {
	id: string;
	symbol: string;
	name: string;
	sentiment: number;
	previousSentiment?: number;
	changeType: 'spike' | 'drop' | 'normal';
	timestamp: number;
	message: string;
	price: number;
	percentChange24h: number;
}

export interface InngestEventData {
	timestamp: number;
	checkType: 'scheduled' | 'manual';
	coins?: string[]; // Optional: specific coins to check
}

export interface ProcessingResult {
	success: boolean;
	alertsGenerated: number;
	coinsProcessed: number;
	errors?: string[];
	duration: number;
}

export interface SingleCoinResponse {
  config: {
    id: string;
    name: string;
    symbol: string;
    topic: string;
    generated: number;
  };
  data: {
    id: number;
    name: string;
    symbol: string;
    price: number;
    price_btc: number;
    market_cap: number;
    percent_change_24h: number;
    percent_change_7d: number;
    percent_change_30d: number;
    volume_24h: number;
    max_supply: number | null;
    circulating_supply: number;
    close: number;
    galaxy_score: number;
    alt_rank: number;
    volatility: number;
    market_cap_rank: number;
  };
}
