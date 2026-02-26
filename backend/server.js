import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool, { initDb } from './db.js';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import multer from 'multer';
import pdfParse from 'pdf-parse-new';

dotenv.config();

let openai = null;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || '';
const HF_STT_MODEL = process.env.HF_STT_MODEL || 'openai/whisper-large-v3-turbo';
const HF_TTS_MODEL = process.env.HF_TTS_MODEL || 'espnet/kan-bayashi_ljspeech_vits';
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (err) {
  console.log("OpenAI initialization skipped (no API key).");
}

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

// --- Simple RAG helpers adapted from demo app ---
const chunkText = (text, maxChars = 800) => {
  const chunks = [];
  if (!text) return chunks;

  const paragraphs = text.split(/\n\s*\n/);
  let current = '';

  for (const p of paragraphs) {
    const paragraph = p.trim();
    if (!paragraph) continue;
    if ((current + '\n\n' + paragraph).length <= maxChars) {
      current = current ? current + '\n\n' + paragraph : paragraph;
    } else {
      if (current) chunks.push(current);
      if (paragraph.length <= maxChars) {
        current = paragraph;
      } else {
        let start = 0;
        while (start < paragraph.length) {
          chunks.push(paragraph.slice(start, start + maxChars));
          start += maxChars;
        }
        current = '';
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
};

const tokenize = (text) =>
  (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const scoreChunk = (question, chunkTextValue) => {
  const qTokens = new Set(tokenize(question));
  const cTokens = tokenize(chunkTextValue);
  let score = 0;
  for (const t of cTokens) {
    if (qTokens.has(t)) score += 1;
  }
  return score;
};

const computeConfidence = (topScore) => {
  if (topScore >= 5) return 'High';
  if (topScore >= 2) return 'Medium';
  if (topScore >= 1) return 'Low';
  return 'Low';
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Start Server and Initialize DB
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.DATABASE_URL) {
    await initDb();
  } else {
    console.warn('DATABASE_URL is not set. Database not initialized.');
  }
});

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Username already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);

    res.status(201).json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- FOLDERS ROUTES ---

app.get('/api/folders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query('SELECT * FROM folders WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/folders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    const countResult = await pool.query('SELECT COUNT(*) FROM folders WHERE user_id = $1', [userId]);
    if (parseInt(countResult.rows[0].count, 10) >= 3) {
      return res.status(403).json({ error: 'Maximum folder limit (3) reached' });
    }

    const result = await pool.query(
      'INSERT INTO folders (user_id, name) VALUES ($1, $2) RETURNING *',
      [userId, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/folders/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const folderId = req.params.id;

    await pool.query('DELETE FROM folders WHERE id = $1 AND user_id = $2', [folderId, userId]);
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- NOTES ROUTES ---

app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folder_id, title, content } = req.body;

    const result = await pool.query(
      'INSERT INTO notes (user_id, folder_id, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, folder_id, title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;
    const { title, content } = req.body;

    const result = await pool.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [title, content, noteId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;

    await pool.query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [noteId, userId]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/notes/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folder_id } = req.body;
    const file = req.file;

    if (!file || !folder_id) {
      return res.status(400).json({ error: 'File and folder_id are required' });
    }

    let content = '';
    const title = file.originalname;

    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      content = data.text;
    } else if (file.mimetype === 'text/plain' || title.endsWith('.txt')) {
      content = file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or TXT file.' });
    }

    const result = await pool.query(
      'INSERT INTO notes (user_id, folder_id, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, folder_id, title, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// --- AI CHAT ROUTE (RAG over notes) ---

app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message, folderId, folderName, contextNotes = [] } = req.body || {};

    if (!message || !folderId) {
      return res.status(400).json({ error: 'message and folderId are required' });
    }

    const notesRes = await pool.query(
      'SELECT id, title, content FROM notes WHERE user_id = $1 AND folder_id = $2',
      [userId, folderId]
    );
    const notes = notesRes.rows || [];

    const chunks = [];
    for (const note of notes) {
      const baseText = `${note.title || 'Untitled Note'}\n\n${note.content || ''}`;
      const noteChunks = chunkText(baseText);
      noteChunks.forEach((text, idx) => {
        chunks.push({
          noteTitle: note.title || 'Untitled Note',
          chunkIndex: idx + 1,
          text
        });
      });
    }

    let topChunks = [];
    if (chunks.length > 0) {
      const scoredChunks = chunks.map(chunk => ({
        ...chunk,
        score: scoreChunk(message, chunk.text)
      }));
      scoredChunks.sort((a, b) => b.score - a.score);
      topChunks = scoredChunks.slice(0, 5);
    }

    const contextText = topChunks.map(chunk => `[Citation: ${chunk.noteTitle}, Chunk ${chunk.chunkIndex}]\n${chunk.text}`).join('\n\n---\n\n');

    // Convert historical messages to OpenAI format
    const historyMessages = contextNotes.slice(-10).map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    }));

    if (!openai) {
      return res.json({ reply: 'I cannot answer right now. Please add your `OPENAI_API_KEY` to the `backend/.env` file and restart the server.' });
    }

    const systemPrompt = `You are "AskMyNotes Teacher Mode", an AI tutor that answers strictly using the user's uploaded notes for a selected subject.

SYSTEM RULES (MANDATORY):

1) SUBJECT SCOPING
You must ONLY answer using content from:
Subject: ${folderName || "Subject"}

If the answer is not supported by the notes, respond EXACTLY with:
"Not found in your notes for ${folderName || "Subject"}"
No additional explanation is allowed in refusal cases.

2) EVIDENCE REQUIREMENT
Every answer MUST include:
- A clear explanation (teacher-like, conversational tone)
- Numbered citations [1], [2], etc.
- Direct supporting evidence snippets quoted from the notes
- A confidence score (Low / Medium / High)

3) RESPONSE FORMAT (STRICT STRUCTURE)
Return your response in this JSON format:
{
  "spoken_answer": "",
  "citations": [
    {
      "id": "",
      "evidence_snippet": ""
    }
  ],
  "confidence": ""
}

Rules:
- spoken_answer must be natural, conversational, and suitable for text-to-speech.
- Do NOT mention "according to your notes" repeatedly.
- Keep explanations clear and teacher-like.
- Do NOT include information not found in the notes.
- Citations must correspond to actual supporting snippets.
- Confidence must reflect how directly the notes support the answer.

4) MULTI-TURN CONTEXT HANDLING
You will receive recent conversation history and the current question. 
You MUST maintain conversational context and correctly interpret follow-ups (e.g., "give an example", "simplify it"). Resolve pronouns. Never drift outside the selected subject.

5) VOICE-READY OUTPUT
- Avoid markdown.
- Avoid bullet points unless necessary for clarity.
- Keep sentences clear and naturally spoken.
- Avoid overly long paragraphs (optimize for TTS clarity).

6) NO HALLUCINATIONS
If the notes partially support the answer, only answer the supported portion. If critical details are missing → refuse.

7) FOLLOW-UP BEHAVIOR
If asked to simplify, give an example, or compare, and it's in the notes, do it. Otherwise, refuse.

INPUT PROVIDED TO YOU THIS TURN:
{
  "subject": "${folderName || "Subject"}",
  "notes_context": ${JSON.stringify(contextText || "No notes available.")},
  "conversation_history": ${JSON.stringify(historyMessages.slice(-3).map(m => m.role + ': ' + m.content).join('\n'))},
  "current_question": ${JSON.stringify(message)}
}

OUTPUT ONLY VALID JSON.
DO NOT include extra commentary.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
    });

    let aiResponse;
    try {
      aiResponse = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.error("Failed to parse Teacher Mode output", e);
      aiResponse = null;
    }

    if (!aiResponse) {
      return res.json({ reply: 'Failed to generate response correctly.' });
    }

    // Handle exact refusal case where it might just dump "Not found..." inside spoken_answer
    if (aiResponse.spoken_answer && aiResponse.spoken_answer.includes(`Not found in your notes for`)) {
      return res.json({ reply: aiResponse.spoken_answer });
    }

    // Reconstruct into markdown-equivalent text for frontend display (no confidence section)
    let finalReply = aiResponse.spoken_answer || '';

    if (aiResponse.citations && aiResponse.citations.length > 0) {
      finalReply += `\n\n**Supporting Evidence:**\n`;
      aiResponse.citations.forEach((cit) => {
        finalReply += `- [${cit.id}] "${cit.evidence_snippet}"\n`;
      });
    }

    res.json({ reply: finalReply.trim() });
  } catch (err) {
    console.error('AI Error (Teacher Mode chat):', err);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

// --- STUDY MODE ROUTE (MCQs + short answers from notes) ---

app.post('/api/study', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folderId, folderName } = req.body || {};

    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'OpenAI API key not configured' });
    }

    const notesRes = await pool.query(
      'SELECT id, title, content FROM notes WHERE user_id = $1 AND folder_id = $2',
      [userId, folderId]
    );
    const notes = notesRes.rows || [];

    if (!notes.length) {
      return res.json({
        subject: folderName || "Subject",
        mcqs: [],
        short_answer_questions: [],
        references: [],
        message: 'No notes found to generate study materials.'
      });
    }

    const contextText = notes.map(note => `Note Title: ${note.title || 'Untitled'}\nContent:\n${note.content || ''}`).join('\n\n---\n\n');

    const systemPrompt = `You are a strict study material generator. 
