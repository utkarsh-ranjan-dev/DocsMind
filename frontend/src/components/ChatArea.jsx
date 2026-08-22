import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Sparkles, User, FileText } from 'lucide-react';
import { marked } from 'marked';
import { useAuth } from '@clerk/react';
import axios from 'axios';

export default function ChatArea({ setActiveSource, activeNotebook }) {
  const [question, setQuestion] = useState('');
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!activeNotebook) return;
    setMessages([]);
    axios.get(`http://localhost:3000/api/query/history/${activeNotebook.id}`)
      .then(res => {
        if (res.data.success && res.data.messages) {
          setMessages(res.data.messages);
        }
      })
      .catch(err => console.error("Could not load history", err));
  }, [activeNotebook]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQ = question;
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setQuestion('');
    setLoading(true);

    try {
      const token = await getToken();
      const res = await axios.post('http://localhost:3000/api/query', { 
        question: userQ,
        notebookId: activeNotebook.id,
        sessionId: activeNotebook.id
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: res.data.answer,
          detailedSources: res.data.detailedSources || []
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Failed to connect to the server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="h-16 border-b border-gray-100 flex items-center px-6 bg-white shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
          <Sparkles size={16} />
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg leading-tight">Chat with DocsMind</h1>
          <p className="text-xs text-gray-400 font-medium">Workspace: {activeNotebook?.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
              msg.role === 'user' ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-3xl overflow-hidden`}>
              <div className={`px-5 py-3.5 rounded-2xl max-w-full overflow-hidden ${
                msg.role === 'user' 
                  ? 'bg-blue-50 text-blue-900 border border-blue-100 rounded-tr-sm text-[15px]' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
              }`}>
                {msg.role === 'user' ? (
                  <p>{String(msg.content || "")}</p>
                ) : (
                  <div 
                    className="prose prose-sm prose-blue max-w-none text-[15px] leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: marked.parse(String(msg.content || "")) }}
                  />
                )}
              </div>
              
              {msg.detailedSources && msg.detailedSources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-400 mr-1 mt-1 font-medium">Source:</span>
                  {msg.detailedSources.map((src, i) => (
                    <button 
                      key={i}
                      onClick={() => setActiveSource(src)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-blue-600 text-[11px] font-semibold rounded-full transition-colors shadow-sm"
                    >
                      <FileText size={10} />
                      {src.fileName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1">
              <Sparkles size={14} />
            </div>
            <div className="px-5 py-4 rounded-2xl bg-white border border-gray-200 rounded-tl-sm flex items-center gap-2 shadow-sm">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white shrink-0 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={`Ask anything about '${activeNotebook?.name}'...`}
            className="w-full pl-6 pr-24 py-4 bg-white border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-2xl text-[14px] outline-none transition-all shadow-sm"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button 
              type="submit"
              disabled={!question.trim() || loading}
              className="p-2 bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md flex items-center justify-center w-10 h-10"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


