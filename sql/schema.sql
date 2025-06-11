-- Social Sentiment Processor Database Schema
-- Run this in your Supabase SQL Editor

-- Sentiment history table for trend analysis
CREATE TABLE sentiment_history (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  sentiment DECIMAL(10,2) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  interactions_24h BIGINT,
  percent_change_24h DECIMAL(10,4),
  galaxy_score DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing jobs table for monitoring
CREATE TABLE processing_jobs (
  id SERIAL PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  coins_processed INTEGER DEFAULT 0,
  alerts_generated INTEGER DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Performance indexes
CREATE INDEX idx_sentiment_symbol_time ON sentiment_history(symbol, created_at DESC);
CREATE INDEX idx_jobs_status ON processing_jobs(status, created_at DESC);
