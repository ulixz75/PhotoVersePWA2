import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { GALLERY_EXAMPLES } from '../constants';
import { t } from '../translations';

interface GalleryScreenProps {
  onBack: () => void;
  language: Language;
}

const GalleryScreen: React.FC<GalleryScreenProps> = ({ onBack, language }) => {
  return (
    <div className="w-full h-full flex flex-col bg-main-teal overflow-hidden">
      {/* Header */}
      <header className="relative p-6 md:p-8 flex items-center border-b border-shadow-dark bg-main-teal z-10">
        <button 
          onClick={onBack}
          className="mr-4 p-2 rounded-full bg-main-teal shadow-clay-sm text-surface hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-surface flex items-center gap-2">
            <Sparkles className="text-accent" />
            {t.galleryTitle[language]}
            </h1>
            <p className="text-surface/80 text-sm">{t.gallerySubtitle[language]}</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {GALLERY_EXAMPLES.map((item) => (
            <div key={item.id} className="bg-surface rounded-3xl p-4 shadow-clay flex flex-col h-full transition-transform hover:-translate-y-2 duration-300">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-inner mb-4 relative group">
                <img 
                  src={item.imageUrl} 
                  alt={item.poem.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <span className="bg-surface/90 backdrop-blur text-text-dark text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                        {item.style}
                    </span>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-text-dark mb-2 font-serif">{item.poem.title}</h3>
                <div className="relative">
                    <p className="text-text-light text-sm whitespace-pre-wrap font-serif leading-relaxed italic mb-4">
                    "{item.poem.poem}"
                    </p>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-main-teal font-semibold uppercase tracking-wider flex items-center gap-1">
                        {item.mood}
                    </span>
                    <span className="text-xs text-gray-400 italic">
                        - {item.author}
                    </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 mb-6 text-center">
             <p className="text-surface/60 text-sm">
                {language === 'es' ? 'Generado con la magia de Gemini AI' : 'Generated with the magic of Gemini AI'}
             </p>
        </div>
      </main>
    </div>
  );
};

export default GalleryScreen;