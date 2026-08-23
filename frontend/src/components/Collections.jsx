import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { Plus, Book, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/react';
import axios from 'axios';

export default function Collections({ notebooks, setNotebooks, setActiveNotebook, setActiveTab }) {
  const [newNotebookName, setNewNotebookName] = useState('');
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.post(`${API_URL}/api/notebooks`, { name: newNotebookName }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setNotebooks([res.data.notebook, ...notebooks]);
        setNewNotebookName('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNotebook = (notebook) => {
    setActiveNotebook(notebook);
    setActiveTab('Chat'); // Switch back to chat view for this notebook
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <div className="h-16 border-b border-gray-100 flex items-center px-8 shrink-0">
        <h1 className="font-bold text-gray-800 text-lg">Your Collections (Notebooks)</h1>
      </div>
      
      <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
        <form onSubmit={handleCreate} className="flex gap-4 items-center bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
          <input 
            type="text" 
            value={newNotebookName}
            onChange={(e) => setNewNotebookName(e.target.value)}
            placeholder="Name your new workspace (e.g. 'Financial Reports 2026')"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={loading || !newNotebookName.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Create Collection
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((nb) => (
            <div 
              key={nb.id} 
              onClick={() => openNotebook(nb)}
              className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Book size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{nb.name}</h3>
              <p className="text-sm text-gray-500 mb-4">
                Created {new Date(nb.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                Open Workspace <ChevronRight size={16} className="ml-1" />
              </div>
            </div>
          ))}
          
          {notebooks.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-400">
              No collections yet. Create your first one above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




