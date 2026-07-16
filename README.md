# Paper Rebrand Dashboard Web

Separate Vercel-ready frontend for the VuRebrander paper debug workflows.

## Backend dependency

This app expects the VuRebrander backend to expose these endpoints:

- `POST /paper-debug/run`
- `POST /paper-debug/rerun`
- `POST /paper-debug/classify-license-plate`
- `POST /paper-debug/hide-license-plate`
- `POST /paper-debug/workflow`

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set:

- `BACKEND_BASE_URL`
- `BACKEND_API_KEY`

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Import this folder as a separate Vercel project.
2. Set the project root to `paper-rebrand-dashboard-web` if importing from a larger repo.
3. Add `BACKEND_BASE_URL` and `BACKEND_API_KEY` in Vercel project env vars.
4. Deploy.

## Backend curl examples

Replace `YOUR_BACKEND`, `YOUR_API_KEY`, and file paths as needed.

### Run paper workflow

```bash
curl -X POST "YOUR_BACKEND/paper-debug/run" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "image=@/path/to/paper.jpg"
```

### Rerun with manual OCR texts

```bash
curl -X POST "YOUR_BACKEND/paper-debug/rerun" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "image=@/path/to/paper.jpg" \
  -F $'manual_texts=SO MAY\nBIEN SO\nSO KHUNG'
```

### Classify license plate color

```bash
curl -X POST "YOUR_BACKEND/paper-debug/classify-license-plate" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "image=@/path/to/car.jpg"
```

### Visualize hide license plate workflow

```bash
curl -X POST "YOUR_BACKEND/paper-debug/hide-license-plate" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "image=@/path/to/car-or-paper.jpg"
```

### Check workflow state by car id

```bash
curl -X POST "YOUR_BACKEND/paper-debug/workflow" \
  -H "x-api-key: YOUR_API_KEY" \
  -F "car_id=d37ad6c9-f852-4242-9d7e-ae1b5fae0c2a"
```
