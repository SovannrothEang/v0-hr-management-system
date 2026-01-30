# Environment Setup Guide

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env.development
   ```

2. Update the API URL if needed:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for API requests | `http://localhost:3001/api` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_SWAGGER_URL` | API documentation URL | `http://localhost:3001/api/swagger` |

## Environment-Specific Setup

### Development

Create `.env.development`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

### Staging

Create `.env.staging`:
```env
NEXT_PUBLIC_API_BASE_URL=https://staging-api.hrflow.com/api
```

### Production

Create `.env.production`:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.hrflow.com/api
```

## Troubleshooting

### API URL Not Working

1. Verify the environment file exists in the project root
2. Check that the variable name is correct (case-sensitive)
3. Restart the development server after changing environment variables
4. Check browser console for CORS errors

### CORS Issues

If you encounter CORS errors:
- Ensure the external API server is configured to accept requests from your frontend domain
- Check that the API URL is correct (no trailing slashes)
- Verify the API server is running and accessible

### Environment Variables Not Loading

1. Ensure you're using the `NEXT_PUBLIC_` prefix for browser-accessible variables
2. Restart the Next.js development server
3. Check that the environment file is in the project root directory
4. Verify the file name is correct (`.env.development`, not `.env.development.local`)

## Security Notes

- Never commit `.env` files to version control
- Use `.env.example` to document required variables
- Keep production API keys secure (use server-side environment variables for sensitive data)
- The `NEXT_PUBLIC_` prefix makes variables accessible in the browser - only use for non-sensitive data

## Local Development with External API

### Prerequisites

- Node.js 18+ installed
- External API server running on port 3001

### Setup Steps

1. **Start the external API server:**
   ```bash
   # Navigate to the API server directory
   cd /path/to/api-server
   npm install
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   # Navigate to the frontend directory
   cd /path/to/frontend
   npm install
   npm run dev
   ```

3. **Verify the setup:**
   - Frontend should be running at `http://localhost:3000`
   - API should be running at `http://localhost:3001`
   - Check browser console for any errors

### Using Docker (Optional)

If the external API supports Docker:

```bash
# Start API with Docker
docker-compose -f docker-compose.api.yml up -d

# Start frontend
npm run dev
```

## Testing the Integration

### Manual Testing

1. **Login Test:**
   - Navigate to `http://localhost:3000/login`
   - Use test credentials: `admin@hrflow.com/admin123`
   - Verify successful login and session creation

2. **API Request Test:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Perform any action (e.g., view employees)
   - Verify requests are going to the correct API URL

3. **Environment Variable Test:**
   ```javascript
   // In browser console
   console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
   // Should output: http://localhost:3001/api
   ```

### Automated Testing

Run the test suite:
```bash
# Start dev server first
npm run dev

# In another terminal
node tests/auth.test.mjs
node tests/ui-permissions.test.mjs
```

## Common Issues

### Issue: "API requests going to wrong URL"

**Solution:** Check that:
1. `.env.development` file exists in project root
2. Variable name is exactly `NEXT_PUBLIC_API_BASE_URL`
3. Development server was restarted after creating/changing the file

### Issue: "CORS errors in browser console"

**Solution:** Ensure the external API server has proper CORS configuration:
- `Access-Control-Allow-Origin` should include `http://localhost:3000`
- `Access-Control-Allow-Credentials: true` for cookie handling
- `Access-Control-Allow-Headers` should include `X-CSRF-Token`

### Issue: "Authentication cookies not being sent"

**Solution:** Check that:
1. API and frontend are on compatible domains (same origin or proper CORS)
2. Cookies are not being blocked by browser settings
3. The external API is setting cookies with proper domain configuration

## Next Steps

After setting up the environment:

1. Review the [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for API endpoints
2. Check the [AGENTS.md](./AGENTS.md) for development guidelines
3. Run the test suite to verify everything works
4. Start implementing features using the external API

---

*Last updated: January 27, 2026*