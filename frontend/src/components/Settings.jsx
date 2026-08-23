import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, HardDrive, Loader2, LogOut } from 'lucide-react';
import { UserProfile, useAuth, useUser } from '@clerk/react';
import axios from 'axios';

export default function Settings() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getToken, signOut } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_URL}/api/documents/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [getToken]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = stats ? (stats.usedBytes / stats.limitBytes) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
      <div className="h-16 border-b border-gray-100 flex items-center px-6 bg-white shrink-0 sticky top-0 z-10">
        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center mr-3">
          <SettingsIcon size={16} />
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg leading-tight">Settings</h1>
          <p className="text-xs text-gray-400 font-medium">Manage your account and preferences</p>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Clerk User Profile */}
        <div className="lg:col-span-2 flex justify-center lg:justify-start">
          <div className="w-full">
            <UserProfile routing="hash" appearance={{ elements: { rootBox: "w-full shadow-none", card: "shadow-none border border-gray-100 w-full" } }} />
          </div>
        </div>

        {/* Right Column: App Specific Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <HardDrive size={16} />
              </div>
              <h3 className="font-semibold text-gray-800">Storage Usage</h3>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
            ) : stats ? (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-800">{formatBytes(stats.usedBytes)}</span>
                  <span className="text-gray-400">{formatBytes(stats.limitBytes)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, usagePercent)}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  Storage includes all PDFs and Text files parsed and vectorized in your Knowledge Vault.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Failed to load stats</p>
            )}
          </div>

          <button onClick={() => signOut()} className="w-full flex items-center justify-center gap-2 py-3 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
        
      </div>
    </div>
  );
}


