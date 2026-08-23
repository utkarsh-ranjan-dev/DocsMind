import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { Search, Edit2, Check, X, MessageSquare, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/react';
import axios from 'axios';

export default function History({ setActiveTab, setActiveNotebook, notebooks }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const { getToken } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/query/sessions`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (sessionId) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const token = await getToken();
      await axios.put(`${API_URL}/api/query/sessions/${sessionId}`, 
        { name: editName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(sessions.map(s => s.sessionId === sessionId ? { ...s, name: editName } : s));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const openSession = (session) => {
    // Attempt to find the notebook this session belongs to
    const targetNotebook = notebooks.find(n => n.id === session.notebookId);
    if (targetNotebook) {
      setActiveNotebook(targetNotebook);
      setActiveTab('Chat');
    } else {
      alert("The notebook for this chat no longer exists.");
    }
  };

  const filteredSessions = sessions.filter(s => {
    const defaultName = s.messages && s.messages.length > 0 ? s.messages[0].content : "Empty Chat";
    const displayName = s.name || defaultName;
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">
            <Clock size={16} />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight">Chat History</h1>
            <p className="text-xs text-gray-400 font-medium">Review your past conversations</p>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>No chat history found</p>
          </div>
        ) : (
          <div className="grid gap-3 max-w-4xl mx-auto">
            {filteredSessions.map((session) => {
              const defaultName = session.messages && session.messages.length > 0 ? session.messages[0].content : "Empty Chat";
              const displayName = session.name || defaultName;
              const dateObj = session.updatedAt ? new Date(session.updatedAt) : new Date();

              return (
                <div key={session.sessionId} className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm bg-white transition-all cursor-pointer" onClick={() => editingId !== session.sessionId && openSession(session)}>
                  <div className="flex items-center gap-4 overflow-hidden flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <MessageSquare size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      {editingId === session.sessionId ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input 
                            autoFocus
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(session.sessionId)}
                            className="text-sm font-semibold text-gray-800 border-b border-indigo-500 focus:outline-none bg-transparent w-full"
                          />
                          <button onClick={() => handleRename(session.sessionId)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={14} /></button>
                          <button onClick={() => setEditingId(null)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14} /></button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-800 truncate">{displayName}</h3>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{dateObj.toLocaleDateString()} &middot; {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  {editingId !== session.sessionId && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditName(displayName); setEditingId(session.sessionId); }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


