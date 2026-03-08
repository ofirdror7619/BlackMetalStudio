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

## BlackMetalTTS model testing

To test with a specific training snapshot (for example `training_snapshot_20260308_210312`), create `.env.local` in this project and set:

```bash
BLACKMETAL_TTS_ROOT=C:/Github/ofir/BlackMetalTTS
BLACKMETAL_TRAINING_DIR=C:/Github/ofir/BlackMetalTTS/training_snapshot_20260308_210312
```

Optional overrides:

```bash
# Direct file overrides (if you want to bypass auto-detection)
RVC_MODEL_PATH=C:/Github/ofir/BlackMetalTTS/training_snapshot_20260308_210312/weights/your_model.pth
RVC_INDEX_PATH=C:/Github/ofir/BlackMetalTTS/training_snapshot_20260308_210312/logs_blackmetal/your_model.index

# Python used to run rvc_auto.py
BLACKMETAL_TTS_PYTHON=C:/Path/To/python.exe
```

Then run `npm run dev` and generate from the UI. The API route `pages/api/generate.ts` now supports both `training_backup_*` and `training_snapshot_*` auto-detection.
