FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy and make entrypoint scripts executable
COPY entrypoint.sh /entrypoint.sh
COPY entrypoint_with_merge.sh /entrypoint_with_merge.sh
RUN chmod +x /entrypoint.sh /entrypoint_with_merge.sh

# Expose port
EXPOSE 8000

# Set entrypoint (use the auto-merge version)
ENTRYPOINT ["/entrypoint_with_merge.sh"]

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
