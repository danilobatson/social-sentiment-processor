// src/types/database.ts

export interface SentimentHistory {
	id: string;
	symbol: string;
	sentiment: number;
	price: number;
	interactions_24h: number;
	percent_change_24h: number;
	galaxy_score: number;
	created_at: string;
}

export interface ProcessingJob {
	id: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	coins_processed: number;
	alerts_generated: number;
	duration_ms?: number;
	error_message?: string;
	created_at: string;
	completed_at?: string;
}
