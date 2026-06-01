import { NextResponse } from 'next/server';
import { agents } from '@/lib/agents';
import { generateChatResponse } from '@/lib/gemini';
import type { AgentId, ChatRequest } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ agents });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest & { agentId: AgentId };
    if (!body.agentId) {
      return NextResponse.json({ error: 'agentId مطلوب.' }, { status: 400 });
    }
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
    return NextResponse.json({ error: 'تعذر تشغيل الوكيل.', details: message }, { status: 502 });
  }
}
