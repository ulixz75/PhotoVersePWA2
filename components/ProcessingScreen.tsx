import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { t } from '../translations';

interface ProcessingScreenProps {
  language: Language;
}

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ language }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = t.loadingMessages;

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.es.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.es.length]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-main-teal p-8 text-center text-surface">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-full rounded-full bg-surface/30"
            style={{
              animation: `pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          ></div>
        ))}
        <div className="w-16 h-16 bg-surface rounded-3xl shadow-clay-sm flex items-center justify-center">
            <div className="w-8 h-8 bg-primary rounded-2xl animate-spin" style={{animationDuration: '3s'}}/>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-8 text-surface">{t.creatingMagic[language]}</h2>
      <p className="text-surface/80 mt-2 transition-opacity duration-500">{messages[language][messageIndex]}</p>
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          80% {
             transform: scale(1.0);
          }
        }
      `}</style>
    </div>
  );
};

export default ProcessingScreen;