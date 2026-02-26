import { useState, useEffect } from 'react';
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
  Send,
  X
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fetch Data
  useEffect(() => {
    fetchFolders();
    fetchNotes();
  }, []);

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
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
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
          folderId: activeFolderId
        })
      });
      const data = await res.json();

      if (res.ok) {
        setChatMessages(prev => [...prev, { role: 'model', content: data.reply }]);
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
        {activeNote ? (
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

            {/* Chat Panel */}
            {isChatOpen && (
              <div className="chat-panel">
                <div className="chat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bot size={18} /> Ask AI Anything
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
                          <div className="prose prose-invert max-w-none text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    ))
                  )}
                  {isChatLoading && <div className="chat-msg model">Thinking...</div>}
                </div>
                <div className="chat-input-area">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Type a message..."
                    disabled={isChatLoading}
                  />
                  <button className="action-btn-circle" onClick={handleSendChatMessage} disabled={!chatInput.trim() || isChatLoading} style={{ width: '32px', height: '32px' }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Floating Action Button */}
            {!isChatOpen && (
              <button className="ai-fab action-btn-circle" onClick={() => setIsChatOpen(true)}>
                <Bot size={24} />
              </button>
            )}
          </>
        ) : (
          <div className="no-selection-view" style={{ display: isSidebarOpen && window.innerWidth <= 900 ? 'none' : 'flex' }}>
            <BookOpen size={64} className="no-selection-icon" />
            <h2>{activeFolder ? activeFolder.name : "Capture your thoughts"}</h2>
            <p>Select a note from the sidebar or click + to record a new thought.</p>
          </div>
        )}
      </main>

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
