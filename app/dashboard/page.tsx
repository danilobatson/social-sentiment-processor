// app/dashboard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProcessingJob, SentimentHistory } from '@/types/database';
import { MONITORED_COINS } from '@/lib/constants';

export default function Dashboard() {
	const [jobs, setJobs] = useState<ProcessingJob[]>([]);
	const [recentSentiment, setRecentSentiment] = useState<SentimentHistory[]>(
		[]
	);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentStep, setCurrentStep] = useState('');
	const [selectedCoins, setSelectedCoins] = useState<string[]>([
		...MONITORED_COINS,
	]);
	const [lastAnalysisResults, setLastAnalysisResults] = useState<{
		processed: string[];
		found: string[];
		missing: string[];
	}>({ processed: [], found: [], missing: [] });

	// Processing steps with realistic timing
	const processingSteps = [
		{ message: 'Queuing background job with Inngest...', duration: 1000 },
		{
			message: 'Fetching sentiment data from LunarCrush API...',
			duration: 2500,
		},
		{ message: 'Analyzing sentiment changes and trends...', duration: 2000 },
		{ message: 'Saving results to database...', duration: 1500 },
		{ message: 'Finalizing and updating dashboard...', duration: 1000 },
	];

	useEffect(() => {
		fetchJobs();
		fetchRecentSentiment();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchJobs = async () => {
		const { data } = await supabase
			.from('processing_jobs')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(10);

		if (data) setJobs(data);
	};

	const fetchRecentSentiment = async () => {
		const { data } = await supabase
			.from('sentiment_history')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(50);

		if (data) {
			setRecentSentiment(data);

			// Analyze ONLY the most recent analysis run
			if (data.length > 0) {
				// Get the most recent timestamp (latest analysis)
				const latestTimestamp = data[0].created_at;
				const cutoffTime = new Date(
					new Date(latestTimestamp).getTime() - 60000
				); // 1 minute window

				// Get coins from the most recent analysis run only
				const latestAnalysisCoins = data
					.filter((entry) => new Date(entry.created_at) >= cutoffTime)
					.map((entry) => entry.symbol);

				const foundCoins = Array.from(new Set(latestAnalysisCoins));
				const processed =
					selectedCoins.length > 0 ? selectedCoins : [...MONITORED_COINS];
				const missing = processed.filter((coin) => !foundCoins.includes(coin));

				setLastAnalysisResults({
					processed,
					found: foundCoins,
					missing,
				});
			}
		}
	};

	const clearSentimentHistory = async () => {
		try {
			await supabase
				.from('sentiment_history')
				.delete()
				.neq('id', '00000000-0000-0000-0000-000000000000');
			setRecentSentiment([]);
			setLastAnalysisResults({ processed: [], found: [], missing: [] });
		} catch (error) {
			console.error('Failed to clear history:', error);
		}
	};

	const triggerProcessing = async () => {
		setIsProcessing(true);
		setProgress(0);
		setCurrentStep('');

		try {
			const response = await fetch('/api/trigger', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ coins: selectedCoins }),
			});

			if (response.ok) {
				// Animate through processing steps
				let stepIndex = 0;
				let totalElapsed = 0;
				const totalDuration = processingSteps.reduce(
					(sum, step) => sum + step.duration,
					0
				);

				const runStep = () => {
					if (stepIndex < processingSteps.length) {
						const step = processingSteps[stepIndex];
						setCurrentStep(step.message);

						const stepStart = Date.now();
						const animateStep = () => {
							const stepElapsed = Date.now() - stepStart;
							const stepProgress = Math.min(stepElapsed / step.duration, 1);
							const overallProgress =
								((totalElapsed + stepElapsed) / totalDuration) * 100;

							setProgress(Math.min(overallProgress, 100));

							if (stepProgress < 1) {
								requestAnimationFrame(animateStep);
							} else {
								totalElapsed += step.duration;
								stepIndex++;
								setTimeout(runStep, 100);
							}
						};

						requestAnimationFrame(animateStep);
					} else {
						setCurrentStep('Complete! Refreshing data...');
						setProgress(100);
						setTimeout(() => {
							fetchJobs();
							fetchRecentSentiment();
							setIsProcessing(false);
							setProgress(0);
							setCurrentStep('');
						}, 500);
					}
				};

				runStep();
			} else {
				setIsProcessing(false);
				setProgress(0);
				setCurrentStep('');
			}
		} catch (error) {
			console.error('Failed to trigger processing:', error);
			setIsProcessing(false);
			setProgress(0);
			setCurrentStep('');
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
			{/* Header */}
			<div className='bg-gray-800 shadow-lg border-b border-gray-700'>
				<div className='max-w-7xl mx-auto px-6 py-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center space-x-3'>
							<div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
								<span className='text-white text-xl'>🚀</span>
							</div>
							<div>
								<h1 className='text-2xl font-bold text-white'>
									Social Sentiment Processor
								</h1>
								<p className='text-sm text-gray-300'>
									Track crypto sentiment changes over time with background
									processing
								</p>
							</div>
						</div>
						<div className='flex items-center space-x-2 text-sm text-gray-300'>
							<div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
							<span>Live</span>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-6 py-8'>
				{/* Control Panel */}
				<div className='bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 mb-8'>
					<div className='flex items-center justify-between mb-6'>
						<div>
							<h2 className='text-xl font-semibold text-white'>
								Sentiment Change Detection
							</h2>
							<p className='text-gray-300 mt-1'>
								Fetch current sentiment scores and compare them to your previous
								analysis
							</p>
							<div className='mt-3 text-sm text-blue-300 bg-blue-900/20 rounded-lg p-4 border border-blue-700/30'>
								<div className='font-medium mb-2'>🎯 How it works:</div>
								<ul className='space-y-1 text-xs'>
									<li>
										• <span className='font-medium'>First Run:</span> Gets
										current sentiment scores and saves them as baseline
									</li>
									<li>
										• <span className='font-medium'>Future Runs:</span> Compares
										new scores vs. your saved history to detect spikes/drops
									</li>
									<li>
										• <span className='font-medium'>Alerts:</span> Flags
										significant changes (20%+ with extreme scores)
									</li>
								</ul>
							</div>
						</div>
						<div className='flex flex-col items-end space-y-2'>
							<div className='px-4 py-2 bg-blue-900/50 rounded-lg border border-blue-700/50'>
								<span className='text-sm font-medium text-blue-300'>
									Powered by Inngest
								</span>
							</div>
							<div className='px-4 py-2 bg-green-900/50 rounded-lg border border-green-700/50'>
								<span className='text-sm font-medium text-green-300'>
									Data by LunarCrush
								</span>
							</div>
						</div>
					</div>

					{/* Coin Selection */}
					<div className='mb-8'>
						<label className='block text-sm font-semibold text-gray-300 mb-4'>
							Select Cryptocurrencies to Monitor:
						</label>
						<div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3'>
							{MONITORED_COINS.map((coin) => (
								<label key={coin} className='cursor-pointer group'>
									<input
										type='checkbox'
										checked={selectedCoins.includes(coin)}
										onChange={(e) => {
											if (e.target.checked) {
												setSelectedCoins([...selectedCoins, coin]);
											} else {
												setSelectedCoins(
													selectedCoins.filter((c) => c !== coin)
												);
											}
										}}
										className='sr-only'
									/>
									<div
										className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 text-center relative ${
											selectedCoins.includes(coin)
												? 'border-blue-400 bg-blue-900/50 text-blue-200 shadow-lg shadow-blue-500/25 scale-105'
												: 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600 hover:scale-102'
										}`}>
										{selectedCoins.includes(coin) && (
											<div className='absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center'>
												<span className='text-white text-xs'>✓</span>
											</div>
										)}
										<span className='font-semibold text-sm'>{coin}</span>
									</div>
								</label>
							))}
						</div>
						<p className='text-sm text-gray-400 mt-3'>
							{selectedCoins.length} of {MONITORED_COINS.length}{' '}
							cryptocurrencies selected
						</p>
					</div>

					{/* Action Button & Progress */}
					<div className='space-y-6'>
						<button
							onClick={triggerProcessing}
							disabled={isProcessing || selectedCoins.length === 0}
							className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
								isProcessing
									? 'bg-gray-600 text-gray-400 cursor-not-allowed'
									: selectedCoins.length === 0
									? 'bg-gray-600 text-gray-400 cursor-not-allowed'
									: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
							}`}>
							{isProcessing ? (
								<div className='flex items-center justify-center space-x-3'>
									<div className='w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin'></div>
									<span>Processing Sentiment Changes...</span>
								</div>
							) : (
								`Check Sentiment Changes for ${selectedCoins.length} Cryptocurrencies`
							)}
						</button>

						{/* Enhanced Progress Section */}
						{isProcessing && (
							<div className='bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-blue-700/30'>
								<div className='flex items-center justify-between mb-4'>
									<div className='flex items-center space-x-3'>
										<div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
											<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
										</div>
										<div>
											<h3 className='font-semibold text-blue-200'>
												Processing in Progress
											</h3>
											<p className='text-sm text-blue-300'>{currentStep}</p>
										</div>
									</div>
									<div className='text-right'>
										<div className='text-2xl font-bold text-blue-200'>
											{Math.round(progress)}%
										</div>
										<div className='text-xs text-blue-400'>Complete</div>
									</div>
								</div>

								{/* Actual Progress Bar */}
								<div className='relative'>
									<div className='w-full bg-blue-900/50 rounded-full h-4 shadow-inner'>
										<div
											className='bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500 h-4 rounded-full shadow-lg transition-all duration-300 ease-out relative overflow-hidden'
											style={{ width: `${progress}%` }}>
											<div className='absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse'></div>
										</div>
									</div>
								</div>

								<div className='flex items-center justify-between mt-4 text-sm'>
									<span className='text-blue-300'>
										⚡ Comparing {selectedCoins.length} cryptocurrencies to
										history
									</span>
									<span className='text-blue-400'>
										~{Math.ceil((100 - progress) * 0.08)} seconds remaining
									</span>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Results Grid */}
				<div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
					{/* Recent Jobs */}
					<div className='bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden'>
						<div className='bg-gradient-to-r from-green-900/50 to-emerald-900/50 px-6 py-4 border-b border-gray-700'>
							<h2 className='text-lg font-semibold text-white flex items-center'>
								<div className='w-2 h-2 bg-green-400 rounded-full mr-3'></div>
								Analysis History
							</h2>
							<p className='text-sm text-gray-300 mt-1'>
								Track of your sentiment analysis requests
							</p>
						</div>

						<div className='p-6'>
							{jobs.length === 0 ? (
								<div className='text-center py-12'>
									<div className='w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4'>
										<span className='text-gray-400 text-2xl'>📊</span>
									</div>
									<p className='text-gray-400'>
										No analysis history yet. Start your first sentiment
										analysis!
									</p>
								</div>
							) : (
								<div className='space-y-4'>
									{jobs.map((job, index) => (
										<div
											key={job.id}
											className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-lg ${
												job.status === 'completed'
													? 'border-green-400 bg-green-900/20 hover:bg-green-900/30'
													: job.status === 'failed'
													? 'border-red-400 bg-red-900/20 hover:bg-red-900/30'
													: job.status === 'processing'
													? 'border-blue-400 bg-blue-900/20 hover:bg-blue-900/30'
													: 'border-gray-600 bg-gray-700/20 hover:bg-gray-700/30'
											}`}>
											<div className='flex justify-between items-start'>
												<div>
													<div className='flex items-center space-x-2 mb-2'>
														<span
															className={`w-2 h-2 rounded-full ${
																job.status === 'completed'
																	? 'bg-green-400'
																	: job.status === 'failed'
																	? 'bg-red-400'
																	: job.status === 'processing'
																	? 'bg-blue-400 animate-pulse'
																	: 'bg-gray-500'
															}`}></span>
														<span className='font-semibold capitalize text-sm text-gray-200'>
															{job.status}
														</span>
													</div>
													<p className='text-sm text-gray-300 mb-1'>
														Analyzed {job.coins_processed} coins • Generated{' '}
														{job.alerts_generated} change alerts
													</p>
													{job.duration_ms && (
														<p className='text-xs text-gray-400'>
															Completed in {(job.duration_ms / 1000).toFixed(1)}
															s
														</p>
													)}
												</div>
												<div className='text-right'>
													<p className='text-xs text-gray-400 mb-1'>
														{new Date(job.created_at).toLocaleTimeString()}
													</p>
													<span className='inline-block px-2 py-1 bg-gray-600 rounded-full text-xs text-gray-300'>
														#{index + 1}
													</span>
												</div>
											</div>
											{job.error_message && (
												<p className='text-sm text-red-300 mt-2 p-2 bg-red-900/30 rounded'>
													{job.error_message}
												</p>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Sentiment Results */}
					<div className='bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden'>
						<div className='bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-6 py-4 border-b border-gray-700'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center'>
									<div className='w-2 h-2 bg-purple-400 rounded-full mr-3'></div>
									<div>
										<h2 className='text-lg font-semibold text-white'>
											Sentiment Change Results
										</h2>
										<p className='text-sm text-gray-300 mt-1'>
											Current scores vs. your historical data
										</p>
									</div>
								</div>
								{recentSentiment.length > 0 && (
									<button
										onClick={() => {
											if (
												confirm(
													'Clear all sentiment history? This will reset change detection.'
												)
											) {
												clearSentimentHistory();
											}
										}}
										className='text-xs text-gray-400 hover:text-gray-300 px-3 py-1 border border-gray-600 rounded-lg hover:border-gray-500'>
										Clear History
									</button>
								)}
							</div>
						</div>

						<div className='p-6'>
							{/* Analysis Summary */}
							{lastAnalysisResults.processed.length > 0 && (
								<div className='mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600'>
									<h3 className='font-semibold text-gray-200 mb-2'>
										Latest Analysis Summary
									</h3>
									<div className='grid grid-cols-4 gap-4 text-center'>
										<div>
											<div className='text-blue-400 font-bold text-lg'>
												{lastAnalysisResults.processed.length}
											</div>
											<div className='text-xs text-gray-400'>Requested</div>
										</div>
										<div>
											<div className='text-green-400 font-bold text-lg'>
												{lastAnalysisResults.found.length}
											</div>
											<div className='text-xs text-gray-400'>Found</div>
										</div>
										<div>
											<div className='text-yellow-400 font-bold text-lg'>
												{lastAnalysisResults.missing.length}
											</div>
											<div className='text-xs text-gray-400'>No Data</div>
										</div>
										<div>
											<div className='text-purple-400 font-bold text-lg'>
												{(() => {
													// Count significant changes in latest analysis
													if (recentSentiment.length === 0) return 0;

													// Get the most recent timestamp
													const latestTimestamp = recentSentiment[0].created_at;
													const cutoffTime = new Date(
														new Date(latestTimestamp).getTime() - 60000
													);

													// Get coins from the most recent analysis
													const latestEntries = recentSentiment.filter(
														(entry) => new Date(entry.created_at) >= cutoffTime
													);

													return latestEntries.filter((entry) => {
														const previousEntries = recentSentiment
															.filter(
																(prev) =>
																	prev.symbol === entry.symbol &&
																	prev.id !== entry.id &&
																	new Date(prev.created_at) < cutoffTime
															)
															.sort(
																(a, b) =>
																	new Date(b.created_at).getTime() -
																	new Date(a.created_at).getTime()
															);

														const previousSentiment =
															previousEntries[0]?.sentiment;
														if (!previousSentiment) return false;

														const changeAmount =
															entry.sentiment - previousSentiment;
														const percentChange =
															Math.abs(changeAmount) / previousSentiment;

														if (percentChange > 0.2) {
															if (changeAmount > 0 && entry.sentiment >= 80)
																return true;
															if (changeAmount < 0 && entry.sentiment <= 20)
																return true;
														}
														return false;
													}).length;
												})()}
											</div>
											<div className='text-xs text-gray-400'>Changes</div>
										</div>
									</div>
									{lastAnalysisResults.missing.length > 0 && (
										<div className='mt-3 text-xs text-yellow-300'>
											<span className='font-medium'>Note:</span>{' '}
											{lastAnalysisResults.missing.join(', ')} had no sentiment
											data available from LunarCrush API
										</div>
									)}
								</div>
							)}

							{recentSentiment.length === 0 ? (
								<div className='text-center py-12'>
									<div className='w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4'>
										<span className='text-gray-400 text-2xl'>💭</span>
									</div>
									<p className='text-gray-400 mb-2'>
										No baseline sentiment data yet
									</p>
									<p className='text-sm text-gray-500'>
										Run your first analysis to establish a baseline for change
										detection
									</p>
								</div>
							) : (
								<div className='space-y-4'>
									{/* Sort by recency - most recently analyzed first */}
									{(() => {
										// Get only the most recent entry for each coin
										const latestByCoin = recentSentiment.reduce(
											(acc, entry) => {
												if (
													!acc[entry.symbol] ||
													new Date(entry.created_at) >
														new Date(acc[entry.symbol].created_at)
												) {
													acc[entry.symbol] = entry;
												}
												return acc;
											},
											{} as Record<string, SentimentHistory>
										);

										return Object.values(latestByCoin)
											.sort(
												(a, b) =>
													new Date(b.created_at).getTime() -
													new Date(a.created_at).getTime()
											) // Sort by most recent first
											.map((entry) => {
												// Get previous sentiment for change detection
												const previousEntries = recentSentiment
													.filter(
														(prev) =>
															prev.symbol === entry.symbol &&
															prev.id !== entry.id
													)
													.sort(
														(a, b) =>
															new Date(b.created_at).getTime() -
															new Date(a.created_at).getTime()
													);

												const previousSentiment = previousEntries[0]?.sentiment;

												// Calculate change
												let changeType = 'normal';
												let changeAmount = 0;
												let changeMessage = '';

												if (previousSentiment) {
													changeAmount = entry.sentiment - previousSentiment;
													const percentChange =
														Math.abs(changeAmount) / previousSentiment;

													if (percentChange > 0.2) {
														// 20% threshold
														if (changeAmount > 0 && entry.sentiment >= 80)
															changeType = 'spike';
														if (changeAmount < 0 && entry.sentiment <= 20)
															changeType = 'drop';
													}

													if (changeAmount === 0) {
														changeMessage = 'No change from previous analysis';
													} else {
														changeMessage = `${
															changeAmount > 0 ? '+' : ''
														}${changeAmount} from previous (${previousSentiment})`;
													}
												} else {
													changeMessage =
														'First analysis - no history to compare';
												}

												return (
													<div
														key={entry.id}
														className='p-4 border border-gray-600 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-gray-500 bg-gray-700/20'>
														<div className='flex justify-between items-center'>
															<div className='flex items-center space-x-4'>
																<div className='w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center'>
																	<span className='text-white font-bold text-sm'>
																		{entry.symbol.slice(0, 2)}
																	</span>
																</div>
																<div>
																	<div className='flex items-center space-x-2'>
																		<span className='font-bold text-lg text-white'>
																			{entry.symbol}
																		</span>
																		{changeType !== 'normal' && (
																			<span
																				className={`px-2 py-1 rounded-full text-xs font-bold ${
																					changeType === 'spike'
																						? 'bg-green-900/50 text-green-300 border border-green-600'
																						: 'bg-red-900/50 text-red-300 border border-red-600'
																				}`}>
																				{changeType === 'spike'
																					? '📈 SPIKE'
																					: '📉 DROP'}
																			</span>
																		)}
																		{!previousSentiment && (
																			<span className='px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-600'>
																				🆕 NEW
																			</span>
																		)}
																	</div>
																	<div className='flex items-center space-x-2 mt-1'>
																		<span
																			className={`px-3 py-1 rounded-full text-xs font-semibold ${
																				entry.sentiment >= 80
																					? 'bg-green-900/50 text-green-300 border border-green-700'
																					: entry.sentiment <= 20
																					? 'bg-red-900/50 text-red-300 border border-red-700'
																					: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
																			}`}>
																			Sentiment: {entry.sentiment}/100
																		</span>
																	</div>
																	<div className='mt-1'>
																		<span
																			className={`text-xs ${
																				!previousSentiment
																					? 'text-blue-300'
																					: changeAmount === 0
																					? 'text-gray-400'
																					: changeAmount > 0
																					? 'text-green-400'
																					: 'text-red-400'
																			}`}>
																			{changeMessage}
																		</span>
																	</div>
																</div>
															</div>
															<div className='text-right'>
																<p className='font-bold text-lg text-white'>
																	${entry.price.toFixed(2)}
																</p>
																<p
																	className={`text-sm font-semibold ${
																		entry.percent_change_24h >= 0
																			? 'text-green-400'
																			: 'text-red-400'
																	}`}>
																	{entry.percent_change_24h >= 0 ? '+' : ''}
																	{entry.percent_change_24h.toFixed(2)}% (24h)
																</p>
															</div>
														</div>
														<p className='text-xs text-gray-400 mt-3'>
															Last analyzed:{' '}
															{new Date(entry.created_at).toLocaleString()}
														</p>
													</div>
												);
											});
									})()}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className='bg-gray-800 border-t border-gray-700 mt-16'>
				<div className='max-w-7xl mx-auto px-6 py-8'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
						{/* Project Info */}
						<div>
							<h3 className='text-lg font-semibold text-white mb-4'>
								Social Sentiment Processor
							</h3>
							<p className='text-gray-300 text-sm mb-4'>
								A Next.js application demonstrating real-time crypto sentiment
								analysis with background job processing.
							</p>
							<a
								href='https://github.com/yourusername/social-sentiment-processor'
								target='_blank'
								rel='noopener noreferrer'
								className='inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors'>
								<svg
									className='w-4 h-4 mr-2'
									fill='currentColor'
									viewBox='0 0 24 24'>
									<path
										fillRule='evenodd'
										d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
										clipRule='evenodd'
									/>
								</svg>
								View Source Code
							</a>
						</div>

						{/* Technology Stack */}
						<div>
							<h4 className='text-lg font-semibold text-white mb-4'>
								Built With
							</h4>
							<ul className='space-y-2 text-sm'>
								<li>
									<a
										href='https://nextjs.org'
										target='_blank'
										rel='noopener noreferrer'
										className='text-gray-300 hover:text-white transition-colors'>
										Next.js - React Framework
									</a>
								</li>
								<li>
									<a
										href='https://tailwindcss.com'
										target='_blank'
										rel='noopener noreferrer'
										className='text-gray-300 hover:text-white transition-colors'>
										Tailwind CSS - Styling
									</a>
								</li>
								<li>
									<a
										href='https://www.typescriptlang.org'
										target='_blank'
										rel='noopener noreferrer'
										className='text-gray-300 hover:text-white transition-colors'>
										TypeScript - Type Safety
									</a>
								</li>
							</ul>
						</div>

						{/* Services */}
						<div>
							<h4 className='text-lg font-semibold text-white mb-4'>
								Powered By
							</h4>
							<ul className='space-y-2 text-sm'>
								<li>
									<a
										href='https://www.inngest.com'
										target='_blank'
										rel='noopener noreferrer'
										className='text-blue-300 hover:text-blue-200 transition-colors'>
										Inngest - Background Jobs
									</a>
								</li>
								<li>
									<a
										href='https://supabase.com'
										target='_blank'
										rel='noopener noreferrer'
										className='text-green-300 hover:text-green-200 transition-colors'>
										Supabase - Database & Storage
									</a>
								</li>
								<li>
									<a
										href='https://lunarcrush.com'
										target='_blank'
										rel='noopener noreferrer'
										className='text-purple-300 hover:text-purple-200 transition-colors'>
										LunarCrush - Social Data API
									</a>
								</li>
								<li>
									<a
										href='https://vercel.com'
										target='_blank'
										rel='noopener noreferrer'
										className='text-gray-300 hover:text-white transition-colors'>
										Vercel - Deployment
									</a>
								</li>
							</ul>
						</div>

						{/* Links & Resources */}
						<div>
							<h4 className='text-lg font-semibold text-white mb-4'>
								Resources
							</h4>
							<ul className='space-y-2 text-sm'>
								<li>
									<a
										href='https://lunarcrush.com/developers/api/endpoints'
										target='_blank'
										rel='noopener noreferrer'
										className='text-gray-300 hover:text-white transition-colors'>
										LunarCrush API Docs
									</a>
								</li>
								<li>
									<a
										href='https://www.inngest.com/docs'
										target='_blank'
										rel='noopener noreferrer'
										className='text-gray-300 hover:text-white transition-colors'>
										Inngest Documentation
									</a>
								</li>
								<li>
									<a
										href='https://supabase.com/docs'
										target='_blank'
										rel='noopener noreferrer'
										className='text-gray-300 hover:text-white transition-colors'>
										Supabase Documentation
									</a>
								</li>
								<li>
									<a
										href='https://lunarcrush.com/about/api'
										target='_blank'
										rel='noopener noreferrer'
										className='text-gray-300 hover:text-white transition-colors'>
										Get LunarCrush API Key
									</a>
								</li>
							</ul>
						</div>
					</div>

					{/* Bottom Bar */}
					<div className='border-t border-gray-700 pt-6 mt-8'>
						<div className='flex flex-col md:flex-row justify-between items-center'>
							<p className='text-gray-400 text-sm'>
								© 2025 Social Sentiment Processor. Built for demonstration
								purposes.
							</p>
							<div className='flex items-center space-x-4 mt-4 md:mt-0'>
								<span className='text-gray-500 text-sm'>Powered by:</span>
								<div className='flex items-center space-x-3'>
									<a
										href='https://www.inngest.com'
										target='_blank'
										rel='noopener noreferrer'
										className='text-blue-400 hover:text-blue-300 transition-colors'>
										<span className='text-xs font-medium'>Inngest</span>
									</a>
									<span className='text-gray-600'>•</span>
									<a
										href='https://supabase.com'
										target='_blank'
										rel='noopener noreferrer'
										className='text-green-400 hover:text-green-300 transition-colors'>
										<span className='text-xs font-medium'>Supabase</span>
									</a>
									<span className='text-gray-600'>•</span>
									<a
										href='https://lunarcrush.com'
										target='_blank'
										rel='noopener noreferrer'
										className='text-purple-400 hover:text-purple-300 transition-colors'>
										<span className='text-xs font-medium'>LunarCrush</span>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
