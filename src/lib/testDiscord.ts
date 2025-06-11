export async function testDiscordWebhook() {
	const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

	if (!webhookUrl) {
		console.log('No Discord webhook URL configured');
		return;
	}

	try {
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				embeds: [
					{
						title: '🧪 Discord Integration Test',
						description: 'Your LunarCrush sentiment processor is connected!',
						color: 0x00ff00, // Green
						fields: [
							{
								name: 'Status',
								value: '✅ Successfully connected',
								inline: true,
							},
							{
								name: 'Next Step',
								value: 'Monitor real sentiment changes',
								inline: true,
							},
						],
						timestamp: new Date().toISOString(),
						footer: {
							text: 'LunarCrush + Inngest Processor',
						},
					},
				],
			}),
		});

		if (response.ok) {
			console.log('✅ Discord webhook test successful!');
			return true;
		} else {
			console.error('❌ Discord webhook failed:', response.status);
			return false;
		}
	} catch (error) {
		console.error('❌ Discord webhook error:', error);
		return false;
	}
}
