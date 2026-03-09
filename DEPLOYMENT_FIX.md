# Authentication Fix - Deployment Guide

## Issues Fixed

### 1. **Hardcoded Localhost URLs in Frontend**
**Problem:** `auth.api.ts` had hardcoded `http://localhost:5000/api` instead of using environment variables.
**Fix:** Changed to use centralized `axios.ts` instance that reads from `VITE_API_URL` environment variable.

### 2. **Inconsistent API Base URLs**
**Problem:** Different `.env` files had different formats:
- `frontend/src/.env`: `http://localhost:5000` (missing `/api`)
- `frontend/.env`: `https://pro-connect-qt7j.onrender.com/api` (has `/api`)

**Fix:** Standardized both to include `/api` suffix.

### 3. **Redundant Authorization Headers**
**Problem:** API functions manually added `Authorization` headers even though axios interceptor already handles it.
**Fix:** Removed manual headers from `auth.api.ts` and `post.api.ts`.

### 4. **Backend Port Hardcoded**
**Problem:** `server.js` used hardcoded port 5000, which doesn't work on platforms like Render/Heroku.
**Fix:** Changed to `process.env.PORT || 5000`.

### 5. **Missing CORS Methods**
**Problem:** CORS didn't include `PATCH` and `OPTIONS` methods.
**Fix:** Added to allowed methods array.

---

## Why It Works Locally But Fails in Production

### 1. **Environment Variables Not Set**
- Localhost: Uses `frontend/src/.env` automatically
- Production: Vercel/Render need environment variables configured in their dashboard

### 2. **CORS Issues**
- Localhost: Same origin or permissive CORS
- Production: Strict CORS - frontend domain must match backend's allowed origins

### 3. **MongoDB Connection**
- Localhost: Uses local MongoDB (`mongodb://127.0.0.1:27017`)
- Production: Needs MongoDB Atlas connection string

### 4. **HTTPS vs HTTP**
- Localhost: HTTP works fine
- Production: Mixed content blocked (HTTPS frontend → HTTP backend)

---

## Deployment Checklist

### Backend (Render/Railway/Heroku)

1. **Set Environment Variables:**
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/careertrack
   JWT_SECRET=<strong-random-secret>
   ```

2. **Verify CORS Origins:**
   - Ensure `https://pro-connect.vercel.app` is in the CORS origin array
   - Backend URL should be HTTPS (e.g., `https://pro-connect-qt7j.onrender.com`)

3. **MongoDB Atlas Setup:**
   - Create cluster on MongoDB Atlas
   - Whitelist IP: `0.0.0.0/0` (allow all) or specific IPs
   - Get connection string and add to `MONGO_URI`

### Frontend (Vercel)

1. **Set Environment Variable:**
   ```
   VITE_API_URL=https://pro-connect-qt7j.onrender.com/api
   ```
   ⚠️ **Important:** Add this in Vercel dashboard → Settings → Environment Variables

2. **Redeploy After Setting Variables:**
   - Environment variables only apply to new builds
   - Trigger a new deployment after adding variables

---

## Testing

### Local Testing:
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

### Production Testing:
1. Open browser DevTools → Network tab
2. Try login/signup
3. Check:
   - Request URL matches production backend
   - Response has CORS headers
   - Authorization header is sent with token

---

## Common Errors & Solutions

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution:** Verify frontend URL is in backend CORS origins array.

### Error: "Network Error" or "Failed to fetch"
**Solution:** Check `VITE_API_URL` is set correctly in Vercel environment variables.

### Error: "MongooseServerSelectionError"
**Solution:** 
- Check MongoDB Atlas connection string
- Verify IP whitelist includes `0.0.0.0/0`
- Ensure database user has correct permissions

### Error: "401 Unauthorized"
**Solution:** 
- Check JWT_SECRET is same on backend
- Verify token is stored in localStorage
- Check axios interceptor is adding Authorization header

---

## File Changes Summary

### Frontend:
- ✅ `src/api/auth.api.ts` - Use centralized axios instance
- ✅ `src/api/post.api.ts` - Remove redundant headers
- ✅ `src/.env` - Add `/api` suffix to URL

### Backend:
- ✅ `server.js` - Dynamic PORT, add PATCH/OPTIONS to CORS
- ✅ `.env.example` - Template for production config

---

## Next Steps

1. **Update Backend .env for Production:**
   - Get MongoDB Atlas connection string
   - Generate strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

2. **Configure Vercel Environment Variables:**
   - Go to Vercel dashboard
   - Add `VITE_API_URL` with production backend URL

3. **Redeploy Both Services:**
   - Backend: Push to GitHub (auto-deploys on Render)
   - Frontend: Redeploy on Vercel after setting env vars

4. **Test Authentication Flow:**
   - Register new user
   - Login
   - Access protected routes
   - Verify token persistence
