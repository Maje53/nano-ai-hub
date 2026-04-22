import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Soru boş olamaz' });
    }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
    });

    const answer = message.content[0].text;

    res.json({
      answer,
      tokens: message.usage.input_tokens + message.usage.output_tokens,
    });

  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
}