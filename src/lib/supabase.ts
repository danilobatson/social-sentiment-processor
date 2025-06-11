// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { SentimentHistory, ProcessingJob } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
export const saveSentimentHistory = async (data: Omit<SentimentHistory, 'id' | 'created_at'>) => {
  const { error } = await supabase
    .from('sentiment_history')
    .insert(data);

  if (error) throw error;
};

export const createProcessingJob = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('processing_jobs')
    .insert({ status: 'pending' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

export const updateProcessingJob = async (
  id: string,
  updates: Partial<ProcessingJob>
) => {
  const { error } = await supabase
    .from('processing_jobs')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
};

export const getRecentSentiment = async (symbol: string, hours: number = 24) => {
  const { data, error } = await supabase
    .from('sentiment_history')
    .select('*')
    .eq('symbol', symbol)
    .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
