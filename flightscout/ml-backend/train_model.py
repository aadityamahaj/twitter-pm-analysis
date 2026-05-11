#!/usr/bin/env python3
"""
FlightScout ML Model Trainer

Trains two models:
  1. XGBoost Regressor → predicted price
  2. XGBoost Classifier → price movement (rise/fall/stable)

Usage:
  python train_model.py
  python train_model.py --data-path data/your_real_data.parquet
  python train_model.py --n-samples 100000  # regenerate mock data

To use real historical data:
  Export from Amadeus, Kiwi, AviationStack, or your own database
  and save as a Parquet or CSV file matching the schema in data/mock_historical.py
"""

import argparse
import json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, classification_report
from xgboost import XGBRegressor, XGBClassifier

# Paths
DATA_DIR = Path('data')
MODEL_DIR = Path('models')
MODEL_DIR.mkdir(exist_ok=True)

FEATURE_COLS = [
    'days_until_departure', 'day_of_week', 'month', 'holiday_proximity',
    'stops', 'trip_length', 'demand_level', 'historical_avg_price',
    'recent_price_trend', 'price_vs_avg_pct',
    'origin_enc', 'destination_enc', 'cabin_class_enc', 'airline_enc', 'season_enc',
]

CATEGORICAL_COLS = ['origin', 'destination', 'cabin_class', 'airline', 'season']

def load_or_generate_data(data_path: Path, n_samples: int) -> pd.DataFrame:
    if data_path.exists():
        print(f"Loading data from {data_path}...")
        if str(data_path).endswith('.parquet'):
            return pd.read_parquet(data_path)
        return pd.read_csv(data_path)
    else:
        print(f"Data not found at {data_path} — generating {n_samples:,} mock samples...")
        from data.mock_historical import generate_historical_data
        df = generate_historical_data(n_samples)
        df.to_parquet(DATA_DIR / 'mock_historical.parquet', index=False)
        return df

def label_price_movement(row: pd.Series) -> str:
    """Classify future price movement based on price vs historical average."""
    pct = row['price_vs_avg_pct']
    trend = row['recent_price_trend']
    days = row['days_until_departure']

    if pct > 8 or (pct > 4 and days < 14) or trend > 0.05:
        return 'rise'
    if pct < -8 or (trend < -0.05 and days > 21):
        return 'fall'
    return 'stable'

def encode_categoricals(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[f'{col}_enc'] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    return df, encoders

def train(data_path: str | None, n_samples: int):
    path = Path(data_path) if data_path else DATA_DIR / 'mock_historical.parquet'
    df = load_or_generate_data(path, n_samples)
    print(f"Dataset: {len(df):,} rows, {df.columns.tolist()}")

    # Feature engineering
    df, encoders = encode_categoricals(df)
    df['price_movement'] = df.apply(label_price_movement, axis=1)

    print(f"\nLabel distribution:\n{df['price_movement'].value_counts()}")

    X = df[FEATURE_COLS]
    y_price = df['price']
    y_movement = df['price_movement']

    X_train, X_test, y_price_train, y_price_test, y_mov_train, y_mov_test = train_test_split(
        X, y_price, y_movement, test_size=0.15, random_state=42
    )

    # --- Train Price Regressor ---
    print("\nTraining XGBoost price regressor...")
    reg = XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=7,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1,
        early_stopping_rounds=30,
        eval_metric='mae',
    )
    reg.fit(X_train, y_price_train, eval_set=[(X_test, y_price_test)], verbose=False)

    y_pred_price = reg.predict(X_test)
    mae = mean_absolute_error(y_price_test, y_pred_price)
    r2 = r2_score(y_price_test, y_pred_price)
    print(f"Price Regressor → MAE: ${mae:.2f} | R²: {r2:.4f}")

    # --- Train Movement Classifier ---
    print("\nTraining XGBoost movement classifier...")
    clf = XGBClassifier(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        random_state=42,
        n_jobs=-1,
        early_stopping_rounds=20,
        eval_metric='mlogloss',
        use_label_encoder=False,
    )
    clf.fit(X_train, y_mov_train, eval_set=[(X_test, y_mov_test)], verbose=False)

    y_pred_mov = clf.predict(X_test)
    print(f"Movement Classifier:\n{classification_report(y_mov_test, y_pred_mov)}")

    # --- Save models ---
    joblib.dump(reg, MODEL_DIR / 'price_regressor.pkl')
    joblib.dump(clf, MODEL_DIR / 'price_classifier.pkl')
    joblib.dump(encoders, MODEL_DIR / 'label_encoders.pkl')

    metrics = {
        'price_mae': round(mae, 2),
        'price_r2': round(r2, 4),
        'n_train': len(X_train),
        'n_test': len(X_test),
        'features': FEATURE_COLS,
        'trained_at': pd.Timestamp.now().isoformat(),
    }
    (MODEL_DIR / 'metrics.json').write_text(json.dumps(metrics, indent=2))

    print(f"\n✅ Models saved to {MODEL_DIR}/")
    print(f"   price_regressor.pkl, price_classifier.pkl, label_encoders.pkl")
    print(f"\nMetrics:")
    for k, v in metrics.items():
        if k not in ['features', 'trained_at']:
            print(f"  {k}: {v}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train FlightScout ML model')
    parser.add_argument('--data-path', type=str, help='Path to historical data file (parquet or csv)')
    parser.add_argument('--n-samples', type=int, default=50_000, help='Mock data samples if no data-path given')
    args = parser.parse_args()
    train(args.data_path, args.n_samples)
