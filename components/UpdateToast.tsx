import React from 'react';
import { RefreshCw } from 'lucide-react';
import { t } from '../translations';
import { Language } from '../types';

interface UpdateToastProps {
  onUpdate: () => void;
  language: Language;
}

const UpdateToast: React.FC<UpdateToastProps> = ({ onUpdate, language }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
        <div className="bg-text-dark text-surface rounded-2xl shadow-clay p-4 flex items-center gap-4 border border-surface/10 max-w-sm">
            <div className="bg-accent p-2 rounded-full text-text-dark">
                <RefreshCw size={20} className="animate-spin-slow" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">{t.newVersionTitle[language]}</h4>
                <p className="text-xs text-surface/70">{t.newVersionDesc[language]}</p>
            </div>
            <button 
                onClick={onUpdate}
                className="px-4 py-2 bg-main-teal text-white rounded-xl text-sm font-bold shadow-lg hover:bg-shadow-dark transition-colors"
            >
                {t.updateNow[language]}
            </button>
        </div>
        <style>{`
            @keyframes slide-up {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            .animate-spin-slow { animation: spin 3s linear infinite; }
        `}</style>
    </div>
  );
};

export default UpdateToast;
