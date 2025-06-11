// src/functions/processSentiment.ts

import { inngest } from '@/lib/inngest';
import { getCoinsWithSentiment } from '@/services/lunarcrush';
import {
	saveSentimentHistory,
	createProcessingJob,
	updateProcessingJob,
	getRecentSentiment,
} from '@/lib/supabase';
import { MONITORED_COINS } from '@/lib/constants';
import { SentimentAlert } from '@/types/lunarcrush';

export const processSentimentData = inngest.createFunction(
	{ id: 'process-sentiment-data' },
	{ event: 'sentiment/process' },
	async ({ event, step }) => {
		const startTime = Date.now();

		// Step 1: Create processing job record
		const jobId = await step.run('create-job', async () => {
			return await createProcessingJob();
		});

		// Step 2: Update job status to processing
		await step.run('start-processing', async () => {
			await updateProcessingJob(jobId, {
				status: 'processing',
			});
		});

		// Step 3: Fetch current sentiment data
		const currentData = await step.run('fetch-sentiment-data', async () => {
			const coins = event.data.coins || MONITORED_COINS;
			const data = await getCoinsWithSentiment(coins as string[]);
			return data;
		});

		// Step 4: Process each coin and detect changes
		const alerts = await step.run('analyze-sentiment-changes', async () => {
			const alertPromises = currentData.map(async (coin) => {
				try {
					// Get recent sentiment history for comparison
					const recentHistory = await getRecentSentiment(coin.symbol, 24);
					const previousSentiment =
						recentHistory.length > 0 ? recentHistory[0].sentiment : undefined; // Detect sentiment changes
					let changeType: 'spike' | 'drop' | 'normal' = 'normal';

					if (previousSentiment) {
						// Compare with historical data
						const change = coin.sentiment - previousSentiment;
						const percentChange = Math.abs(change) / previousSentiment;

						// 10% threshold for production
						if (percentChange > 0.1) {
							if (change > 0 && coin.sentiment >= 70) {
								changeType = 'spike';
							}
							if (change < 0 && coin.sentiment <= 30) {
								changeType = 'drop';
							}
						}
					} else {
						// No historical data - alert on extreme values
						if (coin.sentiment >= 80) {
							changeType = 'spike';
						} else if (coin.sentiment <= 20) {
							changeType = 'drop';
						}
					}

					// Save current data to history
					const sentimentData = {
						symbol: coin.symbol,
						sentiment: coin.sentiment,
						price: coin.price,
						interactions_24h: coin.interactions_24h,
						percent_change_24h: coin.percent_change_24h,
						galaxy_score: coin.galaxy_score,
					};

					await saveSentimentHistory(sentimentData);

					// Generate alert if significant change
					if (changeType !== 'normal') {
						const alert: SentimentAlert = {
							id: `${coin.symbol}-${Date.now()}`,
							symbol: coin.symbol,
							name: coin.name,
							sentiment: coin.sentiment,
							previousSentiment,
							changeType,
							timestamp: Date.now(),
							message: generateAlertMessage(
								coin.symbol,
								coin.sentiment,
								changeType,
								previousSentiment
							),
							price: coin.price,
							percentChange24h: coin.percent_change_24h,
						};

						return alert;
					}

					return null;
				} catch (error) {
					console.error(`Error processing ${coin.symbol}:`, error);
					return null;
				}
			});

			const results = await Promise.allSettled(alertPromises);
			const successfulAlerts = results
				.filter(
					(result): result is PromiseFulfilledResult<SentimentAlert> =>
						result.status === 'fulfilled' && result.value !== null
				)
				.map((result) => result.value);

			return successfulAlerts;
		});

		// Step 5: Send alerts if any were generated
		await step.run('send-alerts', async () => {
			if (alerts.length > 0 && process.env.DISCORD_WEBHOOK_URL) {
				await sendDiscordAlerts(alerts);
			}
		});

		// Step 6: Complete the job
		await step.run('complete-job', async () => {
			const duration = Date.now() - startTime;
			await updateProcessingJob(jobId, {
				status: 'completed',
				coins_processed: currentData.length,
				alerts_generated: alerts.length,
				duration_ms: duration,
				completed_at: new Date().toISOString(),
			});
		});

		return {
			success: true,
			coinsProcessed: currentData.length,
			alertsGenerated: alerts.length,
			duration: Date.now() - startTime,
			alerts: alerts.map((alert) => ({
				symbol: alert.symbol,
				sentiment: alert.sentiment,
				changeType: alert.changeType,
				message: alert.message,
			})),
		};
	}
);

// Generate alert messages
function generateAlertMessage(
	symbol: string,
	sentiment: number,
	changeType: 'spike' | 'drop',
	previousSentiment?: number
): string {
	const direction = changeType === 'spike' ? '📈' : '📉';

	if (previousSentiment) {
		const change = sentiment - previousSentiment;
		const percentChange = (change / previousSentiment) * 100;
		return `${direction} ${symbol} sentiment ${changeType}! Now at ${sentiment}/100 (${
			change > 0 ? '+' : ''
		}${change.toFixed(1)} from ${previousSentiment}, ${
			percentChange > 0 ? '+' : ''
		}${percentChange.toFixed(1)}%)`;
	} else {
		return `${direction} ${symbol} has ${
			changeType === 'spike' ? 'high' : 'low'
		} sentiment at ${sentiment}/100 (first analysis)`;
	}
}

// Send Discord alerts
async function sendDiscordAlerts(alerts: SentimentAlert[]) {
	const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
	if (!webhookUrl) return;

	const embed = {
		title: '🚨 Crypto Sentiment Alerts',
		description: `${alerts.length} significant sentiment ${
			alerts.length === 1 ? 'change' : 'changes'
		} detected`,
		color: alerts.some((a) => a.changeType === 'drop') ? 0xff0000 : 0x00ff00,
		fields: alerts.slice(0, 10).map((alert) => ({
			name: `${alert.symbol} ${alert.changeType === 'spike' ? '📈' : '📉'}`,
			value: alert.message,
			inline: false,
		})),
		timestamp: new Date().toISOString(),
		footer: {
			text: 'Social Sentiment Processor • Powered by LunarCrush',
		},
	};

	try {
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ embeds: [embed] }),
		});

		if (!response.ok) {
			console.error(
				'Discord webhook failed:',
				response.status,
				response.statusText
			);
		}
	} catch (error) {
		console.error('Failed to send Discord alert:', error);
	}
}
