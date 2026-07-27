# Use slim Python 3.11 base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Set working directory
WORKDIR /app

# Copy requirements file first for layer caching
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Crucially install Playwright Chromium browser and all required OS system dependencies
RUN playwright install chromium --with-deps

# Copy application source code
COPY . .

# Expose Streamlit default port
EXPOSE 8501

# Entry point command to start Streamlit server
CMD ["streamlit", "run", "ui/app.py", "--server.address=0.0.0.0"]
