# دليل نشر RKN.AI

## 1) متغيرات البيئة

على Vercel أضف المتغير التالي من لوحة التحكم:

```bash
GEMINI_API_KEY=your_real_gemini_api_key
```

> لا تضف المفتاح داخل الكود ولا تدفع ملف `.env.local` إلى GitHub.

## 2) رفع المشروع إلى GitHub

```bash
cd rkn-ai
git remote add origin https://github.com/<USERNAME>/rkn-ai.git
git push -u origin main
```

## 3) النشر على Vercel من الواجهة

1. افتح Vercel Dashboard.
2. اختر Add New Project.
3. اختر مستودع `rkn-ai` من GitHub.
4. Framework Preset: Next.js.
5. أضف Environment Variable باسم `GEMINI_API_KEY`.
6. اضغط Deploy.

## 4) النشر عبر Vercel CLI

```bash
npm i -g vercel
cd rkn-ai
vercel login
vercel env add GEMINI_API_KEY production
vercel --prod
```

## 5) أوامر التحقق المحلية

```bash
npm install
npm run type-check
npm run lint
npm run build
npm run dev
```
