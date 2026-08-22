import { useState, useEffect } from 'react';
import { Show, SignInButton, useAuth } from '@clerk/react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import Navigation from './components/Navigation';
import KnowledgeVault from './components/KnowledgeVault';
import ChatArea from './components/ChatArea';
import SourcePreview from './components/SourcePreview';
import Insights from './components/Insights';
import Collections from './components/Collections';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('Collections');
  const [activeSource, setActiveSource] = useState(null);
  
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebook, setActiveNotebook] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ usedBytes: 0, limitBytes: 10 * 1024 * 1024 * 1024 });

  const { getToken, isSignedIn } = useAuth();

  // Axios interceptor to automatically attach Clerk Token
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        console.log('AXIOS INTERCEPTOR TOKEN:', token);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Clerk Token error", err);
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [getToken]);

  const fetchDocsAndStats = async () => {
    try {
      const docUrl = activeNotebook ? `http://localhost:3000/api/documents?notebookId=${activeNotebook.id}` : 'http://localhost:3000/api/documents';
      const token = await getToken();
      const resDocs = await axios.get(docUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (resDocs.data.success) setDocuments(resDocs.data.document || []);
      
      const resStats = await axios.get('http://localhost:3000/api/documents/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (resStats.data.success) setStats(resStats.data.stats);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchNotebooks = async () => {
    try {
      const token = await getToken();
      const res = await axios.get('http://localhost:3000/api/notebooks', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setNotebooks(res.data.notebooks || []);
      }
    } catch (err) {
      console.error('Error fetching notebooks:', err);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchNotebooks();
      fetchDocsAndStats();
    }
  }, [isSignedIn]); // Note: this might fire before token is ready. That's okay, they will re-run when you log in, or we can listen to auth state changes.

  // Refetch docs when notebook changes
  useEffect(() => {
    if (activeNotebook) fetchDocsAndStats();
  }, [activeNotebook]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f9fafb] text-gray-800">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />
      
      <Show when="signed-out">
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to DocsMind</h1>
          <p className="text-gray-500 mb-8 max-w-md text-center">
            Your personal AI-powered document workspace. Please sign in to securely access your notebooks, chat history, and uploaded files.
          </p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md flex items-center gap-2">
              <Sparkles size={18} /> Get Started
            </button>
          </SignInButton>
        </div>
      </Show>

      <Show when="signed-in">
        {activeTab === 'Chat' && (
          <>
            {activeNotebook ? (
              <>
                <KnowledgeVault 
                  documents={documents} 
                  refreshDocs={fetchDocsAndStats} 
                  activeNotebook={activeNotebook} 
                />
                <ChatArea 
                  setActiveSource={setActiveSource} 
                  activeNotebook={activeNotebook} 
                />
                {activeSource && (
                  <SourcePreview source={activeSource} onClose={() => setActiveSource(null)} />
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <h2 className="text-xl font-bold mb-2">No Workspace Selected</h2>
                <p className="mb-4">Please select or create a Collection to start chatting.</p>
                <button 
                  onClick={() => setActiveTab('Collections')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Go to Collections
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'Collections' && (
          <Collections 
            notebooks={notebooks} 
            setNotebooks={setNotebooks} 
            setActiveNotebook={setActiveNotebook}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'Insights' && (
          <Insights />
        )}
        
        {(activeTab !== 'Chat' && activeTab !== 'Insights' && activeTab !== 'Collections') && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            {activeTab} feature coming soon!
          </div>
        )}
      </Show>
    </div>
  );
}

export default App;





