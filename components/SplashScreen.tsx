import React from 'react';
import { Camera, Feather, Plus } from 'lucide-react';
import { Language } from '../types';
import { t } from '../translations';

interface SplashScreenProps {
  language: Language;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ language }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center overflow-hidden animate-color-pulse">
      <style>{`
        @keyframes color-pulse {
          0%, 100% { background-color: #F472B6; } /* primary */
          33% { background-color: #34D399; } /* secondary */
          66% { background-color: #FBBF24; } /* accent */
        }
        .animate-color-pulse { animation: color-pulse 6s ease-in-out infinite; }
      
        @keyframes slide-in-left {
          from { transform: translateX(-40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes text-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-camera { animation: slide-in-left 1s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .animate-plus { opacity: 0; animation: fade-in 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.5s forwards; }
        .animate-feather { animation: slide-in-right 1s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .animate-title { opacity: 0; animation: text-fade-in 1s cubic-bezier(0.25, 1, 0.5, 1) 1s forwards; }
        .animate-subtitle { opacity: 0; animation: text-fade-in 1s cubic-bezier(0.25, 1, 0.5, 1) 1.5s forwards; }
        .animate-slogan { opacity: 0; animation: text-fade-in 1s cubic-bezier(0.25, 1, 0.5, 1) 2s forwards; }
      `}</style>
      
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="animate-camera">
                <Camera size={64} className="text-surface drop-shadow-lg" />
            </div>
            <div className="animate-plus">
                <Plus size={48} className="text-surface/80 drop-shadow-lg" />
            </div>
            <div className="animate-feather">
                <Feather size={64} className="text-surface drop-shadow-lg" />
            </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-surface drop-shadow-xl mb-6 animate-title">
          Foto Verso
        </h1>

        <p className="text-lg md:text-xl font-semibold text-surface max-w-md drop-shadow-lg animate-subtitle">
          {t.splashSubtitle[language]}
        </p>
        <p className="text-sm md:text-base font-medium text-surface/80 mt-4 max-w-md drop-shadow-lg animate-slogan">
          {t.splashSlogan[language]}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;