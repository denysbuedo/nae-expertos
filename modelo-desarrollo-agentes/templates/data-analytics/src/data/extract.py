"""
Data extraction module
Supports extracting data from APIs, databases, and files
"""
import pandas as pd
import requests
from sqlalchemy import create_engine
from pathlib import Path
from typing import Optional
import logging

from config import RAW_DIR, DATABASE_URL, API_BASE_URL

logger = logging.getLogger(__name__)


def extract_from_api(endpoint: str, params: Optional[dict] = None) -> pd.DataFrame:
    """Extract data from REST API"""
    url = f"{API_BASE_URL}/{endpoint}"
    logger.info(f"Extracting data from {url}")
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    df = pd.DataFrame(data)
    
    logger.info(f"Extracted {len(df)} records from {endpoint}")
    return df


def extract_from_database(query: str) -> pd.DataFrame:
    """Extract data from PostgreSQL database"""
    logger.info(f"Executing query: {query[:100]}...")
    
    engine = create_engine(DATABASE_URL)
    df = pd.read_sql_query(query, engine)
    
    logger.info(f"Extracted {len(df)} records from database")
    return df


def extract_from_file(file_path: Path, file_type: str = 'csv') -> pd.DataFrame:
    """Extract data from file (csv, excel, json)"""
    logger.info(f"Extracting data from {file_path}")
    
    if file_type == 'csv':
        df = pd.read_csv(file_path)
    elif file_type == 'excel':
        df = pd.read_excel(file_path)
    elif file_type == 'json':
        df = pd.read_json(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
    
    logger.info(f"Extracted {len(df)} records from {file_path}")
    return df


def save_raw_data(df: pd.DataFrame, filename: str) -> Path:
    """Save extracted data to raw directory"""
    output_path = RAW_DIR / filename
    df.to_csv(output_path, index=False)
    logger.info(f"Saved raw data to {output_path}")
    return output_path
