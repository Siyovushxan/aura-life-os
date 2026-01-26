# 🎯 Backend Integration - Complete Guide

## ✅ Integration Status

### 1. Frontend Integration ✅
**Created:** `web/src/lib/cloudFunctions.ts`

**Available Functions:**
- `analyzeTaskWithAI(taskTitle, existingTasks)` - Task similarity analysis
- `getDailyInsight(userData)` - Personalized daily insights
- `checkBackendHealth()` - Service health check

**Dashboard Integration:**
- AI insights automatically fetch when page loads
- Real-time updates based on user stats
- Graceful error handling

---

## 🧪 Testing Guide

### Test 1: Health Check (Already Tested ✅)
```bash
curl https://us-central1-aura-f1d36.cloudfunctions.net/healthCheck
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T09:52:50.510Z",
  "version": "1.0.0"
}
```

### Test 2: onTaskCreate Trigger

**Step 1: Create a Test Task in Firestore**

Go to Firebase Console → Firestore:
https://console.firebase.google.com/project/aura-f1d36/firestore

**Manual Test:**
1. Navigate to: `users` collection
2. Select any user document (or create `test-user`)
3. Add subcollection: `tasks`
4. Add document with:
```json
{
  "title": "Test vazifa - AI tahlil",
  "description": "Bu test vazifasi",
  "status": "active",
  "category": "work",
  "createdAt": [ServerTimestamp]
}
```

**Step 2: Check Logs**
```bash
cd d:/AURA/functions
firebase functions:log --only onTaskCreate --follow
```

**Expected Logs:**
```
🆕 New task created: [taskId] for user [userId]
Found X existing tasks to compare
✅ Task [taskId] analyzed successfully
```

**Step 3: Verify AI Suggestions Added**

Check the task document - it should now have:
```json
{
  "title": "Test vazifa - AI tahlil",
  ...
  "aiSuggestions": {
    "similarity": {
      "hasDuplicates": false,
      "similarTasks": [],
      "suggestion": "..."
    },
    "priority": {
      "priority": "medium",
      "reasoning": "..."
    },
    "analyzedAt": [Timestamp]
  },
  "suggestedPriority": "medium"
}
```

### Test 3: Daily Insights (HTTP Endpoint)

```bash
curl -X POST \
  https://us-central1-aura-f1d36.cloudfunctions.net/getDailyInsight \
  -H "Content-Type: application/json" \
  -d '{
    "completedTasks": 5,
    "pendingTasks": 3,
    "sleepHours": 7,
    "stressLevel": 30
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "insight": "Siz bugun 5 ta vazifani bajarib..."
}
```

### Test 4: Task Analysis (HTTP Endpoint)

```bash
curl -X POST \
  https://us-central1-aura-f1d36.cloudfunctions.net/analyzeTask \
  -H "Content-Type: application/json" \
  -d '{
    "taskTitle": "Yangi loyiha boshlash",
    "existingTasks": ["Loyiha yangilash", "Dastur yaratish", "Prezentatsiya tayyorlash"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "hasDuplicates": true/false,
    "similarTasks": [0, 1],
    "suggestion": "..."
  }
}
```

---

## 📊 24-Hour Monitoring Setup

### Real-time Logs
```bash
# All functions
firebase functions:log --follow

# Specific function
firebase functions:log --only onTaskCreate --follow

# Errors only
firebase functions:log --only-errors --follow
```

### Firebase Console Monitoring

**Functions Dashboard:**
https://console.firebase.google.com/project/aura-f1d36/functions

**Metrics to Watch:**
- Invocations count
- Error rate
- Execution time
- Memory usage

**GROQ API Dashboard:**
https://console.groq.com

**Metrics:**
- API calls per day
- Success rate
- Response times

### Set Up Alerts

**Firebase Budget Alert:**
1. Go to: https://console.firebase.google.com/project/aura-f1d36/usage
2. Click "Set budget"
3. Set to: $5/month
4. Enable email alerts

**Function Error Alerts:**
```bash
# Check for errors every hour
firebase functions:log --only-errors --since 1h
```

### Automated Monitoring Script

Create: `functions/scripts/monitor.sh`
```bash
#!/bin/bash
echo "🔍 AURA Backend Health Check"
echo "============================="

# Health Check
echo "\n✅ Health Status:"
curl -s https://us-central1-aura-f1d36.cloudfunctions.net/healthCheck | jq

# Recent Errors
echo "\n❌ Recent Errors (last 1h):"
firebase functions:log --only-errors --since 1h | tail -20

# Function Stats
echo "\n📊 Function List:"
firebase functions:list

echo "\n✅ Monitoring complete!"
```

Run every 6 hours:
```bash
chmod +x functions/scripts/monitor.sh
./functions/scripts/monitor.sh
```

---

## 🚀 Frontend Testing (Live App)

### Test in Dashboard

1. **Open Dashboard:**
   ```
   http://localhost:3000/dashboard
   ```

2. **Check AI Insight:**
   - Look at the search bar placeholder
   - Should show personalized AI insight (not "Analyzing...")

3. **Create Task (Future):**
   - When task creation UI is built
   - AI suggestions will appear automatically

---

## 📝 Integration Checklist

### Backend ✅
- [x] 5/5 Cloud Functions deployed
- [x] GROQ API keys configured
- [x] Environment variables set
- [x] Health check working

### Frontend ✅
- [x] Cloud Functions client created
- [x] Dashboard integration added
- [x] AI insights fetching
- [x] Error handling

### Testing ⏳
- [x] Health check tested
- [ ] onTaskCreate trigger test
- [ ] Daily insights test
- [ ] Task analysis test
- [ ] 24h monitoring active

### Monitoring ⏳
- [ ] Firebase console checked
- [ ] GROQ dashboard reviewed
- [ ] Budget alerts set
- [ ] Error logging active

---

## 🐛 Troubleshooting

### AI Insight Not Showing
1. Open browser console (F12)
2. Look for errors
3. Check network tab for failed requests
4. Verify CORS not blocking requests

### onTaskCreate Not Triggering
1. Check Firestore rules allow document creation
2. Verify exact path: `users/{userId}/tasks/{taskId}`
3. Check function logs for errors
4. Ensure task has all required fields

### HTTP Endpoints Timing Out
1. Check function memory allocation (512MB)
2. Verify GROQ API key is valid
3. Check for rate limiting
4. Review function logs

---

## 📞 Support Commands

```bash
# View all logs
firebase functions:log

# Specific function logs
firebase functions:log --only onTaskCreate

# Last 30 minutes
firebase functions:log --since 30m

# Follow in real-time
firebase functions:log --follow

# Delete and redeploy function
firebase deploy --only functions:onTaskCreate --force
```

---

## 🎯 Success Criteria

After 24 hours, verify:

✅ **No Errors:**
- Function logs are clean
- No 500 errors in HTTP endpoints
- onTaskCreate triggers successfully

✅ **Performance:**
- Response time < 3 seconds
- Memory usage < 400MB
- No timeouts

✅ **Cost:**
- Firebase bill < $1
- GROQ usage < 1000 requests/day
- No unexpected charges

✅ **Functionality:**
- AI insights are relevant
- Task analysis detects duplicates
- Daily archive runs at 02:00

---

**Next Steps:**
1. Run all tests above
2. Monitor for 24 hours
3. Optimize based on metrics
4. Add more AI features

**Questions?** Check logs first, then review GROQ dashboard!
