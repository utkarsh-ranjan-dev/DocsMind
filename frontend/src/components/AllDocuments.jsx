import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { FileText, Loader2, Trash2, Search, Database } from 'lucide-react';
import { useAuth } from '@clerk/react';
import axios from 'axios';

export default function AllDocuments({ notebooks }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { getToken } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDocuments(res.data.document || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileName, notebookId) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { fileName, notebookId }
      });
      setDocuments(documents.filter(d => !(d.fileName === fileName && d.notebookId === notebookId)));
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getNotebookName = (id) => {
    const nb = notebooks.find(n => n.id === id);
    return nb ? nb.name : 'Unknown Workspace';
  };

  const filteredDocs = documents.filter(d => d.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mr-3">
            <Database size={16} />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight">All Documents</h1>
            <p className="text-xs text-gray-400 font-medium">Manage files across all workspaces</p>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-64"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>No documents found</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-6">File Name</th>
                  <th className="py-3 px-6">Workspace</th>
                  <th className="py-3 px-6">Size</th>
                  <th className="py-3 px-6">Uploaded</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-teal-500 shrink-0" />
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <span className="inline-flex px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">{getNotebookName(doc.notebookId)}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">{formatBytes(doc.size)}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleDelete(doc.fileName, doc.notebookId)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


