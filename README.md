This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Baza danych (MySQL)

Skopiuj `.env.example` → `.env.local` i uzupełnij dane MySQL + 32-znakowy `NEXTAUTH_SECRET`.

> **Wymóg jednorazowy:** `sql/logic.sql` tworzy funkcje i procedury składowane. Przy włączonym binary logu MySQL wymaga do tego uprawnienia, którego konto aplikacyjne (`caruser`) nie ma. Ustaw raz globalnie (przetrwa restart serwera dzięki `SET PERSIST`):
>
> ```bash
> mysql -u root -p -e "SET PERSIST log_bin_trust_function_creators = 1;"
> ```
>
> W przeciwnym razie `pnpm db:reset` przerwie z błędem `ERROR 1419 (HY000) ... SUPER privilege`.

```bash
pnpm db:reset   # tabele → dane → logika (procedury, triggery, widoki, event)
pnpm db:logic   # przeładuj samą logikę (bezpieczne, używa DROP/CREATE OR REPLACE)
```

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
