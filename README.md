# Meme Media
Social media website for meme content.

Demo video: https://www.youtube.com/watch?v=0up5FLFPYLI

## Local development

### Backend
```bash
cd backend
cp .env.example .env   # if needed
npm install
npm run dev            # nodemon
# or: npm start        # node app.js
```

Backend defaults to `http://localhost:1111`.

### Frontend
```bash
cd frontend
cp .env.example .env   # sets VITE_API_URL=http://localhost:1111
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173`.

### Health check
`GET /health` returns whether sessions are memory/Redis and uploads are local/S3.

## Deployment-ready environment variables

### Backend (`backend/.env`)
| Variable | Purpose |
|---|---|
| `PORT` | API port (default `1111`) |
| `NODE_ENV` | `production` enables secure cookies |
| `SESSION_SECRET` | Session signing secret |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `MYSQL_HOST` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DATABASE` | Database connection (use RDS in AWS) |
| `REDIS_URL` | Optional. Enables shared Redis sessions |
| `AWS_S3_BUCKET` | Optional. Enables S3 uploads instead of local `assets/` |
| `AWS_REGION` | S3 region |
| `AWS_S3_PUBLIC_BASE_URL` | Optional public/CloudFront base URL for uploaded files |

AWS credentials for S3: use an EC2/IAM role in production, or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` locally.

### Frontend (`frontend/.env` or host build env)
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Public backend URL, e.g. `https://api.example.com` |

Build frontend with:
```bash
cd frontend
npm run build
```
Serve the `dist/` folder (S3+CloudFront, Nginx, etc.).

## Suggested first AWS deploy path
1. Create RDS MySQL and set `MYSQL_*`
2. Deploy backend on EC2 with `NODE_ENV=production`, `CORS_ORIGINS`, `SESSION_SECRET`
3. Build frontend with `VITE_API_URL` pointing at your API
4. Add S3 (`AWS_S3_BUCKET`) for uploads
5. Later: add `REDIS_URL` when you run more than one app server
