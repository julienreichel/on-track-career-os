#!/bin/bash

# Cleanup Amplify Sandbox Script
# This script deletes the Amplify sandbox backend deployed for CI/CD testing
# Run this manually when you want to tear down the test backend

set -e

echo "🧹 Cleaning up Amplify sandbox..."
echo ""

# Check if AWS credentials are configured
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "❌ Error: AWS credentials not configured"
  echo "Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
  exit 1
fi

# Delete the sandbox
echo "Deleting Amplify sandbox..."
npx ampx sandbox delete --yes

echo ""
echo "✅ Amplify sandbox cleaned up successfully!"
echo ""
echo "Note: The sandbox will be recreated on the next CI run."
