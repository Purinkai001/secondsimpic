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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Architecture Rules

- `app/`: Next.js route entrypoints only (`page.tsx`, `layout.tsx`, `route.ts`). Keep these files thin and composition-focused.
- `components/`: UI grouped by domain (`components/admin`, `components/game`, `components/landing`, `components/ui`).
- `lib/`: domain/business logic grouped by area:
  - `lib/admin/{hooks,services,types}`
  - `lib/game/{hooks,services,types}`
  - `lib/questions/{services,types}`
  - `lib/challenges/{services,types}`
  - `lib/shared/{api,firebase,constants,hooks}`
- `utils/`: generic non-domain helpers (`formatters`, `validators`, `time`, `misc`).

### Import boundaries

- `app/*` may import from `components/*`, `lib/*`, `utils/*`.
- `components/*` may import from `lib/*`, `utils/*`.
- `lib/*` may import from `utils/*`.
- Non-route code must not import from `app/*`.
