import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Download, X, Share, PlusSquare } from 'lucide-react';
import ClayButton from './ClayButton';
import { t } from '../translations';
import { Language } from '../types';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: (dontAskAgain: boolean) => void;
  onInstall: () => void;
  isIOS: boolean;
  language: Language;
}

const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ isOpen, onClose, onInstall, isIOS, language }) => {
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (isIOS) {
        setShowIOSInstructions(true);
    }
  }, [isIOS]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-main-teal/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-main-teal w-full max-w-md rounded-4xl shadow-clay p-6 relative flex flex-col items-center text-center animate-slide-up">
        {/* Close Button */}
        <button 
          onClick={() => onClose(false)}
          className="absolute top-4 right-4 text-surface/60 hover:text-surface transition-colors"
        >
          <X size={24} />
        </button>

        {/* Icon Header */}
        <div className="w-20 h-20 bg-surface rounded-3xl shadow-clay-sm flex items-center justify-center mb-6">
            <img src="/icon.svg" alt="App Icon" className="w-12 h-12" />
        </div>

        <h2 className="text-2xl font-bold text-surface mb-2">{t.installTitle[language]}</h2>
        <p className="text-surface/80 mb-6 text-sm leading-relaxed">
          {t.installSubtitle[language]}
        </p>

        {/* Compatibility Icons */}
        <div className="flex flex-col items-center gap-2 mb-8 w-full">
           <span className="text-surface/60 text-xs font-bold uppercase tracking-widest">{t.compatibleWith[language]}</span>
           <div className="flex gap-4 justify-center">
                <div className="flex flex-col items-center gap-1 text-surface/80">
                    <Smartphone size={20} />
                    <span className="text-[10px]">Android / iOS</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-surface/80">
                    <Monitor size={20} />
                    <span className="text-[10px]">Web</span>
                </div>
           </div>
        </div>

        {/* iOS Specific Instructions */}
        {showIOSInstructions ? (
           <div className="bg-surface/10 rounded-2xl p-4 mb-6 w-full text-left">
                <h3 className="text-surface font-bold text-sm mb-3 text-center">{t.iosInstructionsTitle[language]}</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-surface/90 text-sm">
                        <div className="bg-surface/20 p-1.5 rounded-lg">
                             <Share size={18} />
                        </div>
                        <span>{t.iosStep1[language]}</span>
                    </div>
                    <div className="flex items-center gap-3 text-surface/90 text-sm">
                        <div className="bg-surface/20 p-1.5 rounded-lg">
                             <PlusSquare size={18} />
                        </div>
                         <span>{t.iosStep2[language]}</span>
                    </div>
                </div>
           </div>
        ) : (
            <div className="w-full mb-4">
                <ClayButton onClick={onInstall} color="accent" fullWidth>
                    <Download className="mr-2" size={20} /> {t.installNow[language]}
                </ClayButton>
            </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2">
            {!showIOSInstructions && (
                 <button 
                    onClick={() => onClose(false)}
                    className="py-3 text-surface/80 font-semibold text-sm hover:text-surface transition-colors"
                >
                    {t.remindLater[language]}
                </button>
            )}
            
            {showIOSInstructions && (
                 <button 
                    onClick={() => onClose(false)}
                    className="px-6 py-3 bg-white/10 rounded-2xl text-surface font-semibold text-sm hover:bg-white/20 transition-colors w-full"
                >
                    {t.remindLater[language]}
                </button>
            )}

            <button 
                onClick={() => onClose(true)}
                className="py-2 text-surface/40 text-xs hover:text-surface/60 transition-colors"
            >
                {t.dontAsk[language]}
            </button>
        </div>

      </div>
      
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default InstallPromptModal;
