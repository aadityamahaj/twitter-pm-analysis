"""
Feature Engineering V2 - Enhanced Viral Definition
Uses weighted engagement formula with account normalization
"""

import pandas as pd
import numpy as np
from datetime import datetime
import re
from textblob import TextBlob
import warnings

warnings.filterwarnings('ignore')


class FeatureEngineerV2:
    def __init__(self, tweets_csv: str = "tweets_raw.csv"):
        """Load raw tweets and initialize feature engineering"""
        self.df = pd.read_csv(tweets_csv)
        self.df['created_at'] = pd.to_datetime(self.df['created_at'])
        print(f"✓ Loaded {len(self.df):,} tweets from {tweets_csv}")

    def calculate_engagement_value(self):
        """
        Calculate engagement value using weighted formula:
        Engagement Value = Likes + 2(Retweets) + 2(Replies)

        Why these weights:
        - Retweets & Replies = stronger engagement than likes
        - Likes = basic approval
        - Retweets = sharing signal (most important)
        - Replies = conversation engagement (most important)
        """
        print("\n📊 Calculating weighted engagement values...")

        self.df['engagement_value'] = (
            self.df['likes'] +
            2 * self.df['retweets'] +
            2 * self.df['replies']
        )

        print(f"✓ Engagement values calculated")
        print(f"  Min: {self.df['engagement_value'].min():.0f}")
        print(f"  Median: {self.df['engagement_value'].median():.0f}")
        print(f"  Max: {self.df['engagement_value'].max():.0f}")

    def calculate_success_score(self):
        """
        Calculate normalized success score per account.

        Success Score = Tweet Engagement Value / Median of Last 20 Tweets (by account)

        This normalizes for account size and posting frequency.
        """
        print("\n🎯 Calculating account-normalized success scores...")

        success_scores = []

        for account in self.df['username'].unique():
            account_df = self.df[self.df['username'] == account].sort_values('created_at').reset_index(drop=True)

            for idx, row in account_df.iterrows():
                # Get last 20 tweets for this account (or all if less than 20)
                start_idx = max(0, idx - 20)
                recent_tweets = account_df.iloc[start_idx:idx]

                if len(recent_tweets) > 0:
                    median_engagement = recent_tweets['engagement_value'].median()

                    # Avoid division by zero
                    if median_engagement > 0:
                        success_score = row['engagement_value'] / median_engagement
                    else:
                        success_score = 0
                else:
                    success_score = 0

                success_scores.append(success_score)

        self.df['success_score'] = success_scores

        print(f"✓ Success scores calculated")
        print(f"  Mean: {self.df['success_score'].mean():.2f}")
        print(f"  Median: {self.df['success_score'].median():.2f}")

    def create_performance_categories(self):
        """
        Create performance categories based on success score:
        - > 2.0 = Viral (exceptional performance)
        - > 1.5 = Successful (above average)
        - 0.8-1.2 = Normal (expected performance)
        - < 0.7 = Underperformed (below expectations)
        """
        print("\n🎯 Creating performance categories...")

        def categorize(score):
            if score > 2.0:
                return 'Viral'
            elif score > 1.5:
                return 'Successful'
            elif score >= 0.8:
                return 'Normal'
            else:
                return 'Underperformed'

        self.df['performance'] = self.df['success_score'].apply(categorize)

        # Create numeric encoding
        performance_map = {
            'Underperformed': 0,
            'Normal': 1,
            'Successful': 2,
            'Viral': 3
        }
        self.df['performance_encoded'] = self.df['performance'].map(performance_map)

        print(f"\nPerformance distribution:")
        for perf in ['Viral', 'Successful', 'Normal', 'Underperformed']:
            count = (self.df['performance'] == perf).sum()
            pct = (count / len(self.df)) * 100
            print(f"  {perf:20s}: {count:5d} ({pct:5.1f}%)")

    def extract_content_features(self):
        """Extract features from tweet text content"""
        print("\n📝 Extracting content features...")

        self.df['tweet_length'] = self.df['text'].str.len()
        self.df['word_count'] = self.df['text'].str.split().str.len()
        self.df['hashtag_count'] = self.df['text'].str.count(r'#\w+')
        self.df['mention_count'] = self.df['text'].str.count(r'@\w+')
        self.df['url_count'] = self.df['text'].str.count(r'http[s]?://\S+')
        self.df['emoji_count'] = self.df['text'].apply(self._count_emojis)
        self.df['caps_ratio'] = self.df['text'].apply(self._caps_ratio)
        self.df['has_question'] = self.df['text'].str.contains(r'\?', regex=True).astype(int)
        self.df['has_exclamation'] = self.df['text'].str.contains(r'!', regex=True).astype(int)
        self.df['has_ellipsis'] = self.df['text'].str.contains(r'\.{2,}', regex=True).astype(int)

        print(f"✓ Extracted 10 content features")

    def extract_temporal_features(self):
        """Extract features from timestamp"""
        print("⏰ Extracting temporal features...")

        self.df['day_of_week'] = self.df['created_at'].dt.dayofweek
        self.df['hour'] = self.df['created_at'].dt.hour
        self.df['month'] = self.df['created_at'].dt.month
        self.df['is_weekend'] = self.df['day_of_week'].isin([5, 6]).astype(int)
        self.df['is_business_hours'] = self.df['hour'].between(9, 17).astype(int)
        self.df['is_peak_hours'] = self.df['hour'].between(12, 18).astype(int)

        self.df['days_since_last_tweet'] = (
            self.df.groupby('username')['created_at'].diff().dt.days.fillna(0)
        )

        print(f"✓ Extracted 7 temporal features")

    def extract_sentiment_features(self):
        """Extract sentiment and sentiment-related features"""
        print("💭 Extracting sentiment features...")

        sentiments = []
        for text in self.df['text']:
            try:
                blob = TextBlob(str(text))
                sentiments.append(blob.sentiment.polarity)
            except:
                sentiments.append(0)

        self.df['sentiment_polarity'] = sentiments
        self.df['is_positive'] = (self.df['sentiment_polarity'] > 0.1).astype(int)
        self.df['is_negative'] = (self.df['sentiment_polarity'] < -0.1).astype(int)
        self.df['is_neutral'] = (abs(self.df['sentiment_polarity']) <= 0.1).astype(int)

        print(f"✓ Extracted 4 sentiment features")

    def extract_engagement_features(self):
        """Create engagement rate metrics"""
        print("📊 Extracting engagement features...")

        # Basic metrics
        self.df['total_interactions'] = (
            self.df['likes'] + self.df['retweets'] + self.df['replies']
        )

        # Engagement ratios
        self.df['like_to_retweet_ratio'] = np.where(
            self.df['retweets'] > 0,
            self.df['likes'] / self.df['retweets'],
            self.df['likes']
        )

        self.df['retweet_ratio'] = np.where(
            self.df['total_interactions'] > 0,
            self.df['retweets'] / self.df['total_interactions'],
            0
        )

        self.df['reply_ratio'] = np.where(
            self.df['total_interactions'] > 0,
            self.df['replies'] / self.df['total_interactions'],
            0
        )

        self.df['like_ratio'] = np.where(
            self.df['total_interactions'] > 0,
            self.df['likes'] / self.df['total_interactions'],
            0
        )

        print(f"✓ Extracted 5 engagement features")

    def get_feature_summary(self):
        """Print summary of engineered features"""
        feature_cols = [col for col in self.df.columns
                       if col not in ['tweet_id', 'username', 'created_at', 'text',
                                     'performance', 'performance_encoded', 'engagement_value', 'success_score']]

        print(f"\n{'='*70}")
        print(f"Feature Engineering Summary (V2 - Weighted Engagement)")
        print(f"{'='*70}")
        print(f"\nTotal features created: {len(feature_cols)}")
        print(f"\nFeature list:")
        for i, col in enumerate(feature_cols, 1):
            print(f"  {i:2d}. {col}")

        print(f"\n{'='*70}")
        print(f"Dataset shape: {self.df.shape}")
        print(f"Memory usage: {self.df.memory_usage().sum() / 1024**2:.2f} MB")
        print(f"{'='*70}\n")

    def save_features(self, output_csv: str = "tweets_features.csv"):
        """Save engineered features to CSV"""
        feature_cols = [col for col in self.df.columns
                       if col not in ['tweet_id', 'text', 'created_at']]

        output_df = self.df[feature_cols].copy()
        output_df.to_csv(output_csv, index=False)
        print(f"✓ Saved {len(output_df):,} rows and {len(output_df.columns)} features to {output_csv}")

    def _count_emojis(self, text):
        """Count emoji occurrences in text"""
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
        text_str = str(text)
        if len(text_str) == 0:
            return 0
        capitals = sum(1 for c in text_str if c.isupper())
        return capitals / len(text_str)


def main():
    """Main execution"""
    print("\n" + "="*70)
    print("FEATURE ENGINEERING PIPELINE V2 - WEIGHTED ENGAGEMENT")
    print("="*70)

    # Initialize feature engineer
    engineer = FeatureEngineerV2("tweets_raw.csv")

    # Calculate engagement values and success scores
    engineer.calculate_engagement_value()
    engineer.calculate_success_score()
    engineer.create_performance_categories()

    # Extract features
    engineer.extract_content_features()
    engineer.extract_temporal_features()
    engineer.extract_sentiment_features()
    engineer.extract_engagement_features()

    # Print summary
    engineer.get_feature_summary()

    # Save features
    engineer.save_features("tweets_features.csv")

    print("\n✅ Feature engineering v2 complete!")
    print("   New viral definition:")
    print("   - Viral: Success Score > 2.0 (top performers)")
    print("   - Successful: Success Score > 1.5 (above average)")
    print("   - Normal: Success Score 0.8-1.2 (expected)")
    print("   - Underperformed: Success Score < 0.7")
    print("\n   Next: Run model training (04_model_training.py)\n")


if __name__ == "__main__":
    main()
