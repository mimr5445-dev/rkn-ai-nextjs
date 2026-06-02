import { NextResponse } from 'next/server';
import { createProviderStream, generateChatResponse } from '@/lib/llm-provider';
import type { ChatRequest } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.modelName || typeof body.modelName !== 'string') {
      return NextResponse.json({ error: 'modelName is required and must be a string.' }, { status: 400 });
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required and must be provided as an array.' }, { status: 400 });
    }

    if (body.stream) {
      const stream = await createProviderStream({
        messages: body.messages,
        agentId: body.agentId,
        modelName: body.modelName,
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
      modelName: body.modelName,
      temperature: body.temperature
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    const status = message.includes('API key') ? 401 : 502;

    return NextResponse.json(
      {
        error: 'Failed to get a response from the provider.',
        details: message
      },
      { status }
    );
  }
}