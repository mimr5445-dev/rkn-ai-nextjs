import { generateChatResponse } from './lib/llm-provider';

async function integrationTest() {
  const messages = [
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi, how can I help you?' }
  ];
  const modelName = 'gemini-1.5-flash';
  try {
    const result = await generateChatResponse({
      messages,
      modelName,
      agentId: undefined,
      temperature: 0.7
    });
    console.log('Integration Test Successful:', result);
  } catch (error) {
    console.error('Integration Test Failed:', error);
  }
}

integrationTest();