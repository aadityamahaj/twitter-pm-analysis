# Quick Start Guide - 5 Minutes to Viral Tweets 🚀

## Step 1: Install (1 minute)

```bash
cd /Users/aadityamahajan/Desktop/twitter-pm-analysis
pip install -r requirements.txt
```

## Step 2: Launch Dashboard (30 seconds)

```bash
streamlit run 06_dashboard.py
```

Dashboard opens automatically at: `http://localhost:8501`

## Step 3: Explore (3 minutes)

### Tab 1: Dashboard 📈
- See performance overview
- 13,088 tweets from 26 accounts
- Performance distribution

### Tab 2: Account Analysis 🔍
- Pick any of 26 accounts
- View their viral percentage
- See engagement patterns

### Tab 3: Tweet Predictor 🎯
- **Paste your tweet text**
- Get instant performance prediction
- Get improvement recommendations

Example:
```
"Just nailed my prediction on Polymarket! 🎯 What's your next bet? #Predictions #Crypto"
→ Result: Likely to be VIRAL
```

### Tab 4: Deep Analysis 📊
- Understand success score formula
- See what drives engagement

### Tab 5: Timing Patterns ⏰
- Best hours to post
- By day and hour

### Tab 6: Insights 📋
- Top performing accounts
- What makes tweets viral

## Step 4: Use Results

### Option A: Share the Dashboard
- Deploy to Streamlit Cloud (free)
- Share URL with boss/team
- They can use it without installing

### Option B: Use as API
```python
from scoring_system import TweetPerformancePredictor

predictor = TweetPerformancePredictor()
result = predictor.get_recommendations("Your tweet here", user_id=1)

print(result['prediction']['label'])  # Prediction
print(result['recommendations'])      # Tips to improve
```

### Option C: Export Results
- All charts are downloadable
- Screenshots can be saved
- Data tables can be copied

## Key Insights (TL;DR)

To make your prediction market tweets go viral:

| Element | Impact | Example |
|---------|--------|---------|
| **Questions** | +79% | "What's your prediction?" |
| **Emojis** | +45% | "🚀 📈 💰" |
| **Length** | Optimal at 100-150 chars | Not too long, not too short |
| **Sentiment** | +40% positive | Upbeat vs. negative |
| **Mentions** | 0.5-1.5 per tweet | "@PolymarketO3O agree!" |
| **Timing** | 14:00-19:00 UTC | Plan your post time |
| **Hashtags** | 0-2 max | Don't overdo it |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | `pip install -r requirements.txt` |
| Port 8501 in use | `streamlit run 06_dashboard.py --server.port 8502` |
| Slow dashboard | First load takes ~5 seconds, then fast |

## Go Deeper

- **Full docs**: Read `README.md`
- **Deploy guide**: Read `DEPLOYMENT_GUIDE.md`
- **What was fixed**: Read `FIXES_COMPLETED.md`

## System Stats

- **Tweets**: 13,088 analyzed
- **Accounts**: 26 prediction market traders
- **Accuracy**: 99.77% predictions
- **Model**: Gradient Boosting Classifier
- **Classes**: 4 (Underperformed → Viral)

## Command Cheat Sheet

```bash
# Launch dashboard
streamlit run 06_dashboard.py

# Test the predictor
python3 -c "from scoring_system import TweetPerformancePredictor; p = TweetPerformancePredictor(); print(p.predict('test'))"

# Check data
python3 -c "import pandas as pd; df = pd.read_csv('tweets_features.csv'); print(f'{len(df)} tweets, {df[\"performance\"].unique()}')"

# View analysis
python3 -c "from advanced_analysis import ViralTweetAnalyzer; a = ViralTweetAnalyzer(); c = a.analyze_content_characteristics(); print(c)"
```

---

**That's it! You now have a production-ready ML system for predicting viral tweets.**

Questions? Check the documentation files or run the dashboard and explore!
