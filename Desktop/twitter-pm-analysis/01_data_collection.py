"""
Twitter Prediction Market Data Collection Script
Fetches tweets from 26 prediction market accounts using Twitter API v2
Fetches 2 months of prior data for ML analysis
"""

import tweepy
import pandas as pd
from datetime import datetime, timedelta
import time
import os
from typing import List, Dict

# Twitter accounts to analyze
ACCOUNTS = [
    "Maximilian_evm", "CarOnPolymarket", "Eltonma", "alpha_co", "MuddyRC",
    "rb_tweets", "BrokieTrades", "MEPPonPM", "kreoapp", "0xWeiler",
    "outcomenoble", "tomdnc", "KyleDeWriter", "0xgingergirl", "ruslan55x",
    "polymarket_O3O", "tsybka", "holy_moses7", "TheGreekTrader", "saurav_tweets",
    "locksy", "AIexey_Stark", "penguin_pmkt", "camolNFT", "datadashboards",
    "0xFleck", "thenarrator"
]


class TwitterDataCollector:
    def __init__(self, bearer_token: str):
        """Initialize Twitter API v2 client"""
        self.client = tweepy.Client(bearer_token=bearer_token, wait_on_rate_limit=True)
        self.all_tweets = []
        # Format: RFC3339 with timezone (required by Twitter API)
        self.two_months_ago = (datetime.utcnow() - timedelta(days=60)).strftime("%Y-%m-%dT00:00:00Z")

    def get_user_id(self, username: str) -> str:
        """Get user ID from username"""
        try:
            user = self.client.get_user(username=username)
            return user.data.id
        except Exception as e:
            print(f"Error fetching user ID for {username}: {e}")
            return None

    def fetch_tweets(self, user_id: str, username: str, max_results: int = 100) -> List[Dict]:
        """
        Fetch tweets from a user using Twitter API v2
        Fetches up to 3200 tweets (API limit per request) from last 2 months
        """
        tweets_data = []

        try:
            # Fetch with pagination to get maximum data
            pagination_token = None
            page_count = 0
            max_pages = 10  # Fetch multiple pages for more data

            while page_count < max_pages:
                tweets = self.client.get_users_tweets(
                    id=user_id,
                    tweet_fields=[
                        "created_at",
                        "public_metrics",
                    ],
                    max_results=max_results,
                    pagination_token=pagination_token,
                    start_time=self.two_months_ago
                )

                if tweets.data:
                    for tweet in tweets.data:
                        metrics = tweet.public_metrics
                        tweet_dict = {
                            "tweet_id": tweet.id,
                            "username": username,
                            "user_id": user_id,
                            "created_at": tweet.created_at,
                            "text": tweet.text,
                            "likes": metrics.get("like_count", 0),
                            "retweets": metrics.get("retweet_count", 0),
                            "replies": metrics.get("reply_count", 0),
                            "quotes": metrics.get("quote_count", 0),
                        }
                        tweets_data.append(tweet_dict)

                    # Check if there's a next page
                    if 'next_token' in tweets.meta:
                        pagination_token = tweets.meta['next_token']
                        page_count += 1
                    else:
                        break
                else:
                    break

                # Small delay to respect rate limits
                time.sleep(0.5)

            print(f"✓ Fetched {len(tweets_data)} tweets from @{username}")

        except Exception as e:
            print(f"✗ Error fetching tweets for @{username}: {e}")

        return tweets_data

    def collect_all_tweets(self):
        """Collect tweets from all 26 accounts"""
        print(f"\n{'='*70}")
        print(f"Twitter Prediction Market Data Collection")
        print(f"Using Twitter API v2 with paid credits")
        print(f"{'='*70}")
        print(f"\nAccounts: {len(ACCOUNTS)}")
        print(f"Time period: Last 2 months")
        print(f"{'='*70}\n")

        total_fetched = 0

        for i, username in enumerate(ACCOUNTS, 1):
            print(f"[{i}/{len(ACCOUNTS)}] Processing @{username}...", end=" ")

            # Get user ID
            user_id = self.get_user_id(username)
            if not user_id:
                print(f"✗ Could not fetch user ID\n")
                continue

            # Fetch tweets
            tweets = self.fetch_tweets(user_id, username)
            self.all_tweets.extend(tweets)
            total_fetched += len(tweets)

            # Progress indicator
            print(f"({total_fetched:,} total so far)")

            # Be respectful of rate limits
            if i < len(ACCOUNTS):
                time.sleep(1)

        return self.all_tweets

    def save_to_csv(self, filename: str = "tweets_raw.csv"):
        """Save collected tweets to CSV"""
        if not self.all_tweets:
            print("\n✗ No tweets collected!")
            return False

        df = pd.DataFrame(self.all_tweets)
        df = df.sort_values('created_at')  # Sort by date
        df.to_csv(filename, index=False)

        print(f"\n{'='*70}")
        print(f"✓ Saved {len(df):,} tweets to {filename}")
        print(f"{'='*70}")
        print(f"\nDataset Summary:")
        print(f"  • Total tweets: {len(df):,}")
        print(f"  • Date range: {df['created_at'].min()} to {df['created_at'].max()}")
        print(f"  • Unique accounts: {df['username'].nunique()}")
        print(f"  • Avg likes per tweet: {df['likes'].mean():.1f}")
        print(f"  • Avg retweets per tweet: {df['retweets'].mean():.1f}")
        print(f"  • Avg replies per tweet: {df['replies'].mean():.1f}")
        print(f"  • Total engagement: {(df['likes'] + df['retweets'] + df['replies']).sum():,}")
        print(f"{'='*70}\n")

        return True

    def get_summary_stats(self) -> pd.DataFrame:
        """Get summary statistics by account"""
        if not self.all_tweets:
            return None

        df = pd.DataFrame(self.all_tweets)
        summary = df.groupby('username').agg({
            'tweet_id': 'count',
            'likes': ['mean', 'max', 'sum'],
            'retweets': ['mean', 'max', 'sum'],
            'replies': ['mean', 'max']
        }).round(2)

        summary.columns = ['tweet_count', 'avg_likes', 'max_likes', 'total_likes',
                          'avg_retweets', 'max_retweets', 'total_retweets',
                          'avg_replies', 'max_replies']
        return summary.sort_values('tweet_count', ascending=False)


def main():
    """Main execution"""
    # Get API credentials
    bearer_token = os.getenv("TWITTER_BEARER_TOKEN")

    if not bearer_token:
        print("\n⚠ ERROR: TWITTER_BEARER_TOKEN environment variable not set!")
        print("Please set it before running:")
        print("   export TWITTER_BEARER_TOKEN='your_bearer_token_here'\n")
        return

    print("\n🚀 Twitter Prediction Market Data Collection")
    print("Using Twitter API v2 with paid credits\n")

    # Initialize collector
    collector = TwitterDataCollector(bearer_token)

    # Collect tweets
    collector.collect_all_tweets()

    # Save to CSV
    success = collector.save_to_csv("tweets_raw.csv")

    if success:
        # Print summary stats
        print("\nSummary Statistics by Account:")
        print("="*70)
        stats = collector.get_summary_stats()
        if stats is not None:
            print(stats)
        print("="*70)
        print("\n✅ Data collection complete! Ready for feature engineering.\n")


if __name__ == "__main__":
    main()
