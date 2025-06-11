# Social Sentiment Processor

> A production-ready cryptocurrency sentiment analysis system with background job processing

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/danilobatson/social-sentiment-processor)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

A scalable cryptocurrency sentiment processing system built with Next.js, TypeScript, Inngest, and Supabase. Monitors sentiment trends across hundreds of cryptocurrencies using background job processing to prevent blocking your main application.

## 🎯 Features

- **Background Job Processing** - Queue-based sentiment analysis with Inngest
- **Real-Time Dashboard** - Monitor processing jobs and sentiment changes
- **Discord Notifications** - Automated alerts for significant sentiment shifts
- **Historical Data Tracking** - PostgreSQL storage with Supabase
- **Type-Safe Development** - Full TypeScript implementation
- **Production Ready** - Comprehensive error handling and retry logic
- **Mobile Responsive** - Modern UI with Tailwind CSS

## 🚀 Quick Start

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/danilobatson/social-sentiment-processor)

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/danilobatson/social-sentiment-processor.git
cd social-sentiment-processor

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your API keys (see setup guide below)
# Start development servers
npm run dev        # Next.js app
npm run inngest    # Inngest dev server
```

Visit `http://localhost:3000/dashboard` to access the sentiment processor.

## 📋 Prerequisites

### Required Services

