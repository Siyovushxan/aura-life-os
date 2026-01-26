# AURA Backend - Cloud Functions

Firebase Cloud Functions for AURA Life Operating System.

## Features

- 🤖 **AI Task Analysis** - GROQ-powered task similarity detection and priority suggestions
- 📦 **Auto-Archive** - Daily automated archiving of old completed tasks
- 📊 **Daily Insights** - AI-generated personalized insights
- ⚡ **Real-time Triggers** - Automatic task analysis on creation

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env.local

# Set GROQ API key
firebase functions:config:set groq.api_key="YOUR_API_KEY"
firebase functions:config:set groq.model="llama-3.3-70b-versatile"
```

### 3. Get GROQ API Key

1. Visit https://console.groq.com
2. Sign up or log in
3. Generate API key
4. Copy key to `.env.local` and Firebase config

### 4. Deploy Functions

```bash
# Deploy all functions
npm run deploy

# Deploy specific function
firebase deploy --only functions:onTaskCreate
firebase deploy --only functions:dailyArchive
```

## Functions Overview

### Triggers

- **onTaskCreate** - Analyzes new tasks for duplicates and suggests priority
- ~~onTaskUpdate~~ - (Future) Update analysis when task changes

### Schedulers

- **dailyArchive** - Runs daily at 02:00 AM, archives tasks older than 30 days
- ~~weekly Report~~ - (Future) Weekly AI-powered summary

### HTTP Endpoints

- **analyzeTask** - Manual task analysis endpoint
- **getDailyInsight** - Generate personalized insight
- **healthCheck** - Service health status

## Testing Locally

```bash
# Start emulators
npm run serve

# Open emulator UI
http://localhost:4000
```

## Monitoring

```bash
# View logs
npm run logs

# Follow logs in real-time
firebase functions:log --follow

# Specific function logs
firebase functions:log --only onTaskCreate
```

## Cost Estimates

### GROQ API
- **Free tier**: 14,400 requests/day (~10 req/min)
- **Cost**: $0 (completely free)

### Firebase Functions
- **Free tier**: 2M invocations/month
- **Paid tier**: $0.40/million invocations
- **Estimated monthly cost**: ~$1-3 USD

### Optimization Tips
1. Cache AI results for 24h
2. Use batch operations
3. Limit analysis to active tasks only
4. Monitor with Firebase Analytics

## Troubleshooting

### GROQ API Errors
```bash
# Check API key
firebase functions:config:get

# Test API connection
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

### Deployment Issues
```bash
# Clear cache and rebuild
rm -rf node_modules
npm install

# Check Node version (required: 18+)
node --version
```

## Project Structure

```
functions/
├── ai/
│   ├── groqClient.js        # GROQ API integration
│   └── taskAnalysis.js      # AI analysis functions
├── schedulers/
│   └── dailyArchive.js      # Auto-archive scheduler
├── triggers/
│   └── onTaskCreate.js      # Task creation trigger
├── utils/
│   └── (future utilities)
├── index.js                 # Main entry point
├── package.json
└── .env.example
```

## Next Steps

1. ✅ Setup complete
2. ⏳ Add weekly report scheduler
3. ⏳ Implement task update trigger
4. ⏳ Add user onboarding function
5. ⏳ Create notification system

## Support

Need help? Check the main AURA documentation or create an issue.
