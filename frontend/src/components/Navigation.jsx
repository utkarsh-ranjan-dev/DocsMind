import { MessageSquare, FileText, Layers, Clock, BarChart2, Settings, Sparkles } from 'lucide-react';
import { Show, SignInButton, UserButton } from '@clerk/react';

export default function Navigation({ activeTab, setActiveTab, stats }) {
  const navItems = [
    { name: 'Chat', icon: <MessageSquare size={18} /> },
    { name: 'Documents', icon: <FileText size={18} /> },
    { name: 'Collections', icon: <Layers size={18} /> },
    { name: 'History', icon: <Clock size={18} /> },
    { name: 'Insights', icon: <BarChart2 size={18} /> },
    { name: 'Settings', icon: <Settings size={18} /> },
  ];

  const usedGB = (stats.usedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const limitGB = (stats.limitBytes / (1024 * 1024 * 1024)).toFixed(0);
  const percent = Math.min(100, Math.round((stats.usedBytes / stats.limitBytes) * 100)) || 0;

  return (
    <div className="w-64 flex flex-col bg-white border-r border-gray-200 h-full p-4 justify-between shrink-0">
      <div>
        <div className="flex items-center justify-between font-bold text-lg mb-8 text-blue-600 px-2">
          <div className="flex items-center gap-2">
             <Sparkles className="fill-blue-600" /> DocsMind
          </div>
          
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.name ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="space-y-4">
        <Show when="signed-out">
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Sign in to sync your data</h3>
            <SignInButton mode="modal">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 rounded-lg transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          <div className="border border-blue-100 border-dashed rounded-xl p-4 bg-white shadow-sm">
            <div className="text-xs font-semibold text-gray-500 mb-1">Storage Used</div>
            <div className="text-xs text-gray-400 mb-2">{usedGB} GB / {limitGB} GB</div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
            </div>
            <div className="text-right text-[10px] text-gray-400 mt-1">{percent}%</div>
          </div>
        </Show>
      </div>
    </div>
  );
}

