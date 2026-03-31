import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Trash2,
  PenTool,
  Search,
  ArrowLeft,
  Folder,
  FolderPlus,
  BookOpen,
  LogOut,
  User,
  Bot,
  X,
  Upload,
  GraduationCap,
  Mic,
  Volume2,
  Square,
  Send,
  ShieldCheck,
  BrainCircuit,
  FileText,
  ArrowRight,
  RotateCw,
  Trophy,
  AlertCircle,
  ThumbsUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';
import LandingApp from './landing/App';

interface Note {
  id: string;
  folder_id: string;
  title: string;
  content: string;
  updated_at: string;
}

interface FolderType {
  id: string;
  name: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const MAX_FOLDERS = 3;
const API_URL = 'http://localhost:5001/api';

function AuthScreen({ onLogin, onBack }: { onLogin: (token: string, username: string) => void, onBack?: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      onLogin(data.token, data.user.username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button onClick={onBack} className="icon-btn" style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="brand" style={{ justifyContent: 'center', marginBottom: '2rem', fontSize: '1.75rem' }}>
          <PenTool size={28} className="brand-icon" />
          <span>AskMyNotes</span>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Username"
            className="modal-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="modal-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>

          <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            onClick={() => window.location.href = 'http://localhost:5001/api/auth/google'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
              <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="currentColor" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="currentColor" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            className="auth-link"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
}


function MainApp({ token, username, onLogout }: { token: string, username: string, onLogout: () => void }) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false); // Teacher Mode panel
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Separate text-only Chat Bot State (no audio)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  // Study Mode State
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyData, setStudyData] = useState<any>(null);
  const [isStudyLoading, setIsStudyLoading] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({});
  const [saqAnswers, setSaqAnswers] = useState<Record<number, string>>({});
  const [saqResults, setSaqResults] = useState<Record<number, any>>({});

  // New Study Feature States
  const [gapMap, setGapMap] = useState<any[]>([]);
  const [isGapMapLoading, setIsGapMapLoading] = useState(false);
  const [vivaMessages, setVivaMessages] = useState<any[]>([]);
  const [isVivaLoading, setIsVivaLoading] = useState(false);

  const [vivaQuestionCount, setVivaQuestionCount] = useState(0);
  const [studySubMode, setStudySubMode] = useState<'menu' | 'quiz' | 'viva' | 'gap-map'>('menu');
  const [flippedFlashcards, setFlippedFlashcards] = useState<Record<number, boolean>>({});

  // Voice States (browser-based STT + TTS)
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const sttFinalRef = useRef<string>('');

  // Fetch Data
  useEffect(() => {
    fetchFolders();
    fetchNotes();
  }, []);

  // Reset chat when active note changes
  useEffect(() => {
    setChatMessages([]);
  }, [activeNoteId]);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${API_URL}/folders`, { headers });
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
        if (data.length > 0 && !activeFolderId) setActiveFolderId(data[0].id);
      } else if (res.status === 401 || res.status === 403) {
        onLogout();
      }
    } catch (err) { console.error(err); }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 900) {
        if (activeNoteId) setIsSidebarOpen(false);
        else setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [activeNoteId]);

  // Folder Actions
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (folders.length >= MAX_FOLDERS) {
      alert(`You can only create up to ${MAX_FOLDERS} folders.`);
      return;
    }
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newFolderName.trim() })
      });
      if (res.ok) {
        const newFolder = await res.json();
        setFolders([...folders, newFolder]);
        setActiveFolderId(newFolder.id);
        setNewFolderName('');
        setIsFolderModalOpen(false);
        setActiveNoteId(null);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) { console.error(err); }
  };

  const deleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this folder and all its notes?')) {
      try {
        const res = await fetch(`${API_URL}/folders/${id}`, { method: 'DELETE', headers });
        if (res.ok) {
          const newFolders = folders.filter(f => f.id !== id);
          setFolders(newFolders);
          setNotes(notes.filter(n => n.folder_id !== id));
          if (activeFolderId === id) {
            setActiveFolderId(newFolders.length > 0 ? newFolders[0].id : null);
            setActiveNoteId(null);
          }
        }
      } catch (err) { console.error(err); }
    }
  };

  // Note Actions
  const createNote = async () => {
    if (!activeFolderId) return;

    try {
      const res = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ folder_id: activeFolderId, title: '', content: '' })
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
        if (window.innerWidth <= 900) setIsSidebarOpen(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeFolderId || !e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', activeFolderId);

    try {
      const res = await fetch(`${API_URL}/notes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
        if (window.innerWidth <= 900) setIsSidebarOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to upload note');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading file');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== id));
        if (activeNoteId === id) {
          setActiveNoteId(null);
          if (window.innerWidth <= 900) setIsSidebarOpen(true);
        }
      }
    } catch (err) { console.error(err); }
  };

  // Debounced Auto-save for Note Updates
  const updateNoteLocally = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const saveNoteToServer = async (id: string, title: string, content: string) => {
    try {
      await fetch(`${API_URL}/notes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ title, content })
      });
    } catch (err) { console.error(err); }
  };

  // Chat Actions
  const handleSendChatMessage = async (overrideMessage?: string) => {
    const textToSend = overrideMessage !== undefined ? overrideMessage : chatInput.trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMsg.content,
          currentNote: activeNote,
          contextNotes: chatMessages,
          folderId: activeFolderId,
          folderName: activeFolder ? activeFolder.name : "Subject"
        })
      });
      const data = await res.json();

      if (res.ok) {
        setChatMessages(prev => [...prev, { role: 'model', content: data.reply }]);
        handleTTS(data.reply, chatMessages.length + 1); // Automatically read aloud AI reply
        fetchNotes(); // In case a note was created
      } else {
        setChatMessages(prev => [...prev, { role: 'model', content: `Error: ${data.error}` }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', content: 'Network or server error.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Assistant Chat Bot (text-only) Actions
  const handleAssistantSendMessage = async () => {
    const textToSend = assistantInput.trim();
    if (!textToSend || isAssistantLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    setAssistantMessages(prev => [...prev, userMsg]);
    setAssistantInput('');
    setIsAssistantLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMsg.content,
          currentNote: activeNote,
          contextNotes: assistantMessages,
          folderId: activeFolderId,
          folderName: activeFolder ? activeFolder.name : 'Subject'
        })
      });
      const data = await res.json();

      if (res.ok) {
        setAssistantMessages(prev => [...prev, { role: 'model', content: data.reply }]);
        fetchNotes(); // In case a note was created
      } else {
        setAssistantMessages(prev => [...prev, { role: 'model', content: `Error: ${data.error}` }]);
      }
    } catch (err) {
      console.error(err);
      setAssistantMessages(prev => [...prev, { role: 'model', content: 'Network or server error.' }]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  // Auto-greeting when Teacher Mode opens
  useEffect(() => {
    if (isChatOpen && activeFolderId) {
      const greeting = 'Hello, I am your AI teacher. How can I help you today?';

      setChatMessages(prev => {
        if (prev.length > 0 && prev[0].content === greeting && prev[0].role === 'model') {
          return prev;
        }
        const updated = [{ role: 'model' as const, content: greeting }, ...prev];
        return updated;
      });

      // Play greeting with the same female TTS voice
      handleTTS(greeting, -1);
    }
  }, [isChatOpen, activeFolderId]);

  // --- NEW STUDY FEATURE LOGIC ---

  const fetchGapMap = async () => {
    if (!activeFolderId) return;
    setIsGapMapLoading(true);
    try {
      const res = await fetch(`${API_URL}/study/gap-map?folderId=${activeFolderId}`, { headers });
      const data = await res.json();
      setGapMap(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setGapMap([]);
    }
    setIsGapMapLoading(false);
  };

  const recordPerformance = async (concept: string, isCorrect: boolean, score?: number) => {
    if (!activeFolderId || !concept) return;
    try {
      await fetch(`${API_URL}/study/performance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ folderId: activeFolderId, conceptName: concept, isCorrect, score })
      });
      fetchGapMap();
    } catch (err) { console.error(err); }
  };



  const handleVivaInteraction = async (userAnswer?: string) => {
    if (!activeFolderId) return;
    setIsVivaLoading(true);
    try {
      const res = await fetch(`${API_URL}/study/viva`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          folderId: activeFolderId,
          history: vivaMessages,
          userAnswer,
          questionCount: vivaQuestionCount
        })
      });
      const data = await res.json();
      if (userAnswer) {
        setVivaMessages(prev => [...prev, { role: 'user', content: userAnswer }]);
        setVivaQuestionCount(prev => prev + 1);
      }
      setVivaMessages(prev => [...prev, { role: 'ai', content: data.examinerResponse, isFinal: data.isFinalResult }]);
      if (data.performanceScore !== undefined) {
        // Performance score received
      }
    } catch (err) {
      console.error(err);
    }
    setIsVivaLoading(false);
  };

  useEffect(() => {
    if (isStudyMode && activeFolderId) {
      fetchGapMap();
    }
  }, [isStudyMode, activeFolderId]);

  // Study Actions
  const handleGenerateStudyMaterial = async (mode?: 'weakness', targetConcept?: string) => {
    if (!activeFolderId) return;
    setIsStudyLoading(true);
    setStudyData(null);
    setMcqAnswers({});
    setSaqAnswers({});
    setSaqResults({});
    setFlippedFlashcards({});
    try {
      const res = await fetch(`${API_URL}/study`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          folderId: activeFolderId,
          folderName: activeFolder ? activeFolder.name : "Subject",
          mode,
          targetConcept
        })
      });
      const data = await res.json();
      setStudyData(data);
    } catch (err) {
      console.error(err);
      alert('Error generating study material.');
    } finally {
      setIsStudyLoading(false);
    }
  };

  const handleGradeSAQ = async (idx: number, saq: any) => {
    const userAnswer = saqAnswers[idx];
    if (!userAnswer || !userAnswer.trim()) return;

    try {
      const res = await fetch(`${API_URL}/grade`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: saq.question,
          modelAnswer: saq.model_answer,
          userAnswer: userAnswer.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSaqResults(prev => ({ ...prev, [idx]: data }));
        recordPerformance(saq.concept, data.score >= 5, data.score);
      } else {
        alert(data.error || 'Failed to grade answer');
      }
    } catch (err) {
      console.error(err);
      alert('Error grading answer');
    }
  };

  // Voice Interaction Actions (browser SpeechRecognition + speechSynthesis)
  const handleSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Speech Recognition. Please try Chrome or Edge.');
      return;
    }

    // If already listening, stop current recognition
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    sttFinalRef.current = '';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalText = sttFinalRef.current;
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const textSegment = result[0].transcript;
        if (result.isFinal) {
          finalText += textSegment + ' ';
        } else {
          interimText += textSegment;
        }
      }

      sttFinalRef.current = finalText;
      const combined = (finalText + interimText).trim();
      setChatInput(combined);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech Recognition Error', event.error);
      setIsListening(false);
      sttFinalRef.current = '';
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      const finalText = sttFinalRef.current.trim();
      setIsListening(false);
      sttFinalRef.current = '';
      recognitionRef.current = null;

      if (finalText) {
        setChatInput('');
        handleSendChatMessage(finalText);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const preferred = voices.find(v =>
      /female|woman|samantha|google us english/i.test(v.name)
    );
    const enVoice = voices.find(v => /^en(-|_)/i.test(v.lang));
    return preferred || enVoice || voices[0];
  };

  const handleTTS = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) {
      console.warn('speechSynthesis not supported in this browser.');
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();

    const plainText = text.replace(/[*_#]/g, '').replace(/\[Citation:.*?\]/g, '');
    const utterance = new SpeechSynthesisUtterance(plainText);

    const voice = getFemaleVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      setSpeakingIdx(null);
    };
    utterance.onerror = () => {
      setSpeakingIdx(null);
    };

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Render variables
  const activeNote = notes.find(n => n.id === activeNoteId) || null;
  const activeFolder = folders.find(f => f.id === activeFolderId) || null;

  const currentFolderNotes = notes.filter(n => n.folder_id === activeFolderId);
  const filteredNotes = currentFolderNotes.filter(n =>
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <div className="app-container">
      {/* Primary Sidebar - Folders */}
      <nav className="primary-sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="brand" style={{ marginBottom: '1rem' }}>
            <PenTool size={22} className="brand-icon" />
            <span style={{ display: window.innerWidth <= 900 ? 'none' : 'block' }}>Ask My Notes</span>
          </div>

          <div className="user-profile">
            <User size={16} />
            <span className="truncate">{username}</span>
            <button className="icon-btn" onClick={onLogout} title="Logout" style={{ marginLeft: 'auto' }}>
              <LogOut size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Subjects ({folders.length}/{MAX_FOLDERS})
            </span>
            <button
              className="action-btn-circle"
              style={{ width: '28px', height: '28px' }}
              onClick={() => setIsFolderModalOpen(true)}
              disabled={folders.length >= MAX_FOLDERS}
              title={folders.length >= MAX_FOLDERS ? "Max limit reached" : "New Folder"}
            >
              <FolderPlus size={16} />
            </button>
          </div>
        </div>

        <div className="folders-list">
          {folders.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
              No subjects yet.
            </div>
          ) : (
            folders.map(folder => (
              <div
                key={folder.id}
                className={`folder-item ${folder.id === activeFolderId ? 'active' : ''}`}
                onClick={() => {
                  setActiveFolderId(folder.id);
                  setActiveNoteId(null);
                  if (window.innerWidth <= 900) setIsSidebarOpen(true);
                }}
              >
                <div className="folder-item-content">
                  <Folder size={18} className="folder-icon" fill={folder.id === activeFolderId ? "currentColor" : "none"} />
                  <span className="folder-name">{folder.name}</span>
                </div>

                <div className="folder-actions">
                  <button className="icon-btn danger" onClick={(e) => deleteFolder(folder.id, e)} title="Delete Folder">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            className={`btn ${isStudyMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => { setIsStudyMode(!isStudyMode); setActiveNoteId(null); setIsChatOpen(false); }}
          >
            <GraduationCap size={18} />
            {isStudyMode ? 'Exit Study Mode' : 'Study Mode'}
          </button>

          <button
            className={`btn ${isChatOpen ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => { setIsChatOpen(!isChatOpen); if (!isChatOpen) setIsStudyMode(false); }}
            disabled={!activeFolderId}
            title={!activeFolderId ? "Select a subject first" : "AskMyNotes Teacher Mode"}
          >
            <Bot size={18} />
            {isChatOpen ? 'Close Teacher Mode' : 'Teacher Mode'}
          </button>
        </div>
      </nav>

      {/* Secondary Sidebar - Notes */}
      <aside className={`sidebar ${!isSidebarOpen ? 'hidden' : ''}`}>
        <div className="sidebar-header" style={{ padding: '1rem 1.5rem', borderBottom: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
            {activeFolder ? activeFolder.name : "Select a Subject"}
          </div>
        </div>

        <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', backgroundColor: 'rgba(42, 37, 41, 0.05)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem'
              }}
            />
          </div>
          <label
            className="action-btn-circle"
            title="Upload Note (TXT or PDF)"
            style={{ flexShrink: 0, borderRadius: '8px', width: '38px', height: '38px', cursor: !activeFolderId || isUploading ? 'not-allowed' : 'pointer', opacity: !activeFolderId || isUploading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <input
              type="file"
              accept=".txt,.pdf,application/pdf,text/plain"
              onChange={handleFileUpload}
              disabled={!activeFolderId || isUploading}
              style={{ display: 'none' }}
            />
            {isUploading ? <span style={{ fontSize: '10px' }}>...</span> : <Upload size={20} />}
          </label>
          <button
            className="action-btn-circle"
            onClick={createNote}
            disabled={!activeFolderId}
            style={{ flexShrink: 0, borderRadius: '8px', width: '38px', height: '38px' }}
            title="New Note"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="notes-list">
          {!activeFolderId ? (
            <div className="empty-state">Select or create a subject to view notes.</div>
          ) : filteredNotes.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? "No notes found." : "This folder is empty. Create a note!"}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={`note-item ${note.id === activeNoteId ? 'active' : ''}`}
                onClick={() => {
                  setActiveNoteId(note.id);
                  if (window.innerWidth <= 900) setIsSidebarOpen(false);
                }}
              >
                <div className="note-title">{note.title || 'Untitled Note'}</div>
                <div className="note-preview">{note.content || 'No additional text...'}</div>
                <div className="note-date">{formatDate(note.updated_at)}</div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Editor Main */}
      <main className="editor-container">
        {isStudyMode ? (
          <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
            {/* Selection Menu */}
            {studySubMode === 'menu' ? (
              <div className="mx-auto max-w-5xl w-full py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                  <div className="w-16 h-16 rounded-3xl bg-charcoal text-paleivory flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <GraduationCap size={32} />
                  </div>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                    Master {activeFolder ? activeFolder.name : "Subject"}
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Choose your training path. Our AI scales the difficulty based on your library content.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                  {[
                    {
                      id: 'quiz',
                      title: 'Practice Quiz',
                      icon: <FileText size={28} />,
                      desc: 'AI-generated MCQs and short-answers tailored to your notes.',
                      action: () => { setStudySubMode('quiz'); if (!studyData) handleGenerateStudyMaterial(); },
                    },
                    {
                      id: 'viva',
                      title: 'Oral Examiner',
                      icon: <Mic size={28} />,
                      desc: 'Defend your knowledge in a strict 3-question structured viva session.',
                      action: () => { setStudySubMode('viva'); handleVivaInteraction(); },
                    },
                    {
                      id: 'gap-map',
                      title: 'Knowledge Map',
                      icon: <BrainCircuit size={28} />,
                      desc: 'Visualize your conceptual hierarchy and target your failing topics.',
                      action: () => { setStudySubMode('gap-map'); fetchGapMap(); },
                    }
                  ].map((card) => (
                    <div
                      key={card.id}
                      onClick={card.action}
                      className="group"
                      style={{
                        background: 'white',
                        borderRadius: '32px',
                        padding: '2.5rem',
                        border: '1px solid rgba(42, 37, 41, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--charcoal)',
                      }}>
                        {card.icon}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>{card.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{card.desc}</p>
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--charcoal)', opacity: 0.6 }}>
                        START PATH <ArrowRight size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl w-full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => { setStudySubMode('menu'); }}
                      className="w-10 h-10 rounded-xl bg-charcoal/5 flex items-center justify-center text-charcoal hover:bg-charcoal hover:text-paleivory transition-all mr-2"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center text-paleivory">
                      {studySubMode === 'quiz' ? <FileText size={22} /> : studySubMode === 'viva' ? <Mic size={22} /> : <BrainCircuit size={22} />}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem' }}>
                      {studySubMode === 'quiz' ? 'Practice Quiz' : studySubMode === 'viva' ? 'AI Oral Examiner' : 'Knowledge Map'}
                    </h2>
                  </div>

                  {studySubMode === 'quiz' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleGenerateStudyMaterial()}
                      disabled={!activeFolderId || isStudyLoading}
                      style={{ borderRadius: '12px', padding: '0.75rem 1.5rem' }}
                    >
                      {isStudyLoading ? 'Generating...' : 'Refresh Quiz'}
                    </button>
                  )}
                </div>

                {/* Specific Sub-Mode Content */}
                {studySubMode === 'gap-map' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '2rem', background: 'rgba(42, 37, 41, 0.03)', borderRadius: '32px', border: '1px solid rgba(42, 37, 41, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BrainCircuit size={20} className="text-charcoal" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Knowledge Gap Map</h3>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Live proficiency tracking</span>
                    </div>

                    {isGapMapLoading ? (
                      <div className="flex items-center gap-2 py-4">
                        <div className="w-4 h-4 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
                        <span className="text-sm opacity-50">Mapping connections...</span>
                      </div>
                    ) : gapMap.length === 0 ? (
                      <div style={{ padding: '2rem', border: '1px dashed rgba(42, 37, 41, 0.2)', borderRadius: '24px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Answer quiz questions to start mapping your knowledge.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {gapMap.map((concept, i) => {
                          const accuracy = (concept.correct_count / concept.attempt_count) * 100;
                          const status = accuracy >= 80 ? 'strong' : accuracy >= 50 ? 'weak' : 'unknown';
                          const color = status === 'strong' ? '#22c55e' : status === 'weak' ? '#eab308' : '#ef4444';

                          return (
                            <div key={i} style={{ padding: '1.25rem', background: 'white', borderRadius: '20px', border: `1px solid ${color}20`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{concept.name}</span>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{status.toUpperCase()}</span>
                                <span>{Math.round(accuracy)}%</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <div style={{ width: `${accuracy}%`, height: '100%', background: color }} />
                              </div>
                              {status !== 'strong' && (
                                <button onClick={() => { setStudySubMode('quiz'); handleGenerateStudyMaterial('weakness', concept.name); }} className="w-full py-2 bg-charcoal/5 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-charcoal hover:text-white transition-all">
                                  Target Weakness
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {studySubMode === 'viva' && (
                  <div className="mx-auto max-w-2xl w-full flex flex-col h-[70vh] bg-white rounded-[40px] shadow-2xl border border-charcoal/5 relative overflow-hidden animate-in zoom-in-95 duration-500">
                    <div style={{ padding: '2.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Bot size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Viva Session</h2>
                      </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {vivaMessages.map((msg, i) => (
                        <div key={i} style={{
                          alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end',
                          maxWidth: '85%',
                          padding: '1rem 1.5rem',
                          borderRadius: '24px',
                          background: msg.role === 'ai' ? '#FFFFFF' : 'var(--charcoal)',
                          color: msg.role === 'ai' ? 'var(--charcoal)' : 'white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                          {msg.content}
                        </div>
                      ))}
                      {isVivaLoading && <div className="p-4 rounded-xl bg-charcoal/5 text-sm animate-pulse">Examiner is formulating feedback...</div>}
                    </div>
                    <div style={{ padding: '2rem', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'white' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                          onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value) { handleVivaInteraction((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
                          className="flex-1 p-4 bg-gray-100 rounded-2xl border-none outline-none focus:ring-2 focus:ring-charcoal/20"
                          placeholder="Defend your thesis..."
                        />
                        <button onClick={handleSTT} className="p-4 bg-charcoal text-white rounded-2xl hover:bg-charcoal/90 transition-colors"><Mic size={20} /></button>
                      </div>
                    </div>
                  </div>
                )}

                {studySubMode === 'quiz' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isStudyLoading ? (
                      <div className="py-20 text-center">
                        <div className="w-12 h-12 border-4 border-charcoal/10 border-t-charcoal rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-charcoal/60">Generating your customized assessment...</p>
                      </div>
                    ) : studyData ? (
                      <div className="pb-32">
                        {studyData.mcqs && studyData.mcqs.length > 0 && (
                          <section style={{ marginBottom: '4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
                              <h3 style={{ margin: 0, fontFamily: 'Merriweather, serif' }}>Practice Quiz</h3>
                              <span style={{ fontSize: '0.8rem', color: 'rgba(42, 37, 41, 0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {studyData.mcqs.length} Questions
                              </span>
                            </div>
                            {studyData.mcqs.map((mcq: any, idx: number) => {
                              const isAnswered = mcqAnswers[idx] !== undefined;
                              return (
                                <div key={idx} style={{
                                  padding: '2.5rem',
                                  background: 'white',
                                  borderRadius: '32px',
                                  border: '1px solid rgba(42,37,41,0.05)',
                                  marginBottom: '2rem',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                                }}>
                                  <h4 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', lineHeight: 1.4, fontWeight: 700 }}>{mcq.question}</h4>
                                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {Object.entries(mcq.options).map(([key, value]) => (
                                      <button
                                        key={key}
                                        disabled={isAnswered}
                                        onClick={() => {
                                          setMcqAnswers(prev => ({ ...prev, [idx]: key }));
                                          recordPerformance(mcq.concept, key === mcq.correct_answer);
                                        }}
                                        style={{
                                          padding: '1.25rem 1.5rem',
                                          textAlign: 'left',
                                          borderRadius: '16px',
                                          border: `2px solid ${isAnswered ? (key === mcq.correct_answer ? '#22c55e' : (mcqAnswers[idx] === key ? '#ef4444' : 'rgba(0,0,0,0.05)')) : 'rgba(0,0,0,0.1)'}`,
                                          background: isAnswered && key === mcq.correct_answer ? 'rgba(34, 197, 94, 0.05)' : 'white',
                                        }}
                                      >
                                        {value as string}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </section>
                        )}

                        {studyData.flashcards && studyData.flashcards.length > 0 && (
                          <section style={{ marginBottom: '4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
                              <h3 style={{ margin: 0, fontFamily: 'Merriweather, serif' }}>Flashcards</h3>
                              <span style={{ fontSize: '0.8rem', color: 'rgba(42, 37, 41, 0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {studyData.flashcards.length} Cards
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                              {studyData.flashcards.map((card: any, idx: number) => (
                                <div
                                  key={idx}
                                  onClick={() => setFlippedFlashcards(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                  style={{
                                    height: '220px',
                                    perspective: '1000px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    textAlign: 'center',
                                    transition: 'transform 0.6s',
                                    transformStyle: 'preserve-3d',
                                    transform: flippedFlashcards[idx] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    borderRadius: '32px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
                                  }}>
                                    {/* Front */}
                                    <div style={{
                                      position: 'absolute',
                                      width: '100%',
                                      height: '100%',
                                      backfaceVisibility: 'hidden',
                                      background: 'white',
                                      border: '1px solid rgba(0,0,0,0.05)',
                                      borderRadius: '32px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '2rem'
                                    }}>
                                      <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{card.front}</p>
                                      <div style={{ marginTop: '1.5rem', color: 'rgba(0,0,0,0.3)' }}>
                                        <RotateCw size={20} />
                                      </div>
                                    </div>
                                    {/* Back */}
                                    <div style={{
                                      position: 'absolute',
                                      width: '100%',
                                      height: '100%',
                                      backfaceVisibility: 'hidden',
                                      background: 'var(--primary)',
                                      color: 'black',
                                      backgroundColor: 'white',
                                      borderRadius: '32px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '2rem',
                                      transform: 'rotateY(180deg)'
                                    }}>
                                      <p style={{ margin: 0, lineHeight: 1.5 }}>{card.back}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {studyData.short_answer_questions && studyData.short_answer_questions.length > 0 && (
                          <section style={{ marginBottom: '4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h3 style={{ margin: 0, fontFamily: 'Merriweather, serif' }}>Short Answers</h3>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'rgba(42, 37, 41, 0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {studyData.short_answer_questions.length} Items
                              </span>
                            </div>
                            {studyData.short_answer_questions.map((saq: any, idx: number) => {
                              const result = saqResults[idx];
                              const score = result ? result.score : 0;
                              const getScoreColor = (s: number) => {
                                if (s >= 8) return '#22c55e';
                                if (s >= 5) return '#eab308';
                                return '#ef4444';
                              };
                              const getScoreBg = (s: number) => {
                                if (s >= 8) return 'rgba(34, 197, 94, 0.05)';
                                if (s >= 5) return 'rgba(234, 179, 8, 0.05)';
                                return 'rgba(239, 68, 68, 0.05)';
                              };
                              const getScoreIcon = (s: number) => {
                                if (s >= 8) return <Trophy size={20} />;
                                if (s >= 5) return <ThumbsUp size={20} />;
                                return <AlertCircle size={20} />;
                              };

                              return (
                                <div key={idx} style={{
                                  padding: '3rem',
                                  background: 'white',
                                  borderRadius: '32px',
                                  border: '1px solid rgba(42,37,41,0.05)',
                                  marginBottom: '2rem',
                                  boxShadow: '0 4px 24px rgba(0,0,0,0.02)'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.25rem', lineHeight: 1.4, fontWeight: 700, flex: 1, paddingRight: '2rem' }}>{saq.question}</h4>
                                    {result && (
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '99px',
                                        background: getScoreBg(score),
                                        color: getScoreColor(score),
                                        fontWeight: 700,
                                        fontSize: '0.9rem'
                                      }}>
                                        {getScoreIcon(score)}
                                        <span>{score}/10</span>
                                      </div>
                                    )}
                                  </div>

                                  <textarea
                                    className="w-full p-6 bg-[#FFFFFF] rounded-2xl border-none outline-none min-h-[160px] text-charcoal/80"
                                    placeholder="Synthesize your answer using your notes..."
                                    disabled={result}
                                    value={saqAnswers[idx] || ''}
                                    onChange={e => setSaqAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                    style={{
                                      resize: 'none',
                                      fontSize: '1rem',
                                      lineHeight: 1.6,
                                      borderRadius: '24px'
                                    }}
                                  />

                                  {!result && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                      <button
                                        onClick={() => handleGradeSAQ(idx, saq)}
                                        disabled={!saqAnswers[idx]?.trim()}
                                        className="flex items-center gap-2 px-8 py-4 bg-charcoal text-black rounded-2xl hover:bg-charcoal/90 transition-all font-semibold disabled:opacity-50"
                                      >
                                        Grade My Response
                                      </button>
                                    </div>
                                  )}

                                  {result && (
                                    <div style={{
                                      marginTop: '2rem',
                                      padding: '2rem',
                                      background: '#FFFFFF',
                                      borderRadius: '24px',
                                      borderLeft: `4px solid ${getScoreColor(score)}`
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                        <Bot size={16} /> Examiner Feedback
                                      </div>
                                      <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.6 }}>{result.feedback}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </section>
                        )}
                      </div>
                    ) : (
                      <div className="py-20 text-center border-2 border-dashed rounded-[40px] border-charcoal/10">
                        <p className="text-charcoal/60">Generate material to begin testing.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeNote ? (
          <>
            <div className="editor-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  className="action-btn"
                  style={{ display: window.innerWidth <= 900 ? 'flex' : 'none' }}
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Back to Notes"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="date-display">
                  Last updated {formatDate(activeNote.updated_at)}
                </div>
              </div>
              <div className="editor-actions">
                <button
                  className="action-btn danger"
                  onClick={() => deleteNote(activeNote.id)}
                  title="Delete note"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="editor-content">
              <input
                type="text"
                className="title-input"
                placeholder="Note Title"
                value={activeNote.title || ''}
                onChange={(e) => {
                  updateNoteLocally(activeNote.id, { title: e.target.value });
                  saveNoteToServer(activeNote.id, e.target.value, activeNote.content);
                }}
              />
              <textarea
                className="body-input"
                placeholder="Start writing..."
                value={activeNote.content || ''}
                onChange={(e) => {
                  updateNoteLocally(activeNote.id, { content: e.target.value });
                  saveNoteToServer(activeNote.id, activeNote.title, e.target.value);
                }}
              />
            </div>
            {/* Editor Content End */}
          </>
        ) : (
          <div className="no-selection-view" style={{ display: isSidebarOpen && window.innerWidth <= 900 ? 'none' : 'flex' }}>
            <BookOpen size={64} className="no-selection-icon" />
            <h2>{activeFolder ? activeFolder.name : "Capture your thoughts"}</h2>
            <p>Select a note from the sidebar or click + to record a new thought.</p>
          </div>
        )}

        {/* Global Chat Panel (Teacher Mode - voice only, with transcript) */}
        {isChatOpen && activeFolderId && (
          <div className="chat-panel">
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot size={18} /> Teacher Mode
              </div>
              <button className="icon-btn" onClick={() => setIsChatOpen(false)}><X size={18} /></button>
            </div>
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="chat-msg system">Hi there! Ask me to summarize this note or create a new one.</div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-msg ${msg.role}`}>
                    {msg.role === 'model' ? (
                      <div style={{ position: 'relative' }}>
                        <button
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            background: speakingIdx === idx ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${speakingIdx === idx ? '#22c55e' : 'transparent'}`,
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: speakingIdx === idx ? '#22c55e' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            zIndex: 10
                          }}
                          onClick={() => handleTTS(msg.content, idx)}
                          title={speakingIdx === idx ? "Stop TTS reading" : "Read Aloud using TTS"}
                        >
                          {speakingIdx === idx ? <Square size={14} fill="currentColor" /> : <Volume2 size={14} />}
                        </button>
                        <div className="prose prose-invert max-w-none text-sm" style={{ paddingRight: '28px' }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                ))
              )}
              {isChatLoading && <div className="chat-msg model">Thinking...</div>}
            </div>
            <div className="chat-input-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {isListening && <span style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold' }}>Listening...</span>}
              <button
                className="btn"
                onClick={handleSTT}
                disabled={isChatLoading}
                style={{
                  borderRadius: '50%',
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isListening ? '#ef4444' : 'var(--primary)',
                  boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.4)' : '0 4px 12px rgba(34, 197, 94, 0.2)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  transition: 'all 0.3s ease',
                  cursor: isChatLoading ? 'wait' : 'pointer'
                }}
                title={isListening ? "Tap to stop listening" : "Tap to start speaking"}
              >
                <Mic size={28} />
              </button>
              <span style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                {isChatLoading
                  ? 'Thinking...'
                  : isListening
                    ? 'Listening... tap again when you finish'
                    : 'Tap to speak to your Teacher'}
              </span>
            </div>
          </div>
        )}

        {/* Floating Action Button to open text-only Chat Bot */}
        {activeFolderId && !isAssistantOpen && (
          <button
            className="ai-fab action-btn-circle"
            onClick={() => setIsAssistantOpen(true)}
            title="Open Chat Bot"
          >
            <Bot size={24} />
          </button>
        )}
      </main>

      {/* Assistant Chat Bot Panel (text-only, separate from Teacher Mode) */}
      {isAssistantOpen && activeFolderId && (
        <div className="chat-panel">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={18} /> Chat Bot
            </div>
            <button className="icon-btn" onClick={() => setIsAssistantOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="chat-messages">
            {assistantMessages.length === 0 ? (
              <div className="chat-msg system">
                This AI is grounded in your uploaded notes. Ask anything about this subject!
              </div>
            ) : (
              assistantMessages.map((msg, idx) => (
                <div key={idx} className={`chat-msg ${msg.role}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      sup: ({ node, ...props }) => <sup className="text-charcoal/50 font-mono text-[10px] ml-0.5" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {msg.role === 'model' && (
                    <div className="sourced-badge">
                      <ShieldCheck size={12} className="text-charcoal/60" />
                      100% Sourced from Notes
                    </div>
                  )}
                </div>
              ))
            )}
            {isAssistantLoading && (
              <div className="chat-msg model">
                <div className="flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-charcoal/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-charcoal/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-charcoal/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAssistantSendMessage();
              }}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <input
                type="text"
                placeholder="Ask the chat bot..."
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.8rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(42, 37, 41, 0.1)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isAssistantLoading || !assistantInput.trim()}
                style={{
                  flexShrink: 0,
                  width: '45px',
                  height: '45px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isFolderModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFolderModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Create Subject</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              You are currently using {folders.length} out of {MAX_FOLDERS} subjects.
            </p>
            <form onSubmit={handleCreateFolder}>
              <input
                autoFocus
                type="text"
                className="modal-input"
                placeholder="Subject Name (e.g. Physics)"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                maxLength={30}
              />
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFolderModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newFolderName.trim()}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('app-token') || '');
  const [username, setUsername] = useState(localStorage.getItem('app-username') || '');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Check for token in URL (OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const usernameFromUrl = urlParams.get('username');

    if (tokenFromUrl && usernameFromUrl) {
      handleLogin(tokenFromUrl, usernameFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error') === 'oauth_failed') {
      alert('Authentication failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Global click listener for landing page buttons
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (button) {
        const text = button.innerText.trim().toLowerCase();
        const landingTriggers = ['get started', 'upload notes', 'upload your notes', 'start your library'];
        if (landingTriggers.includes(text)) {
          setShowAuth(true);
        }
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleLogin = (newToken: string, newUsername: string) => {
    localStorage.setItem('app-token', newToken);
    localStorage.setItem('app-username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('app-token');
    localStorage.removeItem('app-username');
    setToken('');
    setUsername('');
    setShowAuth(false);
  };

  if (token) {
    return <MainApp token={token} username={username} onLogout={handleLogout} />;
  }

  if (showAuth) {
    return <AuthScreen onLogin={handleLogin} onBack={() => setShowAuth(false)} />;
  }

  return <LandingApp />;
}
