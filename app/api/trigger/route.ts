// app/api/trigger/route.ts

import { inngest } from '@/lib/inngest';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		console.log('🚀 Trigger API called at:', new Date().toISOString());

		const body = await request.json();
		const { coins } = body;

		console.log('📋 Requested coins:', coins);

		// Send event to Inngest
		const eventId = await inngest.send({
			name: 'sentiment/process',
			data: {
				timestamp: Date.now(),
				checkType: 'manual',
				coins: coins || undefined,
			},
		});

		console.log('✅ Event sent to Inngest with ID:', eventId);

		return NextResponse.json({
			success: true,
			eventId,
			message: 'Sentiment processing job queued successfully',
		});
	} catch (error) {
		console.error('❌ Failed to trigger sentiment processing:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to queue processing job',
			},
			{ status: 500 }
		);
	}
}

export async function GET() {
	return NextResponse.json({
		status: 'Sentiment Processing API',
		endpoints: {
			POST: 'Queue a new sentiment processing job',
		},
	});
}
