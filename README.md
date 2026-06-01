# RKN.AI

تطبيق محادثة ذكاء اصطناعي احترافي باللغة العربية مبني بـ Next.js 14 و Gemini API.

## التشغيل المحلي

```bash
npm install
cp .env.example .env.local
# ضع مفتاح Gemini داخل .env.local
npm run dev
```

## متغيرات البيئة على Vercel

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

كل طلبات Gemini تتم من خلال API Routes server-side فقط ولا يتم كشف المفتاح للمتصفح.