For the subject provided below, generate structured study material based ONLY on the provided notes.
Do not fabricate facts. If the notes do not contain enough information, do your best with what is provided.

Subject:
${folderName || "Subject"}

Requirements:
1) Generate exactly 5 Multiple Choice Questions (MCQs).
   - Each MCQ must include:
     - Question
     - Four options labeled A, B, C, D
     - Correct option clearly indicated
     - A brief explanation (2–4 sentences)
     - At least one citation supporting the explanation

2) Generate exactly 3 Short-Answer Questions.
   - Each must include:
     - Question
     - Model answer (3–6 sentences)
     - At least one citation supporting the answer

3) Citations:
   - Use numbered citations like [1], [2], etc.
   - At the end, include a "References" section listing all sources in APA format.
   - Sources must be the titles of the provided notes.

4) Difficulty Level: Moderate (suitable for undergraduate level unless otherwise specified).
5) Output Format: Return the response strictly as a JSON object matching this schema exactly:

{
  "subject": "${folderName || "Subject"}",
  "mcqs": [
    {
      "question": "string",
      "options": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      },
      "correct_answer": "A",
      "explanation": "string",
      "citations": ["[1]"]
    }
  ],
  "short_answer_questions": [
    {
      "question": "string",
      "model_answer": "string",
      "citations": ["[1]"]
    }
  ],
  "references": [
    {
      "id": "[1]",
      "citation": "First Note Title"
    }
  ]
}

