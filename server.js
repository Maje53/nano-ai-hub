import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Soru sor
app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Soru boş olamaz' });
    }

    // Claude'a sor
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
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});