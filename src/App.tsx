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
  Square
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';
import './output.css';

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

function AuthScreen({ onLogin }: { onLogin: (token: string, username: string) => void }) {
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
  const [isGrading, setIsGrading] = useState<Record<number, boolean>>({});

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

  // Study Actions
  const handleGenerateStudyMaterial = async () => {
    if (!activeFolderId) return;
    setIsStudyLoading(true);
    setStudyData(null);
    setMcqAnswers({});
    setSaqAnswers({});
    setSaqResults({});
    setIsGrading({});
    try {
      const res = await fetch(`${API_URL}/study`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          folderId: activeFolderId,
          folderName: activeFolder ? activeFolder.name : "Subject"
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

    setIsGrading(prev => ({ ...prev, [idx]: true }));
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
      } else {
        alert(data.error || 'Failed to grade answer');
      }
    } catch (err) {
      console.error(err);
      alert('Error grading answer');
    } finally {
      setIsGrading(prev => ({ ...prev, [idx]: false }));
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
            <span style={{ display: window.innerWidth <= 900 ? 'none' : 'block' }}>Reflect</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>
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
                width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', color: 'white', fontSize: '0.9rem'
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Study Mode: {activeFolder ? activeFolder.name : "Subject"}</h2>
              <button
                className="btn btn-primary"
                onClick={handleGenerateStudyMaterial}
                disabled={!activeFolderId || isStudyLoading}
              >
                {isStudyLoading ? 'Generating...' : 'Generate New Material from Notes'}
              </button>
            </div>

            {isStudyLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '4rem' }}>
                <GraduationCap size={48} style={{ opacity: 0.5, marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
                <h3>Analyzing your notes...</h3>
                <p>Generating targeted questions to test your knowledge.</p>
              </div>
            ) : studyData ? (
              studyData.message ? (
                <div className="empty-state">{studyData.message}</div>
              ) : (
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  {studyData.mcqs && studyData.mcqs.length > 0 && (
                    <section style={{ marginBottom: '3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Multiple Choice Questions</h3>
                        {Object.keys(mcqAnswers).length === studyData.mcqs.length && (
                          <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                            Score: {studyData.mcqs.filter((m: any, i: number) => mcqAnswers[i] === m.correct_answer).length} / {studyData.mcqs.length}
                          </span>
                        )}
                      </div>

                      {studyData.mcqs.map((mcq: any, idx: number) => {
                        const isAnswered = mcqAnswers[idx] !== undefined;

                        return (
                          <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', transition: 'all 0.3s ease' }}>
                            <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1.05rem' }}>{idx + 1}. {mcq.question}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                              {Object.entries(mcq.options).map(([key, value]) => {
                                const isSelected = mcqAnswers[idx] === key;
                                const isCorrect = key === mcq.correct_answer;

                                let bgColor = 'rgba(255,255,255,0.05)';
                                let borderColor = 'transparent';

                                if (isAnswered) {
                                  if (isCorrect) {
                                    bgColor = 'rgba(34, 197, 94, 0.15)';
                                    borderColor = 'rgba(34, 197, 94, 0.5)';
                                  } else if (isSelected) {
                                    bgColor = 'rgba(239, 68, 68, 0.15)';
                                    borderColor = 'rgba(239, 68, 68, 0.5)';
                                  }
                                }

                                return (
                                  <button
                                    key={key}
                                    onClick={() => !isAnswered && setMcqAnswers(prev => ({ ...prev, [idx]: key }))}
                                    style={{
                                      padding: '1rem',
                                      backgroundColor: bgColor,
                                      border: `1px solid ${borderColor}`,
                                      borderRadius: '8px',
                                      textAlign: 'left',
                                      cursor: isAnswered ? 'default' : 'pointer',
                                      color: 'black',
                                      display: 'flex',
                                      gap: '0.75rem',
                                      transition: 'all 0.2s',
                                      opacity: isAnswered && !isCorrect && !isSelected ? 0.6 : 1
                                    }}
                                  >
                                    <strong style={{ minWidth: '20px' }}>{key}:</strong>
                                    <span>{value as string}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {isAnswered && (
                              <div style={{ marginTop: '1rem', padding: '1.2rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: `4px solid ${mcqAnswers[idx] === mcq.correct_answer ? '#22c55e' : '#ef4444'}`, animation: 'fadeIn 0.4s ease-out' }}>
                                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                  <strong>{mcqAnswers[idx] === mcq.correct_answer ? '✅ Correct!' : `❌ Incorrect. The correct answer was ${mcq.correct_answer}.`}</strong>
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}><strong>Explanation:</strong> {mcq.explanation}</p>
                                {mcq.citations && mcq.citations.length > 0 && (
                                  <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📚 Citations: {mcq.citations.join(', ')}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </section>
                  )}

                  {studyData.short_answer_questions && studyData.short_answer_questions.length > 0 && (
                    <section style={{ marginBottom: '3rem' }}>
                      <h3 style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Short Answer Questions</h3>
                      {studyData.short_answer_questions.map((saq: any, idx: number) => (
                        <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                          <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{idx + 1}. {saq.question}</p>
                          <textarea
                            placeholder="Write your answer here..."
                            value={saqAnswers[idx] || ''}
                            onChange={(e) => setSaqAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                            disabled={!!saqResults[idx] || isGrading[idx]}
                            style={{ width: '100%', height: '100px', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', marginBottom: '1rem', resize: 'vertical' }}
                          />

                          {!saqResults[idx] ? (
                            <button
                              className="btn btn-primary"
                              disabled={!saqAnswers[idx]?.trim() || isGrading[idx]}
                              onClick={() => handleGradeSAQ(idx, saq)}
                            >
                              {isGrading[idx] ? 'Grading...' : 'Submit Answer'}
                            </button>
                          ) : (
                            <div style={{ padding: '1.2rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: `4px solid ${saqResults[idx].score >= 7 ? '#22c55e' : saqResults[idx].score >= 4 ? '#eab308' : '#ef4444'}`, animation: 'fadeIn 0.4s ease-out' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: saqResults[idx].score >= 7 ? '#22c55e' : saqResults[idx].score >= 4 ? '#eab308' : '#ef4444' }}>
                                  Score: {saqResults[idx].score}/10
                                </span>
                              </div>
                              <p style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, marginBottom: '1rem' }}><strong>Feedback:</strong> {saqResults[idx].feedback}</p>

                              <details style={{ cursor: 'pointer' }}>
                                <summary style={{
                                  color: 'var(--primary)',
                                  fontWeight: 500,
                                  padding: '0.5rem',
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  borderRadius: '6px',
                                  display: 'inline-block'
                                }}>
                                  Reveal Model Answer
                                </summary>
                                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px' }}>
                                  <p style={{ lineHeight: 1.5 }}>{saq.model_answer}</p>
                                  {saq.citations && saq.citations.length > 0 && (
                                    <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📚 Citations: {saq.citations.join(', ')}</p>
                                  )}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </section>
                  )}

                  {studyData.references && studyData.references.length > 0 && (
                    <section>
                      <h3 style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>References</h3>
                      <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {studyData.references.map((ref: any, idx: number) => (
                          <li key={idx} style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            {ref.id} {ref.citation}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )
            ) : (
              <div className="empty-state">
                <GraduationCap size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <h3>Ready to study {activeFolder ? activeFolder.name : "this subject"}?</h3>
                <p>Click the button above to generate a practice exam from your notes.</p>
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
                    color: '#fff',
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
        <div className="chat-panel" style={{ right: '1.5rem', bottom: '1.5rem', top: 'auto', height: '420px' }}>
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
                This is your note-aware chat bot. Ask any question about this subject.
              </div>
            ) : (
              assistantMessages.map((msg, idx) => (
                <div key={idx} className={`chat-msg ${msg.role}`}>
                  {msg.content}
                </div>
              ))
            )}
            {isAssistantLoading && <div className="chat-msg model">Thinking...</div>}
          </div>
          <div className="chat-input-area" style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
                  border: '1px solid rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="submit"
                className="action-btn-circle"
                disabled={isAssistantLoading || !assistantInput.trim()}
                title="Send message"
                style={{
                  flexShrink: 0,
                  width: '60px',
                  height: '40px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Send
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

  const handleLogin = (newToken: string, newUsername: string) => {
    localStorage.setItem('app-token', newToken);
    localStorage.setItem('app-username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('app-token');
    localStorage.removeItem('app-username');
    setToken('');
    setUsername('');
  };

  if (!token) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return <MainApp token={token} username={username} onLogout={handleLogout} />;
}
