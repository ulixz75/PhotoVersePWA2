import React, { useRef } from 'react';
import { PoemStyle, PoemMood, Language } from '../types';
import { POEM_STYLES, POEM_MOODS } from '../constants';
import ClayButton from './ClayButton';
import SelectionCard from './SelectionCard';
import { ImageUp, Camera, X, Sparkles } from 'lucide-react';
import { t } from '../translations';

interface UploadScreenProps {
  onGenerate: () => void;
  onViewGallery: () => void;
  imageData: { url: string } | null;
  setImageData: (data: { url: string; base64: string; mimeType: string; } | null) => void;
  selectedStyle: PoemStyle | null;
  setSelectedStyle: (style: PoemStyle) => void;
  selectedMood: PoemMood | null;
  setSelectedMood: (mood: PoemMood) => void;
  authorName: string;
  setAuthorName: (name: string) => void;
  error: string | null;
  language: Language;
  setLanguage: (language: Language) => void;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-bold text-surface mb-4">{children}</h2>
);

const UploadScreen: React.FC<UploadScreenProps> = ({
  onGenerate,
  onViewGallery,
  imageData,
  setImageData,
  selectedStyle,
  setSelectedStyle,
  selectedMood,
  setSelectedMood,
  authorName,
  setAuthorName,
  error,
  language,
  setLanguage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const base64 = url.split(',')[1];
        setImageData({ url, base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const isReady = !!imageData && !!selectedStyle && !!selectedMood;

  return (
    <div className="w-full h-full flex flex-col bg-main-teal overflow-hidden">
      <header className="relative p-6 md:p-8 text-center border-b border-shadow-dark">
        <h1 className="text-3xl font-bold text-surface">{t.createPoemTitle[language]}</h1>
        <p className="text-surface/80 mt-1">{t.createPoemSubtitle[language]}</p>
        <div className="absolute top-4 right-4">
          <button onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} className="px-4 py-2 rounded-2xl bg-surface/10 text-surface font-semibold shadow-clay-sm-inset hover:bg-surface/20 transition-colors">
            {language === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Columna de Imagen */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md">
              {imageData ? (
                <div className="relative w-full aspect-[4/3] rounded-4xl shadow-clay-sm-inset p-2 bg-main-teal">
                  <img src={imageData.url} alt="Vista previa" className="w-full h-full object-cover rounded-3xl" />
                  <button onClick={() => setImageData(null)} className="absolute top-4 right-4 bg-surface/80 rounded-full p-2 shadow-clay-sm backdrop-blur-sm hover:scale-110 transition-transform">
                    <X className="text-text-dark" size={20}/>
                  </button>
                </div>
              ) : (
                <div className="w-full min-h-[26rem] md:min-h-0 md:aspect-[4/3] rounded-4xl bg-main-teal shadow-clay-sm-inset flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <input type="file" accept="image/*" capture="user" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
                  
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 z-10">
                      <ClayButton onClick={() => fileInputRef.current?.click()} fullWidth={false}>
                          <ImageUp className="mr-2" size={20}/> {t.gallery[language]}
                      </ClayButton>
                      <ClayButton onClick={() => cameraInputRef.current?.click()} fullWidth={false} color="secondary">
                          <Camera className="mr-2" size={20}/> {t.camera[language]}
                      </ClayButton>
                  </div>
                  <p className="text-surface/80 mt-4 text-sm z-10">{t.selectOrTakePhoto[language]}</p>

                  <div className="mt-8 z-10">
                    <button 
                        onClick={onViewGallery}
                        className="flex items-center gap-2 px-5 py-2 bg-white/10 rounded-full text-surface text-sm font-semibold hover:bg-white/20 transition-colors border border-white/20"
                    >
                        <Sparkles size={16} className="text-accent" />
                        {t.viewGallery[language]}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Columna de Selecciones */}
          <div className="space-y-6 md:space-y-8 mt-6 md:mt-0">
            <section>
              <SectionTitle>{t.chooseStyle[language]}</SectionTitle>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {POEM_STYLES.map(style => (
                  <SelectionCard key={style.id} option={style} isSelected={selectedStyle === style.id} onClick={() => setSelectedStyle(style.id as PoemStyle)} language={language} />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>{t.chooseMood[language]}</SectionTitle>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {POEM_MOODS.map(mood => (
                  <SelectionCard key={mood.id} option={mood} isSelected={selectedMood === mood.id} onClick={() => setSelectedMood(mood.id as PoemMood)} language={language} />
                ))}
              </div>
            </section>
            
            <section>
              <SectionTitle>{t.signWork[language]}</SectionTitle>
              <input
                type="text"
                placeholder={t.authorPlaceholder[language]}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full h-14 px-6 rounded-3xl bg-main-teal text-surface placeholder-surface/60 shadow-clay-sm-inset border border-shadow-dark focus:outline-none focus:ring-2 focus:ring-surface/50 transition-all"
              />
            </section>
          </div>
        </div>
      </main>

      <footer className="p-6 md:p-8 bg-main-teal/80 backdrop-blur-sm border-t border-shadow-dark mt-auto">
        {error && <p className="text-red-500 text-center text-sm mb-3">{error}</p>}
        <div className="max-w-md mx-auto">
          <ClayButton onClick={onGenerate} disabled={!isReady}>
            {t.generatePoem[language]}
          </ClayButton>
        </div>
      </footer>
    </div>
  );
};

export default UploadScreen;
