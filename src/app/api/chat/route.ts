import { NextResponse } from 'next/server';
import { createGeminiStream, generateChatResponse } from '@/lib/gemini';
import type { ChatRequest } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'الرسائل مطلوبة.' }, { status: 400 });
    }

    if (body.stream) {
      const stream = await createGeminiStream({
        messages: body.messages,
        agentId: body.agentId,
        temperature: body.temperature
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive'
        }
      });
    }

    const response = await generateChatResponse({
      messages: body.messages,
      agentId: body.agentId,
      temperature: body.temperature
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
    const status = message.includes('GEMINI_API_KEY') ? 500 : message.includes('API key') ? 401 : 502;

    return NextResponse.json(
      {
        error: 'تعذر الحصول على رد من Gemini.',
        details: message
      },
      { status }
    );
  }
}
