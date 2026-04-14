"""
Feature Engineering Script
Transforms raw tweet data into ML-ready features
Extracts content, temporal, and engagement metrics
"""

import pandas as pd
import numpy as np
from datetime import datetime
import re
from textblob import TextBlob
import warnings

warnings.filterwarnings('ignore')


class FeatureEngineer:
    def __init__(self, tweets_csv: str = "tweets_raw.csv"):
        """Load raw tweets and initialize feature engineering"""
        self.df = pd.read_csv(tweets_csv)
        self.df['created_at'] = pd.to_datetime(self.df['created_at'])
        print(f"✓ Loaded {len(self.df):,} tweets from {tweets_csv}")

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

        self.df['day_of_week'] = self.df['created_at'].dt.dayofweek  # 0=Monday, 6=Sunday
        self.df['hour'] = self.df['created_at'].dt.hour
        self.df['month'] = self.df['created_at'].dt.month
        self.df['is_weekend'] = self.df['day_of_week'].isin([5, 6]).astype(int)
        self.df['is_business_hours'] = self.df['hour'].between(9, 17).astype(int)
        self.df['is_peak_hours'] = self.df['hour'].between(12, 18).astype(int)

        # Days since last tweet by user
        self.df['days_since_last_tweet'] = (
            self.df.groupby('username')['created_at'].diff().dt.days.fillna(0)
        )

        print(f"✓ Extracted 7 temporal features")

    def extract_sentiment_features(self):
        """Extract sentiment and sentiment-related features"""
        print("💭 Extracting sentiment features...")

        # Simple sentiment analysis using TextBlob
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

        # Basic engagement metrics
        self.df['total_interactions'] = (
            self.df['likes'] + self.df['retweets'] + self.df['replies']
        )

        # Engagement rates (handling division by zero)
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

    def create_target_variable(self):
        """Create classification target: Flop/Average/Viral"""
        print("\n🎯 Creating target variable (Flop/Average/Viral)...")

        # Define performance categories based on engagement metrics
        # Using quartiles within each account to normalize for account size
        by_account = self.df.groupby('username')['total_interactions'].quantile([0.25, 0.75])

        def categorize_performance(row):
            account_q25 = by_account[row['username'], 0.25]
            account_q75 = by_account[row['username'], 0.75]

            if row['total_interactions'] <= account_q25:
                return 'Flop'
            elif row['total_interactions'] >= account_q75:
                return 'Viral'
            else:
                return 'Average'

        self.df['performance'] = self.df.apply(categorize_performance, axis=1)

        # Show distribution
        print(f"\nPerformance distribution:")
        print(self.df['performance'].value_counts())

    def create_numeric_target(self):
        """Create numeric version of target for ML"""
        performance_map = {'Flop': 0, 'Average': 1, 'Viral': 2}
        self.df['performance_encoded'] = self.df['performance'].map(performance_map)

    def get_feature_summary(self):
        """Print summary of engineered features"""
        feature_cols = [col for col in self.df.columns
                       if col not in ['tweet_id', 'username', 'created_at', 'text',
                                     'performance', 'performance_encoded']]

        print(f"\n{'='*70}")
        print(f"Feature Engineering Summary")
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
        # Select relevant columns for ML
        feature_cols = [col for col in self.df.columns
                       if col not in ['tweet_id', 'text', 'created_at']]

        output_df = self.df[feature_cols].copy()
        output_df.to_csv(output_csv, index=False)
        print(f"✓ Saved {len(output_df):,} rows and {len(output_df.columns)} features to {output_csv}")

    def _count_emojis(self, text):
        """Count emoji occurrences in text"""
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags (iOS)
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
    print("FEATURE ENGINEERING PIPELINE")
    print("="*70)

    # Initialize feature engineer
    engineer = FeatureEngineer("tweets_raw.csv")

    # Extract features
    engineer.extract_content_features()
    engineer.extract_temporal_features()
    engineer.extract_sentiment_features()
    engineer.extract_engagement_features()
    engineer.create_target_variable()
    engineer.create_numeric_target()

    # Print summary
    engineer.get_feature_summary()

    # Save features
    engineer.save_features("tweets_features.csv")

    print("\n✅ Feature engineering complete!")
    print("   Next: Run exploratory analysis (03_exploratory_analysis.ipynb)\n")


if __name__ == "__main__":
    main()
