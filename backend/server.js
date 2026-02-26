import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool, { initDb } from './db.js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

let openai = null;
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
  if (topScore >= 20) return 'High';
  if (topScore >= 8) return 'Medium';
  if (topScore >= 3) return 'Low';
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

// --- AI CHAT ROUTE (RAG over notes) ---

app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message, folderId, contextNotes = [] } = req.body || {};

    if (!message || !folderId) {
      return res.status(400).json({ error: 'message and folderId are required' });
    }

    const notesRes = await pool.query(
      'SELECT id, title, content FROM notes WHERE user_id = $1 AND folder_id = $2',
      [userId, folderId]
    );
    const notes = notesRes.rows || [];

    const contextText = notes.map(note => `Note Title: ${note.title || 'Untitled'}\nContent: ${note.content || ''}`).join('\n\n---\n\n');

    // Convert historical messages to OpenAI format (max 10 recent messages to save context)
    const historyMessages = contextNotes.slice(-10).map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    }));

    if (!openai) {
      return res.json({ reply: 'I cannot answer right now. Please add your `OPENAI_API_KEY` to the `backend/.env` file and restart the server.' });
    }

    const systemPrompt = `You are a helpful study assistant. 
You must ONLY answer based on the user's notes provided below.
If the answer is NOT explicitly present in the notes, you MUST say: "Note found in your notes for this Subject." and nothing else. DO NOT use your general knowledge.

Please format your response beautifully using Markdown (e.g. use bolding, bullet points, numbered lists, and headers where appropriate) so it is easy to read.

--- USER'S NOTES FOR CURRENT SUBJECT ---
${contextText || "No notes available in this subject."}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for speed and high reasoning capability
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message }
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('AI Error (RAG chat):', err);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

// --- STUDY MODE ROUTE (MCQs + short answers from notes) ---

app.post('/api/study', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folderId } = req.body || {};

    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    const notesRes = await pool.query(
      'SELECT id, title, content FROM notes WHERE user_id = $1 AND folder_id = $2',
      [userId, folderId]
    );
    const notes = notesRes.rows || [];

    if (!notes.length) {
      return res.json({
        mcqs: [],
        shortAnswers: [],
        message: 'Not found in your notes for this Subject.'
      });
    }

    const chunks = [];
    for (const note of notes) {
      const baseText = `${note.title || 'Untitled Note'}\n\n${note.content || ''}`;
      const noteChunks = chunkText(baseText);
      noteChunks.forEach((text, idx) => {
        chunks.push({
          noteId: note.id,
          title: note.title || 'Untitled Note',
          chunkIndex: idx + 1,
          text
        });
      });
    }

    if (!chunks.length) {
      return res.json({
        mcqs: [],
        shortAnswers: [],
        message: 'Not found in your notes for this Subject.'
      });
    }

    const poolChunks = chunks.slice(0, 20);

    const snippetPreview = (text, maxLen = 200) => {
      if (!text) return '';
      return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
    };

    const mcqs = poolChunks.slice(0, 5).map((chunk, idx) => {
      const preview = snippetPreview(chunk.text);
      const question = `According to your notes (note "${chunk.title}"), which option best reflects the idea expressed in this excerpt?\n\n"${preview}"`;

      const options = [
        'A. A statement that is consistent with this excerpt from your notes.',
        'B. An idea that is unrelated to this excerpt.',
        'C. A claim that contradicts this excerpt.',
        'D. A topic that is not covered in your notes.'
      ];

      const correctOption = 'A';
      const explanation =
        `Option A is correct because it is defined to align with the provided excerpt from your notes.\n\n` +
        `Supporting excerpt (note "${chunk.title}", chunk ${chunk.chunkIndex}):\n${preview}`;

      return {
        id: `mcq-${idx + 1}`,
        question,
        options,
        correctOption,
        explanation,
        citations: [
          {
            fileName: chunk.title,
            reference: `chunk ${chunk.chunkIndex}`
          }
        ]
      };
    });

    const shortAnswers = poolChunks.slice(5, 8).map((chunk, idx) => {
      const preview = snippetPreview(chunk.text);
      const question = `Summarize the key idea from this excerpt (note "${chunk.title}") in your own words:\n\n"${preview}"`;
      const modelAnswer =
        `A good answer will capture the main idea expressed in the excerpt.\n\n` +
        `Supporting excerpt (note "${chunk.title}", chunk ${chunk.chunkIndex}):\n${preview}`;

      return {
        id: `sa-${idx + 1}`,
        question,
        modelAnswer,
        citations: [
          {
            fileName: chunk.title,
            reference: `chunk ${chunk.chunkIndex}`
          }
        ]
      };
    });

    res.json({
      mcqs,
      shortAnswers
    });
  } catch (err) {
    console.error('Study mode error:', err);
    res.status(500).json({ error: 'Failed to generate study mode from notes' });
  }
});
