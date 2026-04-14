"""
Advanced Analysis - What Drives High Success Scores
Analyzes features that correlate with viral performance
"""

import pandas as pd
import numpy as np
from collections import Counter
import warnings
import os

warnings.filterwarnings('ignore')


class ViralTweetAnalyzer:
    """Analyze what features drive high success scores"""

    def __init__(self, csv_file: str = None):
        # If no path provided, use the script's directory
        if csv_file is None:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            csv_file = os.path.join(script_dir, "tweets_features.csv")

        self.df = pd.read_csv(csv_file)
        self.viral_tweets = self.df[self.df['performance'] == 'Viral']
        self.successful_tweets = self.df[self.df['performance'] == 'Successful']
        self.normal_tweets = self.df[self.df['performance'] == 'Normal']
        self.underperformed_tweets = self.df[self.df['performance'] == 'Underperformed']

    def analyze_timing_patterns(self):
        """Analyze posting times for viral tweets"""
        viral_by_hour = self.viral_tweets.groupby('hour').agg({
            'likes': 'mean',
            'retweets': 'mean',
            'replies': 'mean',
            'success_score': 'mean',
        })
        viral_by_hour['count'] = self.viral_tweets.groupby('hour').size()

        underperf_by_hour = self.underperformed_tweets.groupby('hour').agg({
            'likes': 'mean',
            'retweets': 'mean',
            'replies': 'mean',
            'success_score': 'mean',
        })

        return viral_by_hour, underperf_by_hour

    def analyze_sentiment_impact(self):
        """Analyze sentiment vs success score"""
        sentiment_bins = pd.cut(self.df['sentiment_polarity'], bins=5)
        sentiment_engagement = self.df.groupby(sentiment_bins).agg({
            'success_score': 'mean',
            'likes': 'mean',
            'retweets': 'mean',
            'replies': 'mean',
        })
        return sentiment_engagement

    def analyze_content_characteristics(self):
        """Compare content features between viral and underperformed tweets"""
        return {
            'Viral': {
                'avg_length': self.viral_tweets['tweet_length'].mean(),
                'avg_hashtags': self.viral_tweets['hashtag_count'].mean(),
                'avg_mentions': self.viral_tweets['mention_count'].mean(),
                'avg_urls': self.viral_tweets['url_count'].mean(),
                'avg_emojis': self.viral_tweets['emoji_count'].mean(),
                'pct_questions': (self.viral_tweets['has_question'].sum() / len(self.viral_tweets)) * 100,
                'pct_exclamation': (self.viral_tweets['has_exclamation'].sum() / len(self.viral_tweets)) * 100,
                'avg_sentiment': self.viral_tweets['sentiment_polarity'].mean(),
                'pct_positive': (self.viral_tweets['is_positive'].sum() / len(self.viral_tweets)) * 100,
                'avg_success_score': self.viral_tweets['success_score'].mean(),
            },
            'Successful': {
                'avg_length': self.successful_tweets['tweet_length'].mean(),
                'avg_hashtags': self.successful_tweets['hashtag_count'].mean(),
                'avg_mentions': self.successful_tweets['mention_count'].mean(),
                'avg_urls': self.successful_tweets['url_count'].mean(),
                'avg_emojis': self.successful_tweets['emoji_count'].mean(),
                'pct_questions': (self.successful_tweets['has_question'].sum() / len(self.successful_tweets)) * 100,
                'pct_exclamation': (self.successful_tweets['has_exclamation'].sum() / len(self.successful_tweets)) * 100,
                'avg_sentiment': self.successful_tweets['sentiment_polarity'].mean(),
                'pct_positive': (self.successful_tweets['is_positive'].sum() / len(self.successful_tweets)) * 100,
                'avg_success_score': self.successful_tweets['success_score'].mean(),
            },
            'Normal': {
                'avg_length': self.normal_tweets['tweet_length'].mean(),
                'avg_hashtags': self.normal_tweets['hashtag_count'].mean(),
                'avg_mentions': self.normal_tweets['mention_count'].mean(),
                'avg_urls': self.normal_tweets['url_count'].mean(),
                'avg_emojis': self.normal_tweets['emoji_count'].mean(),
                'pct_questions': (self.normal_tweets['has_question'].sum() / len(self.normal_tweets)) * 100,
                'pct_exclamation': (self.normal_tweets['has_exclamation'].sum() / len(self.normal_tweets)) * 100,
                'avg_sentiment': self.normal_tweets['sentiment_polarity'].mean(),
                'pct_positive': (self.normal_tweets['is_positive'].sum() / len(self.normal_tweets)) * 100,
                'avg_success_score': self.normal_tweets['success_score'].mean(),
            },
            'Underperformed': {
                'avg_length': self.underperformed_tweets['tweet_length'].mean(),
                'avg_hashtags': self.underperformed_tweets['hashtag_count'].mean(),
                'avg_mentions': self.underperformed_tweets['mention_count'].mean(),
                'avg_urls': self.underperformed_tweets['url_count'].mean(),
                'avg_emojis': self.underperformed_tweets['emoji_count'].mean(),
                'pct_questions': (self.underperformed_tweets['has_question'].sum() / len(self.underperformed_tweets)) * 100,
                'pct_exclamation': (self.underperformed_tweets['has_exclamation'].sum() / len(self.underperformed_tweets)) * 100,
                'avg_sentiment': self.underperformed_tweets['sentiment_polarity'].mean(),
                'pct_positive': (self.underperformed_tweets['is_positive'].sum() / len(self.underperformed_tweets)) * 100,
                'avg_success_score': self.underperformed_tweets['success_score'].mean(),
            }
        }

    def get_feature_correlations_with_success(self):
        """Analyze which features correlate most with success_score"""
        features_to_check = [
            'tweet_length', 'word_count', 'hashtag_count', 'mention_count', 'url_count',
            'emoji_count', 'caps_ratio', 'has_question', 'has_exclamation', 'has_ellipsis',
            'day_of_week', 'hour', 'month', 'is_weekend', 'is_business_hours', 'is_peak_hours',
            'days_since_last_tweet', 'sentiment_polarity', 'is_positive', 'is_negative', 'is_neutral',
            'likes', 'retweets', 'replies', 'quote_count', 'total_interactions'
        ]

        correlations = {}
        for feature in features_to_check:
            if feature in self.df.columns:
                corr = self.df[feature].corr(self.df['success_score'])
                correlations[feature] = corr

        # Sort by absolute correlation
        sorted_corr = sorted(correlations.items(), key=lambda x: abs(x[1]), reverse=True)
        return dict(sorted_corr[:15])  # Top 15

    def find_common_patterns(self):
        """Find patterns common in viral tweets"""
        patterns = {
            'high_success_score': {
                'avg_score': self.viral_tweets['success_score'].mean(),
                'median_score': self.viral_tweets['success_score'].median(),
            },
            'optimal_length_range': {
                'min': self.viral_tweets['tweet_length'].quantile(0.25),
                'optimal': self.viral_tweets['tweet_length'].median(),
                'max': self.viral_tweets['tweet_length'].quantile(0.75),
            },
            'best_posting_hours': self.viral_tweets.groupby('hour').size().nlargest(5).index.tolist(),
            'high_interaction_features': {
                'has_mentions': (self.viral_tweets['mention_count'] > 0).sum() / len(self.viral_tweets),
                'has_hashtags': (self.viral_tweets['hashtag_count'] > 0).sum() / len(self.viral_tweets),
                'has_emojis': (self.viral_tweets['emoji_count'] > 0).sum() / len(self.viral_tweets),
                'has_questions': (self.viral_tweets['has_question'] == 1).sum() / len(self.viral_tweets),
                'has_urls': (self.viral_tweets['url_count'] > 0).sum() / len(self.viral_tweets),
            }
        }
        return patterns

    def get_viral_vs_underperformed_comparison(self):
        """Get detailed comparison"""
        metrics = ['tweet_length', 'hashtag_count', 'mention_count', 'emoji_count',
                  'has_question', 'sentiment_polarity', 'success_score']
        comparison = {}

        for metric in metrics:
            if metric in self.df.columns:
                viral_mean = self.viral_tweets[metric].mean()
                underperf_mean = self.underperformed_tweets[metric].mean()
                improvement = ((viral_mean - underperf_mean) / abs(underperf_mean) * 100) if underperf_mean != 0 else 0

                comparison[metric] = {
                    'viral': viral_mean,
                    'underperformed': underperf_mean,
                    'improvement_pct': improvement
                }

        return comparison
