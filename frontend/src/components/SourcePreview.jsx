import { X, FileText, ExternalLink, Info } from 'lucide-react';

export default function SourcePreview({ source, onClose }) {
  if (!source) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-lg animate-in slide-in-from-right-8 duration-300">
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
        <h2 className="font-bold text-gray-800 text-[15px]">Source Preview</h2>
        <button 
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-red-50 text-red-500 p-2.5 rounded-lg shrink-0">
              <FileText size={24} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm break-all">{source.fileName}</h3>
              <p className="text-xs text-gray-500 mt-1">Source Document</p>
            </div>
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-colors">
            <ExternalLink size={14} /> Open Document
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Info size={14} /> Exact Highlight
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <p className="text-sm text-gray-800 leading-relaxed font-serif">
              "{source.text}"
            </p>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-[11px] text-gray-400 font-medium">Relevance Score</div>
              <div className="text-[11px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">High Match</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
