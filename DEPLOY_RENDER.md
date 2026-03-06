# Deploy SmartAI Todo on Render - Complete Guide

## Prerequisites
- GitHub account
- MongoDB Atlas account (free tier)

---

## Phase 1: Push to GitHub

1. Initialize git in your project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new GitHub repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/smartai-todo.git
   git branch -M main
   git push -u origin main
   ```

---

## Phase 2: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new project named "smartai-todo"
4. Build a free cluster (选择 M0 Free Tier)
5. Create a database user:
   - Username: `smartai`
   - Password: `SmartAI2024!` (记住这个密码)
6. Network Access: Allow All IP Addresses (0.0.0.0/0)
7. Get Connection String:
   - Click "Connect" → "Connect your application"
   - Copy the string: `mongodb+srv://smartai:SmartAI2024!@cluster0.xxxxx.mongodb.net/smartai-todo`

---

## Phase 3: Deploy Backend (Web Service)

### IMPORTANT: Deploy as "Web Service" NOT "Static Site"

### Render Dashboard Settings:

| Field | Value |
|-------|-------|
| **Name** | `smartai-todo-server` |
| **Root Directory** | `server` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

### Environment Variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://smartai:SmartAI2024!@cluster0.xxxxx.mongodb.net/smartai-todo` |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://smartai-todo-client.onrender.com` |
| `PORT` | (Render will auto-assign, use `10000`) |

### Steps:
1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Fill in the settings above
5. Click "Create Web Service"
6. Wait for deployment (2-5 minutes)
7. Copy your backend URL: `https://smartai-todo-server.onrender.com`

---

## Phase 4: Deploy Frontend (Static Site)

### Render Dashboard Settings:

| Field | Value |
|-------|-------|
| **Name** | `smartai-todo-client` |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Publish directory** | `dist` |

### Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://smartai-todo-server.onrender.com` |

### Steps:
1. In Render dashboard, click "New" → "Static Site"
2. Connect your GitHub repository
3. Fill in the settings above
4. Click "Create Static Site"
5. Wait for deployment (2-5 minutes)

---

## Phase 5: Update Client API Configuration

Before deploying, update these files:

### 1. Update `client/src/context/TaskContext.jsx`

Find all `http://localhost:5000` and replace with:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### 2. Update `client/src/context/AuthContext.jsx`

Same change - use environment variable for API URL.

### 3. Update `client/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    proxy: {
      '/api': {
        target: import.meta.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        changeOrigin: true
      }
    }
  }
});
```

---

## Phase 6: Update Server CORS (Already Done ✓)

The server.js has been updated to use `CLIENT_URL` environment variable:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
```

---

## Phase 7: Rebuild & Deploy

1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Configure for production deployment"
   git push origin main
   ```

2. Both services will auto-deploy

---

## Final URLs

- **Frontend**: `https://smartai-todo-client.onrender.com`
- **Backend API**: `https://smartai-todo-server.onrender.com`

---

## Troubleshooting

### If CORS errors:
- Ensure `CLIENT_URL` is set correctly in backend environment variables
- Check that the frontend's `VITE_API_URL` points to the correct backend URL

### If MongoDB connection fails:
- Verify the `MONGODB_URI` is correct
- Ensure Network Access allows all IPs (0.0.0.0/0)

### If API calls fail:
- Check browser console for errors
- Verify the backend is running (visit `/api/health` endpoint)

