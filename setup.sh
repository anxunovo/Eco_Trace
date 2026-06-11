#!/bin/bash
# Jules Environment Setup Script
# Runs after repo is cloned to /app
set -e

# Install Node.js dependencies only if package.json exists
if [ -f "package.json" ]; then
  npm install
fi

# Also install if tasks/01 already created it
if [ -f "netlify/functions/package.json" ]; then
  cd netlify/functions && npm install && cd -
fi

echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "Setup complete."
