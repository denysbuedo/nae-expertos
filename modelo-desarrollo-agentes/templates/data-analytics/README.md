# Data Analytics Template

> Python 3.11+ | Pandas | NumPy | Matplotlib | Jupyter

## Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Jupyter Notebook
jupyter notebook

# Run example analysis
python src/analysis/example_analysis.py

# Run tests
pytest tests/ -v --cov=src
```

## Structure

```
data-analytics/
├── src/
│   ├── config.py           # Configuration
│   ├── data/
│   │   ├── extract.py      # Data extraction
│   │   └── transform.py    # Data transformation
│   └── analysis/           # Analysis scripts
├── notebooks/              # Jupyter notebooks
├── data/
│   ├── raw/               # Raw data files
│   ├── processed/         # Cleaned data
│   └── output/            # Results and visualizations
├── reports/               # Generated reports
└── requirements.txt

```

## Agent Usage

**Use `data-engineer` agent for:**
- Creating ETL pipelines in `src/data/`
- Analyzing datasets in notebooks
- Generating visualizations
- Building automated reports

**Use `analista-datos-encuestas` agent for:**
- Survey data analysis
- Statistical analysis
- Trend identification
- Comprehensive reports

## Common Tasks

### Extract Data
```python
from data.extract import extract_from_api, extract_from_database, extract_from_file

# From API
df = extract_from_api('users', params={'status': 'active'})

# From Database
df = extract_from_database('SELECT * FROM sales WHERE date > 2024-01-01')

# From File
df = extract_from_file(Path('data/raw/data.csv'), 'csv')
```

### Transform Data
```python
from data.transform import clean_data, handle_missing_values, transform_dates

df = clean_data(df)
df = handle_missing_values(df, strategy='median')
df = transform_dates(df, 'date_column')
```

### Analyze
```python
# Group and aggregate
result = df.groupby('category')['value'].agg(['sum', 'mean', 'count'])

# Visualize
import matplotlib.pyplot as plt
df.plot(x='date', y='value')
plt.show()
```
