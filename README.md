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

## Email

The contact form at `/contact` sends through [Resend](https://resend.com).
Copy `.env.example` to `.env.local` and set `RESEND_API_KEY`; the same key has
to be set in the hosting provider's environment for a deployment.

The form is on the page whether or not a key is set. Without one it still
renders and still validates — the send is refused, the visitor is given the
address, they keep what they typed, and the server logs the missing key. Add
the key, redeploy, and it sends. No code change either way.

Two things are needed before it can actually deliver, and neither is code:

1. A **mailbox that receives** at the address in `lib/contact.ts`. Resend sends
   mail; it does not host inboxes.
2. The **sending domain verified** in the Resend account (DKIM/SPF records in
   DNS). Resend rejects any `From` on an unverified domain, so a valid key on
   its own is not enough. `RESEND_FROM_EMAIL` can point at a sender that is
   verified in the meantime.

`lib/email.ts` is the whole mail layer. Anything else that needs to send — the
order confirmation, once Stripe checkout exists — should call `sendEmail` there
rather than construct its own client.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
