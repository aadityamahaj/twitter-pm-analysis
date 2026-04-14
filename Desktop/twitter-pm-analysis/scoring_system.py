"""
Scoring System & Prediction Engine
Provides actionable recommendations for prediction market tweets
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.preprocessing import StandardScaler
from textblob import TextBlob
import re


class TweetPerformancePredictor:
    """Predict tweet performance and provide recommendations"""

    def __init__(self, model_path: str = "model_artifact.pkl"):
        """Load the trained model"""
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        print("✓ Model loaded successfully")

        # Feature names (must match training)
        self.feature_names = [
            'user_id', 'likes', 'retweets', 'replies', 'quotes', 'engagement_value', 'success_score',
            'tweet_length', 'word_count', 'hashtag_count', 'mention_count', 'url_count',
            'emoji_count', 'caps_ratio', 'has_question', 'has_exclamation', 'has_ellipsis',
            'day_of_week', 'hour', 'month', 'is_weekend', 'is_business_hours', 'is_peak_hours',
            'days_since_last_tweet', 'sentiment_polarity', 'is_positive', 'is_negative', 'is_neutral',
            'total_interactions', 'like_to_retweet_ratio', 'retweet_ratio', 'reply_ratio', 'like_ratio'
        ]

        self.performance_labels = {
            0: 'Underperformed',
            1: 'Normal',
            2: 'Successful',
            3: 'Viral'
        }
        self.performance_colors = {
            0: '🔴',
            1: '🟡',
            2: '🔵',
            3: '🟢'
        }

    def extract_features_from_text(self, text: str, user_id: int = 1):
        """Extract features from tweet text"""
        # Content features
        tweet_length = len(text)
        word_count = len(text.split())
        hashtag_count = len(re.findall(r'#\w+', text))
        mention_count = len(re.findall(r'@\w+', text))
        url_count = len(re.findall(r'http[s]?://\S+', text))
        emoji_count = self._count_emojis(text)
        caps_ratio = self._caps_ratio(text)
        has_question = 1 if '?' in text else 0
        has_exclamation = 1 if '!' in text else 0
        has_ellipsis = 1 if '...' in text else 0

        # Sentiment
        sentiment = TextBlob(text).sentiment.polarity
        is_positive = 1 if sentiment > 0.1 else 0
        is_negative = 1 if sentiment < -0.1 else 0
        is_neutral = 1 if abs(sentiment) <= 0.1 else 0

        # Temporal (default to peak hours)
        day_of_week = 2  # Wednesday
        hour = 14  # 2 PM
        month = 4  # April
        is_weekend = 0
        is_business_hours = 1
        is_peak_hours = 1
        days_since_last_tweet = 1

        # Engagement (will be filled in when scoring)
        likes = 0
        retweets = 0
        replies = 0
        quotes = 0
        engagement_value = 0  # Likes + 2*Retweets + 2*Replies
        success_score = 0  # Will be estimated from text features
        total_interactions = likes + retweets + replies + quotes
        like_to_retweet_ratio = 0
        retweet_ratio = 0
        reply_ratio = 0
        like_ratio = 0

        return {
            'user_id': user_id,
            'likes': likes,
            'retweets': retweets,
            'replies': replies,
            'quotes': quotes,
            'engagement_value': engagement_value,
            'success_score': success_score,
            'tweet_length': tweet_length,
            'word_count': word_count,
            'hashtag_count': hashtag_count,
            'mention_count': mention_count,
            'url_count': url_count,
            'emoji_count': emoji_count,
            'caps_ratio': caps_ratio,
            'has_question': has_question,
            'has_exclamation': has_exclamation,
            'has_ellipsis': has_ellipsis,
            'day_of_week': day_of_week,
            'hour': hour,
            'month': month,
            'is_weekend': is_weekend,
            'is_business_hours': is_business_hours,
            'is_peak_hours': is_peak_hours,
            'days_since_last_tweet': days_since_last_tweet,
            'sentiment_polarity': sentiment,
            'is_positive': is_positive,
            'is_negative': is_negative,
            'is_neutral': is_neutral,
            'total_interactions': total_interactions,
            'like_to_retweet_ratio': like_to_retweet_ratio,
            'retweet_ratio': retweet_ratio,
            'reply_ratio': reply_ratio,
            'like_ratio': like_ratio,
        }

    def predict(self, text: str, user_id: int = 1):
        """Predict performance of a tweet"""
        features = self.extract_features_from_text(text, user_id)

        # Create feature vector in correct order
        feature_vector = np.array([[features[name] for name in self.feature_names]])

        # Get prediction and probabilities
        prediction = self.model.predict(feature_vector)[0]
        probabilities = self.model.predict_proba(feature_vector)[0]

        return {
            'prediction': prediction,
            'label': self.performance_labels[prediction],
            'probabilities': {
                'Underperformed': probabilities[0],
                'Normal': probabilities[1],
                'Successful': probabilities[2],
                'Viral': probabilities[3]
            },
            'features': features
        }

    def get_recommendations(self, text: str, user_id: int = 1):
        """Get recommendations to improve tweet performance"""
        features = self.extract_features_from_text(text, user_id)
        result = self.predict(text, user_id)

        recommendations = []

        # Length recommendations
        if features['tweet_length'] < 50:
            recommendations.append("📝 Tweet is very short. Consider adding more context or details.")
        elif features['tweet_length'] > 280:
            recommendations.append("📝 Tweet exceeds Twitter character limit. Edit to stay under 280.")

        # Engagement recommendations
        if features['hashtag_count'] == 0:
            recommendations.append("#️⃣ Consider adding 1-2 relevant hashtags for discoverability.")
        elif features['hashtag_count'] > 3:
            recommendations.append("#️⃣ Too many hashtags. Limit to 1-3 for better engagement.")

        if features['mention_count'] == 0:
            recommendations.append("@️ Consider mentioning relevant prediction market accounts.")

        if features['url_count'] == 0:
            recommendations.append("🔗 Adding a link (market link, article, etc) could improve engagement.")

        if features['emoji_count'] == 0:
            recommendations.append("😊 Adding 1-2 emojis can increase engagement and visual appeal.")

        # Sentiment recommendations
        if features['is_negative'] == 1:
            recommendations.append("😊 Negative sentiment detected. Consider a more positive tone.")

        # Question recommendations
        if features['has_question'] == 0:
            recommendations.append("❓ Asking a question encourages responses and engagement.")

        # Timing recommendations
        recommendations.append(f"⏰ Best times: Weekdays 12-6 PM for prediction markets.")

        return {
            'prediction': result,
            'recommendations': recommendations if recommendations else ["✅ Tweet looks good!"]
        }

    def _count_emojis(self, text):
        """Count emoji occurrences"""
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "]+",
            flags=re.UNICODE
        )
        return len(emoji_pattern.findall(str(text)))

    def _caps_ratio(self, text):
        """Calculate ratio of capital letters"""
        if len(text) == 0:
            return 0
        capitals = sum(1 for c in text if c.isupper())
        return capitals / len(text)

    def analyze_dataset(self, csv_file: str = "tweets_features.csv"):
        """Analyze the full dataset and generate insights"""
        df = pd.read_csv(csv_file)

        print("\n" + "="*70)
        print("PREDICTION MARKET TWEET ANALYSIS - KEY INSIGHTS")
        print("="*70 + "\n")

        # By performance category
        print("1. PERFORMANCE DISTRIBUTION:")
        perf_dist = df['performance'].value_counts()
        for perf, count in perf_dist.items():
            pct = (count / len(df)) * 100
            color = self.performance_colors[{'Flop': 0, 'Average': 1, 'Viral': 2}[perf]]
            print(f"   {color} {perf:8s}: {count:5d} tweets ({pct:5.1f}%)")

        # By account
        print("\n2. TOP PERFORMING ACCOUNTS:")
        account_perf = df.groupby('username')['performance'].apply(
            lambda x: (x == 'Viral').sum()
        ).sort_values(ascending=False).head(5)
        for account, viral_count in account_perf.items():
            total = len(df[df['username'] == account])
            pct = (viral_count / total) * 100
            print(f"   @{account:25s}: {viral_count:3d} viral tweets ({pct:5.1f}% of their tweets)")

        # Feature insights
        print("\n3. WHAT DRIVES VIRAL TWEETS:")
        viral_df = df[df['performance'] == 'Viral']
        flop_df = df[df['performance'] == 'Flop']

        print(f"   Avg engagement (Viral vs Flop):")
        print(f"     Likes:    {viral_df['likes'].mean():.1f} vs {flop_df['likes'].mean():.1f}")
        print(f"     Retweets: {viral_df['retweets'].mean():.1f} vs {flop_df['retweets'].mean():.1f}")
        print(f"     Replies:  {viral_df['replies'].mean():.1f} vs {flop_df['replies'].mean():.1f}")

        print(f"\n   Best times to post (peak viral hour):")
        best_hour = viral_df['hour'].mode()[0] if len(viral_df) > 0 else 14
        print(f"     {best_hour:02d}:00 (Most viral tweets posted around this hour)")

        print(f"\n   Content characteristics of viral tweets:")
        print(f"     Avg length: {viral_df['tweet_length'].mean():.0f} characters")
        print(f"     Questions: {(viral_df['has_question'].sum() / len(viral_df) * 100):.1f}%")
        print(f"     Hashtags:  {viral_df['hashtag_count'].mean():.2f} per tweet")
        print(f"     Mentions:  {viral_df['mention_count'].mean():.2f} per tweet")

        print("\n" + "="*70 + "\n")


def main():
    """Demo the scoring system"""
    print("\n" + "="*70)
    print("TWEET PERFORMANCE PREDICTION ENGINE")
    print("="*70 + "\n")

    # Initialize predictor
    predictor = TweetPerformancePredictor()

    # Example tweets to score
    example_tweets = [
        "🚀 Just predicted the outcome of the 2024 elections! Check out my market here: https://polymarket.com #prediction #crypto",
        "thoughts on bitcoin",
        "What's your take on the upcoming policy decision? I'm betting on YES with 70% confidence. #Polymarket #Predictions",
    ]

    print("EXAMPLE PREDICTIONS:\n")

    for i, tweet in enumerate(example_tweets, 1):
        print(f"{i}. Tweet: \"{tweet}\"")
        result = predictor.get_recommendations(tweet, user_id=123)
        pred = result['prediction']
        label = pred['label']
        color = predictor.performance_colors[pred['prediction']]
        prob = pred['probabilities']

        print(f"   Prediction: {color} {label}")
        print(f"   Confidence:")
        print(f"     Flop:    {prob['Flop']*100:5.1f}%")
        print(f"     Average: {prob['Average']*100:5.1f}%")
        print(f"     Viral:   {prob['Viral']*100:5.1f}%")
        print(f"   Recommendations:")
        for rec in result['recommendations']:
            print(f"     {rec}")
        print()

    # Analyze full dataset
    predictor.analyze_dataset()

    print("✅ Scoring system ready for production!\n")


if __name__ == "__main__":
    main()
