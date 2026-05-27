## CineVision Next.js Frontend (new)

This repo contains the original React frontend in `frontend/` and a new **Next.js + Tailwind** frontend in `frontend-next/`.

### Run (frontend)

- **Install**:

```bash
cd frontend-next
npm install
```

- **Env**:
  - Copy `frontend-next/.env.local.example` → `frontend-next/.env.local`
  - Set:
    - `NEXT_PUBLIC_API_BASE_URL` (usually `http://localhost:8080`)
    - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (your Razorpay key id)

- **Dev**:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Run (backend)

Start your existing Java microservices (or `docker compose up -d` if that’s your flow).

### Razorpay (backend keys)

The movie service reads:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

and exposes `POST /api/movie/payments/createOrder`.

