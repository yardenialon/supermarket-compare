name: Update Prices Daily

on:
  schedule:
    # Run every day at 4:00 AM Israel time (1:00 AM UTC)
    - cron: '0 1 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  update-prices:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install kaggle psycopg2-binary

      - name: Download and update prices
        env:
          KAGGLE_API_TOKEN: ${{ secrets.KAGGLE_API_TOKEN }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: python scripts/update_prices.py
