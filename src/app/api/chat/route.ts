import { NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini';
import type { ChatRequest } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'الرسائل مطلوبة.' }, { status: 400 });
    }

    const response = await generateChatResponse({
      messages: body.messages,
      agentId: body.agentId,
      temperature: body.temperature
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
    const status = message.includes('GEMINI_API_KEY') ? 500 : 502;
    return NextResponse.json(
      {
        error: 'تعذر الحصول على رد من Gemini.',
        details: message
      },
      { status }
    );
  }
}
