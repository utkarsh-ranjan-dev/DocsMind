import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import axios from 'axios';
import { BarChart2, FileText, MessageSquare, HardDrive } from 'lucide-react';

export default function Insights() {
  const [data, setData] = useState(null);
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then(token => axios.get('http://localhost:3000/api/insights', { headers: { Authorization: `Bearer ${token}` } }))
      .then(res => {
        if (res.data.success) setData(res.data.data);
      })
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div className="flex-1 flex items-center justify-center">Loading insights...</div>;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <div className="h-16 border-b border-gray-100 flex items-center px-8 shrink-0">
        <h1 className="font-bold text-gray-800 text-lg">Workspace Insights</h1>
      </div>
      
      <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <FileText size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{data.totalDocuments}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">Total Documents</div>
          </div>
          
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
              <MessageSquare size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{data.totalQueries}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">Total Queries</div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <HardDrive size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{data.storageUsedMB} MB</div>
            <div className="text-sm font-medium text-gray-500 mt-1">Storage Used</div>
          </div>
        </div>
        
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-2xl">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-blue-600" /> System Status
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your vector database is active and currently tracking {data.totalDocuments} indexed files.
            The RAG retrieval pipeline is fully operational with Gemini 2.5 Flash.
          </p>
        </div>
      </div>
    </div>
  );
}


