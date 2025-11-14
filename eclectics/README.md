This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Web Push Notifications

This app supports Web Push notifications to remind users 30 minutes before a scheduled event.

1) Install dependencies

```bash
cd eclectics
pnpm install # or npm install / yarn
```

2) Generate VAPID keys (one-time)

```bash
node -e "const w=require('web-push');const k=w.generateVAPIDKeys();console.log(k)"
```

3) Configure environment variables in `.env`

```
VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY
VAPID_SUBJECT=mailto:you@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

4) Run migration for push tables

```bash
node scripts/run_migration_0005.js
```

5) Schedule dispatch (production)

Set up a cron to POST `https://your-domain/api/push/dispatch` every 5 minutes (Vercel Cron or any scheduler). Locally you can trigger manually:

```bash
curl -X POST http://localhost:3000/api/push/dispatch
```

6) Enable notifications (user)

- After logging in, click "Enable Notifications" in the header to subscribe.

