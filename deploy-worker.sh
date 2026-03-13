#!/bin/bash
# Run this once to deploy the Cloudflare Worker proxy
# Requirements: Node.js installed, Cloudflare account (free)

echo "Installing Wrangler..."
npm install -g wrangler

echo "Logging into Cloudflare..."
npx wrangler login

echo "Deploying worker..."
npx wrangler deploy worker.js

echo ""
echo "Now set the Base44 token secret:"
echo "npx wrangler secret put BASE44_TOKEN"
echo "(paste the token when prompted)"
echo ""
echo "Your worker URL will be shown above — copy it and update index.html"
