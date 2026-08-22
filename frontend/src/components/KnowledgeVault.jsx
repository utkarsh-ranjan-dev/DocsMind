import { Search, Plus, UploadCloud, FileText, Trash2, Loader2, Book } from 'lucide-react';
import { useState, useRef } from 'react';
import { useAuth } from '@clerk/react';
import axios from 'axios';

export default function KnowledgeVault({ documents, refreshDocs, activeNotebook }) {
  const [uploading, setUploading] = useState(false);
  const { getToken } = useAuth();
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', files[0]);
      formData.append('notebookId', activeNotebook.id);
      
      const token = await getToken();
      await axios.post('http://localhost:3000/api/documents/feed', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      
      await refreshDocs();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileName) => {
    if (!confirm(`Delete ${fileName}?`)) return;
    try {
      const token = await getToken();
      await axios.delete('http://localhost:3000/api/documents', { 
        headers: { Authorization: `Bearer ${token}` },
        data: { fileName, notebookId: activeNotebook.id } 
      });
      await refreshDocs();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const parsedDocs = documents.map(d => typeof d === 'string' ? { fileName: d, size: 0, status: 'Indexed' } : d);

  return (
    <div className="w-72 flex flex-col bg-white border-r border-gray-200 h-full shrink-0">
      <div className="p-4 border-b border-blue-50 bg-blue-50/30 flex items-center gap-2">
        <Book size={18} className="text-blue-600" />
        <h2 className="font-bold text-blue-900 text-sm truncate">{activeNotebook.name}</h2>
      </div>

      <div className="p-4 flex items-center justify-between mt-2">
        <h2 className="font-bold text-gray-800 text-lg">Knowledge Vault</h2>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
      
      <div className="px-4 pb-4 border-b border-gray-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {parsedDocs.length === 0 && (
           <div className="text-center text-gray-400 text-sm mt-10">No documents in this workspace yet.</div>
        )}
        {parsedDocs.map((doc, idx) => (
          <div key={idx} className="group flex items-start gap-3 p-3 border border-gray-100 rounded-xl hover:shadow-sm hover:border-blue-100 transition-all bg-white relative">
            <div className="bg-red-50 text-red-500 p-2 rounded-lg shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-gray-800 truncate pr-6">{doc.fileName}</div>
              <div className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider">{formatSize(doc.size)}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span className="text-[10px] font-medium text-green-600 uppercase tracking-wide">{doc.status || 'Indexed'}</span>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(doc.fileName)}
              className="absolute right-3 top-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4">
        <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".pdf,.docx,.txt" />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors text-blue-600"
        >
          {uploading ? <Loader2 className="animate-spin mb-2" /> : <UploadCloud className="mb-2" />}
          <div className="font-semibold text-sm">{uploading ? 'Uploading...' : 'Upload Documents'}</div>
          <div className="text-xs text-blue-400/80 mt-1">PDF, DOCX, TXT up to 50MB</div>
        </button>
      </div>
    </div>
  );
}


