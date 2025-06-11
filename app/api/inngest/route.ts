// app/api/inngest/route.ts

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { processSentimentData } from '@/functions/processSentiment';

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [processSentimentData],
});
