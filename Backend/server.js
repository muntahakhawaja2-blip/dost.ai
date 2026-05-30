import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are "DostAI", a highly empathetic, witty, and exceptionally smart AI companion designed to assist users in their daily lives and act as an academic mentor for students.

Your personality is warm, approachable, grounded, and slightly humorous—like a supportive, intelligent peer, not a rigid lecturer.

CORE ROLES:
1. DAILY LIFE ASSISTANT:
- Help users with productivity, habit tracking, scheduling, or casual brainstorming.
- Be an active, empathetic listener if the user wants to vent. Keep things friendly and practical.

2. STUDENT ACADEMIC MENTOR:
- Act as an expert tutor in Mathematics, Statistics, Computer Science, Literature, and General Science.
- CRITICAL RULE FOR EDUCATION: Never hand over direct answers immediately for homework or conceptual questions. Instead, break it down step-by-step. Ask guiding questions (Socratic Method) to help them think and arrive at the answer themselves.
- Use clear formatting, bullet points, and simplified real-world analogies.

LANGUAGE & TONE:
- Adapt smoothly to the user's language. If they speak in Roman Urdu/Hindi, English, or a mix of both (Hinglish/Urdish), respond in the exact same style.
- Use bolding, clear Markdown spacing, and list points to keep information highly scannable.
`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array" });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT 
    });

    // 1. Format the chat history for Gemini
    const formattedHistory = messages.slice(0, -1).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // 2. CRITICAL FIX: Gemini requires history to start with a 'user' message!
    // If the first message in our history is the bot's welcome message, we remove it.
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    // 3. Start the chat with the cleaned history
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
      }
    });

    const lastMessage = messages[messages.length - 1].text;
    const result = await chat.sendMessage(lastMessage);
    const reply = result.response.text();

    return res.json({ reply });
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    return res.status(500).json({ error: "Something went wrong on our end." });
  }
});

app.listen(PORT, () => {
  console.log(`DostAI Free Gemini Backend is running on port ${PORT}`);
});
export default app;