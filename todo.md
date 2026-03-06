# TODO: Deploy SmartAI Todo on Render

## Phase 1: Push to GitHub
- [x] Initialize git: `git init`
- [x] Create GitHub repository
- [x] Push code: `git remote add origin <repo-url> && git push -u origin main`

## Phase 2: MongoDB Atlas Setup
- [ ] Create free cluster at https://www.mongodb.com/atlas
- [ ] Create database user: `smartai` / `SmartAI2024!`
- [ ] Network Access: Allow All IP (0.0.0.0/0)
- [ ] Get connection string: `mongodb+srv://smartai:SmartAI2024!@cluster0.xxxxx.mongodb.net/smartai-todo`

## Phase 3: Deploy Backend (Web Service)
| Field | Value |
|-------|-------|
| Name | `smartai-todo-server` |
| Root Directory | `server` |
| Build Command | (empty) |
| Start Command | `node server.js` |

**Environment Variables:**
| Variable | Value |
|----------|-------|
| MONGODB_URI | `mongodb+srv://smartai:SmartAI2024!@cluster0.xxxxx.mongodb.net/smartai-todo` |
| JWT_SECRET | `your-super-secret-jwt-key-change-this` |
| NODE_ENV | `production` |
| CLIENT_URL | `https://smartai-todo-client.onrender.com` |
| PORT | `10000` |

## Phase 4: Deploy Frontend (Static Site)
| Field | Value |
|-------|-------|
| Name | `smartai-todo-client` |
| Root Directory | `client` |
| Build Command | `npm run build` |
| Publish directory | `dist` |

**Environment Variables:**
| Variable | Value |
|----------|-------|
| VITE_API_URL | `https://smartai-todo-server.onrender.com` |

## Phase 5: Update Client Code (DONE ✓)
- [x] Update `client/src/context/TaskContext.jsx` - Use `import.meta.env.VITE_API_URL`
- [x] Update `client/src/context/AuthContext.jsx` - Use `import.meta.env.VITE_API_URL`
- [x] Update `server/server.js` - CORS configured for production

## Phase 6: Final Deploy
- [ ] Commit changes: `git add . && git commit -m "Configure for production"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Wait for auto-deployment

## Final URLs
- Frontend: `https://smartai-todo-client.onrender.com`
- Backend: `https://smartai-todo-server.onrender.com`

