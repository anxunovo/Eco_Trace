# Deployment Guide

## Prerequisites
- Netlify account
- Turso account
- ZhipuAI API Key

## Deployment Steps
1. Connect your GitHub repository to Netlify.
2. Set the following environment variables in the Netlify dashboard:
   - \`TURSO_DATABASE_URL\`
   - \`TURSO_AUTH_TOKEN\`
   - \`ZHIPUAI_API_KEY\`
3. Verify the deployment settings (should be read automatically from \`netlify.toml\`):
   - **Build command**: \`echo 'No build step needed'\`
   - **Publish directory**: \`new-site/public\`
   - **Functions directory**: \`netlify/functions\`
4. The first deployment will automatically run on push to the repository.
