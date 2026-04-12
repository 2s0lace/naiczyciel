This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
ADMIN_EMAIL_ALLOWLIST=
```

Notes:
- `OPENAI_API_KEY` is used only on the server (API route for quiz feedback).
- Do not expose `OPENAI_API_KEY` in frontend code.
- `ADMIN_EMAIL_ALLOWLIST` is optional (comma-separated emails). It can force admin access by email.

