#!/bin/bash

# Setup Environment Variables for Bilingual Education Platform
# NOTE: This script is for reference/documentation only.
# The environment is already configured. Run this only if you need to recreate .env

echo "Setting up environment variables..."

# Copy the config file to .env
cp env-config.txt .env

echo "✅ Environment file created: .env"
echo ""
echo "🔐 IMPORTANT SECURITY NOTES:"
echo "1. The JWT secrets in .env are for DEVELOPMENT only"
echo "2. Generate NEW SECURE SECRETS for PRODUCTION:"
echo "   - Use: openssl rand -hex 64"
echo "   - Or: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
echo ""
echo "3. Update ALLOWED_ORIGINS for your production domain"
echo "4. Never commit .env file to version control"
echo ""
echo "🚀 Your platform is ready! Run:"
echo "   docker-compose up -d"