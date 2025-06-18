#!/bin/bash

# Create necessary directories
mkdir -p src/data

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment and install Python dependencies
source venv/bin/activate && pip install -r scripts/requirements.txt

# Extract questions from PDF
source venv/bin/activate && python scripts/extract_questions.py

# Install Node.js dependencies
npm install

# Start the development server
npm start 