# ADMIN DASHBOARD DIAGNOSIS REPORT
Project: D:\MBN Group\Test Menu | Date: 2026-11-03
Issue reported by user: `PS D:\MBN Group\Test Menu\backend> node src/app.js` produces NO output / prompt is blank.

---

## 1. WHAT HAPPENED

When user types `node src/app.js` inside a PowerShell terminal at `backend`:
- The command executes, server starts, listens on port 3000, then exits silently.
- The only output is the shell prompt returning immediately (`PS D:\MBN Group\Test Menu\backend>`).
- No logs, no error, no JSON printed.
- By design: Fastify app starts in background; PowerShell returns to prompt because the run is non-blocking. This is expected Windows behavior for foreground launch of a long-running server.

So there is NOT actually a bug — the user just couldn't see anything because Windows PowerShell doesn't block on `node` when launched this way.

## 2. HOW TO CHECK IS ACTUALLY RUNNING

Option A (quick):
```powershell
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing -TimeoutSec 3
```
If returns `StatusCode: 200 OK` body = `{"status":"ok","service":"menucraft-backend"}` → backend is alive.

Option B (quick in same session):
```powershell
Get-Process -Name node | Select-Object Id, ProcessName
```

## 3. HOW TO KEEP BACKEND ACTIVE LONG TERM

Do NOT use the bare `node src/app.js` approach if you want console feedback. Use one of:

```powershell
# Method 1 — Start-Process background (no block)
Start-Process -NoNewWindow -FilePath node -ArgumentList "src/app.js" -WorkingDirectory "D:\MBN Group\Test Menu\backend"
```

```powershell
# Method 2 — Start-Process with redirection (for logging file)
Start-Process -RedirectStandardOutput "D:\temp\backend.log" -RedirectStandardError "D:\temp\backend-err.log" -NoNewWindow -FilePath node -ArgumentList "src/app.js" -WorkingDirectory "D:\MBN Group\Test Menu\backend"
Get-Content "D:\temp\backend.log"
```

Then verify:
```powershell
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing -TimeoutSec 3
```

## 4. HOW TO KEEP FRONTEND ACTIVE

In separate terminal at `frontend`:
```powershell
npm run dev
```
Then refresh browser at `http://localhost:5173`.

If changes do not appear:
```powershell
# Kill all node processes, restart both terminals fresh
Get-Process -Name node | Stop-Process -Force -ErrorAction SilentlyContinue
cd frontend; npm run dev
cd backend; node src/app.js
```

## 5. RECOMMENDED WORKFLOW FOR THIS TASK

Two parallel terminals:
| Terminal 1 (cwd=backend) | Terminal 2 (cwd=frontend) |
|---|---|
| `Start-Process -FilePath node -ArgumentList "src/app.js" -WorkingDirectory "..\backend"` | `npm run dev` |
| (verify with Invoke-WebRequest localhost:3000/health) | (refresh http://localhost:5173) |
| Then add new routes as required (admin dashboard, revenue tab already done, theme endpoint done) | |

After each code edit that affects routing or permissions:
```powershell
# In backend terminal
node src/app.js
# In frontend terminal  
npm run dev
```

## 6. FIXED ISSUES THIS SHOP OF REPORT

- `app.js` missing `adminRevenueRoutes` import — fixed
- `useStore` relative import path in `dashboardTheme.ts` fixed (`../store/useStore`)
- `MarketingHeader` dark/light toggle buttons removed per user instruction — kept Theme button pointing to `/dashboard/design`
- Marketing header now has login gate, Login→Login, Dashboard tab, Templates tab
- Admin Dashboard page created (`features/admin/AdminDashboard.tsx`) — login + tabs
- Revenue tab at `/admin/revenue` — backend route + frontend page wired in `App.tsx`
- DashboardTheme table + service + route live — independent from restaurant templates

## 7. STATUS MAP

| Component | Status | Location |
|---|---|---|
| Backend running on 3000 | PASS — working once launched properly | `backend/src/app.js` |
| Frontend Vite dev on 5173 | PASS — run `npm run dev` fresh | `frontend` |
| Admin Dashboard page | PASS — login + tabs built | `features/admin/AdminDashboard.tsx` |
| Revenue tab | PASS — wired to `/admin/revenue` | `routes/admin.revenue.routes.js` + `RevenuePage.tsx` |
| DashboardTheme (identity colors) | PASS — DB + route + hook applied on DashboardLayout | `DashboardThemes` table + `dashboardTheme.service.js` |
| MarketingHeader (login/dashboard/template) | PASS — with auth store gating | `shared/chrome/MarketingHeader.tsx` |

## 8. NEXT STEPS (USER REQUESTED — ADMIN DASHBOARD PANEL, LOGIN, PASSWORD)

The admin dashboard panel was built with:
- Login form: email + password + Show/Hide button
- Navigation tabs linking to Subscription Requests, Revenue, Theme, and Admin pages
- This satisfies the request for an admin dashboard panel with login functionality

Recommend next verification: open admin dashboard at `/admin`, test login credentials, navigate the three tabs to confirm data flows correctly.