| Service                                     | Purpose                   | Cost         | Setup Guide                                                                |
| ------------------------------------------- | ------------------------- | ------------ | -------------------------------------------------------------------------- |
| [LunarCrush](https://lunarcrush.com/signup) | Social sentiment data     | $24-30/month | [API Authentication](https://lunarcrush.com/developers/api/authentication) |
| [Inngest](https://inngest.com)              | Background job processing | Free         | [Getting Started](https://www.inngest.com/docs)                            |
| [Supabase](https://supabase.com)            | PostgreSQL database       | Free tier    | [Database Setup](https://supabase.com/docs)                                |
| [Discord](https://discord.com)              | Alert notifications       | Free         | [Webhook Setup](https://support.discord.com/hc/en-us/articles/228383668)   |

### System Requirements

- Node.js 18+
- npm or yarn
- TypeScript knowledge recommended

## ⚙️ Configuration

### Environment Variables

Create `.env.local` with the following variables:

```env
# LunarCrush API (Required)
LUNARCRUSH_API_KEY=your_api_key_here

# Inngest Configuration (Required)
INNGEST_SIGNING_KEY=signkey_your_signing_key_here
INNGEST_EVENT_KEY=key_your_event_key_here

# Supabase Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Discord Notifications (Optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_url
```

### Database Setup

Run the following SQL in your Supabase SQL Editor:

<details>
<summary>Click to view SQL schema</summary>

```sql
-- Sentiment history table
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

-- Processing jobs table
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
```

</details>

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │───▶│  Inngest Jobs   │───▶│   Supabase DB   │
│   (Dashboard)   │    │  (Processing)   │    │   (History)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  LunarCrush API │    │ Discord Alerts  │    │  Progress UI    │
│ (Sentiment Data)│    │  (Notifications)│    │  (Real-time)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

- **Dashboard** (`/dashboard`) - Real-time monitoring interface
- **API Routes** (`/api/*`) - Inngest webhooks and job triggers
- **Background Functions** (`/src/functions/*`) - Sentiment processing logic
- **Services** (`/src/services/*`) - External API integrations
- **Types** (`/src/types/*`) - TypeScript interfaces

## 📁 Project Structure

```
social-sentiment-processor/
├── 📁 app/
│   ├── 📁 api/
│   │   ├── 📁 inngest/         # Inngest webhook handler
│   │   ├── 📁 trigger/         # Manual job trigger
│   │   └── 📁 test-discord/    # Discord webhook test
│   ├── 📁 dashboard/           # Main dashboard UI
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── 📁 src/
│   ├── 📁 types/
│   │   ├── lunarcrush.ts       # LunarCrush API types
│   │   └── database.ts         # Database schema types
│   ├── 📁 services/
│   │   └── lunarcrush.ts       # API client with error handling
│   ├── 📁 functions/
│   │   └── processSentiment.ts # Main Inngest background function
│   └── 📁 lib/
│       ├── inngest.ts          # Inngest client setup
│       ├── supabase.ts         # Database helpers
│       ├── constants.ts        # App configuration
│       └── testDiscord.ts      # Discord testing utilities
├── 📁 docs/                    # Documentation and guides
├── .env.example                # Environment variables template
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── next.config.js              # Next.js configuration
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start Next.js development server
npm run inngest      # Start Inngest development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:setup     # Initialize database schema
npm run db:reset     # Reset all data (development only)

# Testing
npm run type-check   # TypeScript validation
npm run lint         # ESLint validation

# Deployment
npm run deploy       # Deploy to Vercel
```

### Local Development Workflow

1. **Start Inngest dev server:**
   ```bash
   npx inngest-cli@latest dev
   ```

2. **Start Next.js in another terminal:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Dashboard: http://localhost:3000/dashboard
   - Inngest UI: http://localhost:8288

4. **Test the system:**
   - Trigger sentiment analysis from dashboard
   - Monitor job execution in Inngest UI
   - Check database records in Supabase
   - Verify Discord alerts (if configured)

## 🚀 Deployment

### Vercel (Recommended)

1. **Fork this repository**
2. **Connect to Vercel:**
   - Import your forked repository
   - Configure environment variables
   - Deploy automatically

3. **Configure Inngest:**
   - Create production app in Inngest dashboard
   - Add webhook URL: `https://your-app.vercel.app/api/inngest`
   - Update environment variables with production keys

### Other Platforms

- **Netlify:** Use `npm run build && npm run export`
- **Railway:** Connect GitHub repo and deploy
- **Self-hosted:** Use `npm run build && npm run start`

## 📊 Usage

### Basic Workflow

1. **Configure cryptocurrency selection** in the dashboard
2. **Trigger sentiment analysis** manually or via scheduled jobs
3. **Monitor processing** in real-time dashboard
4. **Receive Discord alerts** for significant sentiment changes
5. **Review historical data** and trends

### API Endpoints

| Endpoint            | Method   | Description                  |
| ------------------- | -------- | ---------------------------- |
| `/api/trigger`      | POST     | Start sentiment analysis job |
| `/api/inngest`      | POST/PUT | Inngest webhook handler      |
| `/dashboard`        | GET      | Main monitoring interface    |

### Monitoring & Alerts

- **Job Status:** Track processing status and duration
- **Error Handling:** Automatic retries with exponential backoff
- **Discord Notifications:** Configurable sentiment change alerts
- **Performance Metrics:** Processing time and success rates

## 🛠️ Troubleshooting

### Common Issues

<details>
<summary><strong>Inngest Function Not Triggering</strong></summary>

**Symptoms:** Jobs don't start when triggered from dashboard

**Solutions:**
- Verify Inngest dev server is running (`npx inngest-cli@latest dev`)
- Check `INNGEST_SIGNING_KEY` in environment variables
- Ensure `/api/inngest` endpoint is accessible
- Review Inngest dashboard for error logs

</details>

<details>
<summary><strong>Database Connection Errors</strong></summary>

**Symptoms:** Failed to save sentiment data

**Solutions:**
- Verify Supabase credentials in `.env.local`
- Ensure database tables were created with provided SQL
- Check Supabase project status and billing
- Test connection in Supabase dashboard

</details>

<details>
<summary><strong>LunarCrush API Issues</strong></summary>

**Symptoms:** 401/429 errors, no sentiment data

**Solutions:**
- Confirm active LunarCrush subscription
- Verify API key format and permissions
- Check rate limits (Individual: 10 req/min)
- Review API usage in LunarCrush dashboard

</details>

<details>
<summary><strong>Discord Alerts Not Sending</strong></summary>

**Symptoms:** No notifications in Discord channel

**Solutions:**
- Verify webhook URL format
- Check Discord channel permissions
- Test webhook manually: `npm run test:discord`
- Review Discord webhook configuration

</details>

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
DEBUG=true
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes** with tests
4. **Run the test suite:** `npm run test`
5. **Submit a pull request**

### Code Standards

- **TypeScript** for all new code
- **ESLint + Prettier** for formatting
- **Conventional Commits** for commit messages
- **Test coverage** for new features

## 📈 Performance & Scaling

### Optimization Strategies

- **Caching:** Add Redis for API response caching
- **Rate Limiting:** Implement request throttling
- **Database:** Optimize queries with proper indexing
- **Monitoring:** Set up error tracking and performance monitoring

### Scaling Considerations

- **Horizontal Scaling:** Deploy multiple instances
- **Database:** Use connection pooling
- **Background Jobs:** Leverage Inngest's built-in scaling
- **CDN:** Use Vercel Edge Network for global distribution

## 🔒 Security

### Best Practices

- **Environment Variables:** Never commit API keys to version control
- **API Rate Limiting:** Respect LunarCrush API limits
- **Error Handling:** Don't expose sensitive information in errors
- **Database:** Use row-level security in Supabase

### Security Checklist

- [ ] API keys stored in environment variables
- [ ] Database access properly configured
- [ ] Error messages don't leak sensitive data
- [ ] Rate limiting implemented for public endpoints


## 🙏 Acknowledgments

- **[LunarCrush](https://lunarcrush.com/)** - Social sentiment data provider
- **[Inngest](https://inngest.com/)** - Background job processing platform
- **[Supabase](https://supabase.com/)** - Database and backend services
- **[Vercel](https://vercel.com/)** - Deployment and hosting platform

## 📚 Resources

- **[Tutorial Article](https://dev.to/lunarcrush/inngest-typescript-tutorial)** - Step-by-step tutorial
- **[Live Demo](https://social-sentiment-processor.vercel.app/dashboard)** - Working example
- **[LunarCrush API Docs](https://lunarcrush.com/about/api)** - API documentation
- **[Inngest Documentation](https://www.inngest.com/docs)** - Background job guides
- **[Supabase Documentation](https://supabase.com/docs)** - Database and auth guides

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/danilobatson/social-sentiment-processor/issues)
- **Discussions:** [GitHub Discussions](https://github.com/danilobatson/social-sentiment-processor/discussions)
- **Discord:** [LunarCrush Developer Community](https://discord.gg/lunarcrush)
- **Email:** [developers@lunarcrush.com](mailto:developers@lunarcrush.com)

---

<div align="center">

**[⭐ Star this repo](https://github.com/danilobatson/social-sentiment-processor)** • **[🍴 Fork it](https://github.com/danilobatson/social-sentiment-processor/fork)** • **[📝 Report Bug](https://github.com/danilobatson/social-sentiment-processor/issues)**

</div>
