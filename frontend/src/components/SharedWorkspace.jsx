import { API_URL } from '../config';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, FileText, Copy, Check, Lock } from 'lucide-react';
import { marked } from 'marked';
import axios from 'axios';

export default function SharedWorkspace({ notebookId }) {
  const [notebook, setNotebook] = useState(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([{ role: 'ai', content: 'Hello! You are viewing a shared, read-only DocsMind workspace. Ask me any question based on the documents in this workspace!' }]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch public notebook info
    axios.get(`${API_URL}/api/public/notebooks/${notebookId}`)
      .then(res => {
        if (res.data.success) setNotebook(res.data.notebook);
      })
      .catch(err => {
        setError(err.response?.data?.message || "This workspace is private or does not exist.");
      });
  }, [notebookId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !notebook) return;

    const userQ = question;
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setQuestion('');
    setLoading(true);

    setMessages(prev => [...prev, { role: 'ai', content: '', detailedSources: [] }]);

    try {
      const response = await fetch(`${API_URL}/api/public/query/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQ, notebookId })
      });

      if (!response.ok) throw new Error("Server error");
      setLoading(false); 

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = { ...newMessages[newMessages.length - 1] };
                  
                  if (data.type === 'sources') {
                    lastMsg.detailedSources = data.detailedSources;
                  } else if (data.type === 'chunk') {
                    lastMsg.content += data.content;
                  } else if (data.type === 'error') {
                    lastMsg.content += "\n\nError: " + data.message;
                  }
                  
                  newMessages[newMessages.length - 1] = lastMsg;
                  return newMessages;
                });
              } catch (e) {}
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "Failed to connect to the server.";
        return newMessages;
      });
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-6">
        <Lock size={64} className="text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-500 max-w-md">{error}</p>
        <button onClick={() => window.location.href = '/'} className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Go to DocsMind Home</button>
      </div>
    );
  }

  if (!notebook) return <div className="flex-1 h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading workspace...</div>;

  return (
    <div className="flex-1 flex flex-col h-screen bg-white relative">
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight">{notebook.name}</h1>
            <p className="text-xs text-gray-400 font-medium">Public Shared Workspace</p>
          </div>
        </div>
        <a href="/" className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
          Built with DocsMind
        </a>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-gray-100 text-gray-600' : 'bg-indigo-600 text-white'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-3xl overflow-hidden`}>
              <div className={`px-5 py-3.5 rounded-2xl max-w-full overflow-hidden ${msg.role === 'user' ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-tr-sm text-[15px]' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'}`}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="relative group w-full">
                    <div className="prose prose-sm prose-indigo max-w-none text-[15px] leading-relaxed break-words pr-8" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                    <button onClick={() => handleCopy(msg.content, idx)} className="absolute -top-2 -right-2 p-1.5 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10" title="Copy response">
                      {copiedIndex === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>
              
              {msg.detailedSources && msg.detailedSources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-400 mr-1 mt-1 font-medium">Sources:</span>
                  {msg.detailedSources.map((src, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-semibold rounded-full shadow-sm">
                      <FileText size={10} />
                      {src.fileName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white shrink-0 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask anything about these documents..."
            className="w-full pl-6 pr-24 py-4 bg-white border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 rounded-2xl text-[14px] outline-none transition-all shadow-sm"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button type="submit" disabled={!question.trim() || loading} className="p-2 bg-indigo-600 disabled:bg-indigo-400 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md flex items-center justify-center w-10 h-10">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


