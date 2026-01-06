#!/bin/bash
# Try to get GitHub token from environment
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ GitHub token found in environment"
    echo "$GITHUB_TOKEN" | gh auth login --with-token
    gh auth status
else
    echo "❌ No GitHub token in environment"
    echo "Please authenticate manually with: gh auth login"
fi