--- USER'S NOTES FOR CURRENT SUBJECT ---
${contextText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt }
      ],
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    res.json(aiResponse);

  } catch (err) {
    console.error('Study mode error:', err);
    res.status(500).json({ error: 'Failed to generate study mode from notes' });
  }
});

// --- GRADE SHORT ANSWER ROUTE ---
app.post('/api/grade', authenticateToken, async (req, res) => {
  try {
    const { question, userAnswer, modelAnswer } = req.body || {};

    if (!question || !userAnswer || !modelAnswer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'OpenAI API key not configured' });
    }

    const systemPrompt = `You are a strict but fair grader.
You will be given a Question, a Student's Answer, and a Model Answer.
Evaluate the Student's Answer out of 10 based on how well it matches the core concepts of the Model Answer.
Provide brief feedback (1-3 sentences) explaining the score and any missing details.

Return your response strictly as a JSON object matching this schema exactly:
{
  "score": number,
  "feedback": "string"
}`;

    const userPrompt = `Question: ${question}
Model Answer: ${modelAnswer}
Student's Answer: ${userAnswer}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    res.json(aiResponse);

  } catch (err) {
    console.error('Grading error:', err);
    res.status(500).json({ error: 'Failed to grade answer' });
  }
});

// --- HUGGING FACE SPEECH-TO-TEXT (STT) ---
app.post('/api/speech-to-text', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!HF_API_KEY) {
      return res.status(503).json({ error: 'Hugging Face API key not configured' });
    }

    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const hfRes = await fetch(`https://api-inference.huggingface.co/models/${HF_STT_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': file.mimetype || 'audio/webm'
      },
      body: file.buffer
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error('HF STT error:', hfRes.status, errText);
      return res.status(502).json({ error: 'Failed to transcribe audio' });
    }

    const data = await hfRes.json();
    let text = '';

    if (typeof data === 'string') {
      text = data;
    } else if (Array.isArray(data) && data.length && data[0].text) {
      text = data[0].text;
    } else if (data.text) {
      text = data.text;
    }

    return res.json({ text: (text || '').trim() });
  } catch (err) {
    console.error('Speech-to-text error:', err);
    res.status(500).json({ error: 'Failed to process speech-to-text' });
  }
});

// --- HUGGING FACE TEXT-TO-SPEECH (TTS) ---
app.post('/api/text-to-speech', authenticateToken, async (req, res) => {
  try {
    if (!HF_API_KEY) {
      return res.status(503).json({ error: 'Hugging Face API key not configured' });
    }

    const { text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const hfRes = await fetch(`https://api-inference.huggingface.co/models/${HF_TTS_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error('HF TTS error:', hfRes.status, errText);
      return res.status(502).json({
        error: 'Failed to generate speech audio from Hugging Face.',
        providerStatus: hfRes.status,
        providerMessage: errText
      });
    }

    const audioBuffer = await hfRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/wav');
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('Text-to-speech error:', err);
    res.status(500).json({ error: 'Failed to process text-to-speech' });
  }
});
