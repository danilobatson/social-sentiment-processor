// src/lib/constants.ts

export const SENTIMENT_THRESHOLDS = {
	HIGH_ALERT: 85,
	LOW_ALERT: 15,
	SIGNIFICANT_CHANGE: 0.2, // 20% change
} as const;

export const MONITORED_COINS = [
	'BTC',
	'ETH',
	'SOL',
	'DOGE',
	'SHIB',
	'PEPE',
	'WIF',
	'BONK',
] as const;

export const PROCESSING_CONFIG = {
	MAX_COINS_TO_PROCESS: 100,
	API_TIMEOUT_MS: 10000,
	RETRY_ATTEMPTS: 3,
	RETRY_DELAY_MS: 1000,
} as const;

export const API_ENDPOINTS = {
	COINS_LIST_V1: '/coins/list/v1',
	COINS_LIST_V2: '/coins/list/v2',
	SINGLE_COIN: '/coins',
	TOPICS_LIST: '/topics/list/v1',
	CREATORS_LIST: '/creators/list/v1',
} as const;

export const DISCORD_COLORS = {
	SUCCESS: 0x00ff00,
	WARNING: 0xffff00,
	ERROR: 0xff0000,
	INFO: 0x0099ff,
} as const;
