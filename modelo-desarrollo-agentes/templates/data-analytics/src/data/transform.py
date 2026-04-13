"""
Data transformation module
Clean, transform, and prepare data for analysis
"""
import pandas as pd
import numpy as np
from typing import List
import logging

from config import PROCESSED_DIR

logger = logging.getLogger(__name__)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Basic data cleaning"""
    logger.info(f"Cleaning data: {len(df)} rows, {len(df.columns)} columns")
    
    # Remove duplicates
    df = df.drop_duplicates()
    logger.info(f"Removed duplicates: {len(df)} rows remaining")
    
    # Convert date columns
    date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    
    # Strip whitespace from string columns
    string_cols = df.select_dtypes(include=['object']).columns
    for col in string_cols:
        df[col] = df[col].str.strip()
    
    logger.info("Data cleaning completed")
    return df


def handle_missing_values(df: pd.DataFrame, strategy: str = 'drop') -> pd.DataFrame:
    """Handle missing values"""
    logger.info(f"Handling missing values with strategy: {strategy}")
    
    missing_before = df.isnull().sum().sum()
    
    if strategy == 'drop':
        df = df.dropna()
    elif strategy == 'mean':
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
    elif strategy == 'median':
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    elif strategy == 'forward_fill':
        df = df.fillna(method='ffill')
    
    missing_after = df.isnull().sum().sum()
    logger.info(f"Missing values: {missing_before} -> {missing_after}")
    
    return df


def transform_dates(df: pd.DataFrame, date_column: str) -> pd.DataFrame:
    """Add date-based features"""
    if date_column in df.columns:
        df['year'] = df[date_column].dt.year
        df['month'] = df[date_column].dt.month
        df['quarter'] = df[date_column].dt.quarter
        df['day_of_week'] = df[date_column].dt.dayofweek
    
    return df


def aggregate_data(df: pd.DataFrame, group_by: List[str], aggregations: dict) -> pd.DataFrame:
    """Aggregate data by specified columns"""
    logger.info(f"Aggregating data by {group_by}")
    
    result = df.groupby(group_by).agg(aggregations).reset_index()
    
    logger.info(f"Aggregation complete: {len(result)} rows")
    return result


def save_processed_data(df: pd.DataFrame, filename: str) -> None:
    """Save processed data"""
    output_path = PROCESSED_DIR / filename
    df.to_csv(output_path, index=False)
    logger.info(f"Saved processed data to {output_path}")
