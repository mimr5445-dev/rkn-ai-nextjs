import { NextResponse } from 'next/server';
import { agents } from '@/lib/agents';
import { generateChatResponse } from '@/lib/gemini';
import type { AgentId, Message } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SwarmRequest = {
  prompt: string;
  agentIds?: AgentId[];
  temperature?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SwarmRequest;
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: 'prompt مطلوب.' }, { status: 400 });
    }

    const selectedIds = (body.agentIds?.length ? body.agentIds : ['developer', 'analyst', 'creative']) as AgentId[];
    const selectedAgents = agents.filter((agent) => selectedIds.includes(agent.id)).slice(0, 4);

    const agentResults = await Promise.all(
      selectedAgents.map(async (agent) => {
        const messages: Pick<Message, 'role' | 'content'>[] = [
          {
            role: 'user',
            content: `حلّل الطلب التالي من زاوية تخصصك (${agent.name}) وقدّم نقاطًا مركزة:\n\n${prompt}`
          }
        ];
        const result = await generateChatResponse({ messages, agentId: agent.id, temperature: body.temperature ?? 0.55 });
        return { agent: agent.name, output: result.message };
      })
    );

    const synthesisPrompt = `لديك نتائج وكلاء متعددين حول الطلب التالي:\n\n${prompt}\n\n${agentResults
      .map((item) => `## ${item.agent}\n${item.output}`)
      .join('\n\n')}\n\nاكتب إجابة نهائية موحدة بالعربية، عملية ومنظمة، تجمع أفضل الرؤى دون تكرار.`;

    const final = await generateChatResponse({
      messages: [{ role: 'user', content: synthesisPrompt }],
      agentId: 'general',
      temperature: body.temperature ?? 0.5
    });

    return NextResponse.json({
      message: final.message,
      agents: agentResults,
      model: final.model
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
    return NextResponse.json({ error: 'فشل تنسيق السرب.', details: message }, { status: 502 });
  }
}
