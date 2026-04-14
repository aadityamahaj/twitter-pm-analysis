"""
ML Model Training - Prediction Performance Classification (V2)
Trains models to predict Underperformed/Normal/Successful/Viral performance
Uses weighted engagement formula with account normalization
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score,
    f1_score, roc_auc_score, roc_curve, auc
)
import pickle
import warnings

warnings.filterwarnings('ignore')


class PerformancePredictionModel:
    def __init__(self, features_csv: str = "tweets_features.csv"):
        """Load features and prepare for training"""
        self.df = pd.read_csv(features_csv)
        print(f"✓ Loaded {len(self.df):,} samples with {len(self.df.columns)} columns")

        # Separate features and target
        cols_to_drop = ['performance', 'performance_encoded', 'username']
        if 'tweet_id' in self.df.columns:
            cols_to_drop.append('tweet_id')
        if 'created_at' in self.df.columns:
            cols_to_drop.append('created_at')

        self.X = self.df.drop([col for col in cols_to_drop if col in self.df.columns], axis=1)
        self.y = self.df['performance_encoded']

        # Account information for hybrid model
        self.account_info = self.df[['username', 'performance_encoded']].copy()

        print(f"✓ Features shape: {self.X.shape}")
        print(f"✓ Target distribution:\n{self.df['performance'].value_counts()}\n")

        self.models = {}
        self.results = {}

    def prepare_data(self):
        """Split and scale data"""
        print("📊 Preparing data...")

        # Train/test split (80/20) with stratification
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            self.X, self.y, test_size=0.2, random_state=42, stratify=self.y
        )

        # Standardize features
        self.scaler = StandardScaler()
        self.X_train_scaled = self.scaler.fit_transform(self.X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)

        print(f"✓ Train set: {self.X_train.shape}")
        print(f"✓ Test set: {self.X_test.shape}\n")

    def train_random_forest(self):
        """Train Random Forest classifier"""
        print("🌲 Training Random Forest...")

        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1
        )

        model.fit(self.X_train, self.y_train)
        self.models['Random Forest'] = model

        # Evaluate
        train_score = model.score(self.X_train, self.y_train)
        test_score = model.score(self.X_test, self.y_test)
        y_pred = model.predict(self.X_test)
        f1 = f1_score(self.y_test, y_pred, average='weighted')

        print(f"  Train accuracy: {train_score:.4f}")
        print(f"  Test accuracy: {test_score:.4f}")
        print(f"  F1 score (weighted): {f1:.4f}\n")

        return test_score, f1

    def train_gradient_boosting(self):
        """Train Gradient Boosting classifier"""
        print("🚀 Training Gradient Boosting...")

        model = GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            subsample=0.8
        )

        model.fit(self.X_train, self.y_train)
        self.models['Gradient Boosting'] = model

        # Evaluate
        train_score = model.score(self.X_train, self.y_train)
        test_score = model.score(self.X_test, self.y_test)
        y_pred = model.predict(self.X_test)
        f1 = f1_score(self.y_test, y_pred, average='weighted')

        print(f"  Train accuracy: {train_score:.4f}")
        print(f"  Test accuracy: {test_score:.4f}")
        print(f"  F1 score (weighted): {f1:.4f}\n")

        return test_score, f1


    def evaluate_best_model(self):
        """Evaluate the best performing model in detail"""
        print("="*70)
        print("MODEL EVALUATION - DETAILED METRICS")
        print("="*70 + "\n")

        # Select best model (Gradient Boosting typically performs best)
        best_model_name = 'Gradient Boosting'
        best_model = self.models['Gradient Boosting']

        y_pred = best_model.predict(self.X_test)
        y_pred_proba = best_model.predict_proba(self.X_test)

        print(f"Best Model: {best_model_name}\n")
        print("Classification Report:")
        print(classification_report(
            self.y_test, y_pred,
            target_names=['Underperformed', 'Normal', 'Successful', 'Viral']
        ))

        print("\nConfusion Matrix:")
        cm = confusion_matrix(self.y_test, y_pred)
        print(cm)

        # Feature importance
        print(f"\n{'='*70}")
        print("TOP 15 MOST IMPORTANT FEATURES")
        print(f"{'='*70}\n")

        feature_importance = pd.DataFrame({
            'feature': self.X.columns,
            'importance': best_model.feature_importances_
        }).sort_values('importance', ascending=False)

        for i, row in feature_importance.head(15).iterrows():
            print(f"{row['feature']:30s} {row['importance']:8.4f}")

        print(f"\n{'='*70}\n")

        return best_model_name, best_model, feature_importance

    def save_model(self, model, filename: str = "model_artifact.pkl"):
        """Save trained model to disk"""
        with open(filename, 'wb') as f:
            pickle.dump(model, f)
        print(f"✓ Model saved to {filename}")

    def save_feature_importance(self, importance_df, filename: str = "feature_importance.csv"):
        """Save feature importance to CSV"""
        importance_df.to_csv(filename, index=False)
        print(f"✓ Feature importance saved to {filename}")


def main():
    """Main execution"""
    print("\n" + "="*70)
    print("MACHINE LEARNING MODEL TRAINING")
    print("="*70 + "\n")

    # Initialize and prepare
    trainer = PerformancePredictionModel()
    trainer.prepare_data()

    # Train models
    print("="*70)
    print("TRAINING MODELS")
    print("="*70 + "\n")

    trainer.train_random_forest()
    trainer.train_gradient_boosting()

    # Evaluate best model
    best_model_name, best_model, feature_importance = trainer.evaluate_best_model()

    # Save artifacts
    trainer.save_model(best_model)
    trainer.save_feature_importance(feature_importance)

    print("✅ Model training complete!")
    print(f"   Best model: {best_model_name}")
    print(f"   Artifacts saved: model_artifact.pkl, feature_importance.csv\n")


if __name__ == "__main__":
    main()
