"""
Example analysis script
"""
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

from data.extract import extract_from_file
from data.transform import clean_data, handle_missing_values
from config import OUTPUT_DIR


def run_analysis():
    """Run example analysis"""
    print("Starting analysis...")
    
    # Load data (example with CSV)
    # df = extract_from_file(Path('data/raw/sales_data.csv'))
    
    # For demonstration, create sample data
    df = pd.DataFrame({
        'date': pd.date_range('2024-01-01', periods=100, freq='D'),
        'sales': np.random.randint(100, 1000, 100),
        'region': np.random.choice(['North', 'South', 'East', 'West'], 100),
        'product': np.random.choice(['A', 'B', 'C'], 100),
    })
    
    # Clean data
    df = clean_data(df)
    
    # Add date features
    df = transform_dates(df, 'date')
    
    # Analysis: Sales by region
    sales_by_region = df.groupby('region')['sales'].agg(['sum', 'mean', 'count'])
    print("\nSales by Region:")
    print(sales_by_region)
    
    # Analysis: Monthly trends
    monthly_trends = df.groupby('month')['sales'].sum()
    print("\nMonthly Trends:")
    print(monthly_trends)
    
    # Visualizations
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    
    # Sales by region
    sns.barplot(data=df, x='region', y='sales', ax=axes[0, 0])
    axes[0, 0].set_title('Sales by Region')
    
    # Sales distribution
    sns.histplot(df['sales'], kde=True, ax=axes[0, 1])
    axes[0, 1].set_title('Sales Distribution')
    
    # Monthly trends
    monthly = df.groupby('month')['sales'].sum()
    monthly.plot(kind='line', ax=axes[1, 0], marker='o')
    axes[1, 0].set_title('Monthly Sales Trend')
    
    # Sales by product and region
    pivot = df.pivot_table(values='sales', index='region', columns='product', aggfunc='sum')
    sns.heatmap(pivot, annot=True, cmap='YlOrRd', ax=axes[1, 1])
    axes[1, 1].set_title('Sales by Product & Region')
    
    plt.tight_layout()
    
    # Save figure
    output_path = OUTPUT_DIR / 'analysis_report.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"\nReport saved to: {output_path}")
    
    return df


if __name__ == '__main__':
    df = run_analysis()
