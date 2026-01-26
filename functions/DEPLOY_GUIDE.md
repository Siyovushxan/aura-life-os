# 🚀 AURA Backend - Deployment Guide

## ✅ Prerequisites Complete!

3 ta GROQ API key allaqachon o'rnatilgan:
- ✅ Text Analysis Key
- ✅ Image Analysis Key  
- ✅ Voice Analysis Key

## 📦 Deployment Steps

### 1️⃣ Verify Environment

```bash
cd d:/AURA/functions

# Check .env file exists
cat .env

# Should show 3 API keys configured
```

### 2️⃣ Test Locally (Optional)

```bash
# Start Firebase Emulators
npm run serve

# Emulator UI will open at:
# http://localhost:4000

# Test functions locally before deploying
```

###️⃣ Deploy to Production

```bash
# Deploy all functions
npm run deploy

# This will deploy:
# - onTaskCreate (Firestore trigger)
# - dailyArchive (Scheduled 02:00 daily)
# - analyzeTask (HTTP endpoint)
# - getDailyInsight (HTTP endpoint)
# - healthCheck (Status endpoint)
```

### 4️⃣ Verify Deployment

```bash
# Check function status
firebase functions:list

# View logs
firebase functions:log --follow

# Test health endpoint
curl https://us-central1-aura-f1d36.cloudfunctions.net/healthCheck
```

## 🎯 Function Details

### 🔄 onTaskCreate
- **Trigger**: Firestore document create
- **Path**: `users/{userId}/tasks/{taskId}`
- **Uses**: TEXT API Key
- **Action**: Analyzes new tasks for duplicates, suggests priority

### 📦 dailyArchive  
- **Trigger**: Scheduled (daily 02:00 Tashkent)
- **Uses**: No AI (Firestore only)
- **Action**: Archives completed tasks older than 30 days

### 🌐 HTTP Endpoints

**analyzeTask**
```bash
curl -X POST \
  https://us-central1-aura-f1d36.cloudfunctions.net/analyzeTask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskTitle": "Yangi vazifa",
    "existingTasks": ["Eski vazifa 1", "Eski vazifa 2"]
  }'
```

**getDailyInsight**
```bash
curl -X POST \
  https://us-central1-aura-f1d36.cloudfunctions.net/getDailyInsight \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completedTasks": 5,
    "pendingTasks": 3,
    "sleepHours": 7,
    "stressLevel": 30
  }'
```

## 📊 API Key Usage

Each key has separate rate limits:
- **Free tier**: 14,400 requests/day per key
- **Total capacity**: 43,200 requests/day (all 3 keys)

### Current Allocation:
- Text Analysis: ~80% of traffic (task analysis, insights)
- Image Analysis: ~15% (future feature)
- Voice Analysis: ~5% (future feature)

## 🔍 Monitoring

### Real-time Logs
```bash
# All functions
firebase functions:log --follow

# Specific function
firebase functions:log --only onTaskCreate

# Last hour
firebase functions:log --since 1h
```

### Error Tracking
```bash
# Check for errors
firebase functions:log --only-errors

# Specific time range
firebase functions:log --since 2024-01-15 --until 2024-01-16
```

## ⚠️ Important Notes

### Blaze Plan Requirement
Firebase Secrets require Blaze plan, but we're using .env files instead:
- ✅ Works with free Spark plan
- ✅ Keys stored in .env (not committed to Git)
- ✅ Deploy includes environment variables

### Security
- .env file is gitignored
- Never commit API keys
- Use Authorization headers for HTTP endpoints

### Cost Estimate
- Firebase Functions: FREE (under 2M invocations/month)
- GROQ API: FREE (under 43K requests/day total)
- Estimated cost: **$0/month** 🎉

## 🐛 Troubleshooting

### "Module not found" error
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
```

### ".env file not found"
```bash
# Make sure you're in functions directory
cd d:/AURA/functions

# Check if .env exists
ls -la .env

# If not, copy from .env.example
cp .env.example .env
# Then add your API keys
```

### Deployment timeout
```bash
# Increase timeout and retry
firebase deploy --only functions --force
```

### API key not working
```bash
# Test key validity
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json"
```

## ✨ Next Steps

After successful deployment:

1. **Test onTaskCreate**
   - Create a task in Firestore
   - Check function logs
   - Verify AI analysis added

2. **Monitor Performance**
   - Watch logs for errors
   - Check GROQ dashboard for usage
   - Monitor Firebase console

3. **Frontend Integration**
   - Update frontend to call HTTP endpoints
   - Add error handling
   - Display AI suggestions to users

4. **Add Features**
   - Image analysis for receipts
   - Voice note transcription
   - Weekly AI reports

## 📞 Support

Issues? Check:
- Firebase Console: https://console.firebase.google.com
- GROQ Dashboard: https://console.groq.com
- Function logs: `firebase functions:log`

---

**Ready to deploy?**
```bash
cd d:/AURA/functions
npm run deploy
```

🚀 Let's go! 🚀
