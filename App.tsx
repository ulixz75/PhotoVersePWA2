
import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Asegúrate de que esta ruta sea correcta
import { Screen, PoemStyle, PoemMood, Poem, Language } from './types';
import SplashScreen from './components/SplashScreen';
import UploadScreen from './components/UploadScreen';
import ProcessingScreen from './components/ProcessingScreen';
import ResultScreen from './components/ResultScreen';
import GalleryScreen from './components/GalleryScreen';
import InstallPromptModal from './components/InstallPromptModal';
import { generatePoemFromImage } from './services/geminiService';

// Declara la API de comunicación con el Servicio de Delegación
declare global {
  interface Window {
    TwaAndroid?: {
      execute(service: string, action: string, args: any,
              onResult: (result: any) => void): void;
    };
  }
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.SPLASH);
  const [imageData, setImageData] = useState<{ url: string; base64: string; mimeType: string; } | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<PoemStyle | null>(null);
  const [selectedMood, setSelectedMood] = useState<PoemMood | null>(null);
  const [authorName, setAuthorName] = useState<string>('');
  const [poem, setPoem] = useState<Poem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('es');
  const [isTwa, setIsTwa] = useState(false);

  // Install Prompt State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Splash screen timer
    if (screen === Screen.SPLASH) {
      const timer = setTimeout(() => {
          setScreen(Screen.UPLOAD);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Logic to check if we should show the install modal
  const checkInstallEligibility = useCallback(() => {
      // 1. Check if already installed (Standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
      
      if (isStandalone) return;

      // 2. Check user preference
      const dontAsk = localStorage.getItem('installDismissed') === 'true';
      if (dontAsk) return;

      // 3. Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIosDevice);

      // 4. Logic for showing modal
      const sessionDismissed = sessionStorage.getItem('installSessionDismissed') === 'true';
      if (sessionDismissed) return;

      if (isIosDevice) {
          // For iOS, show immediately upon reaching home screen
          setShowInstallModal(true);
      } else {
          // For Android/Desktop, we check if the event was captured
          if (deferredPrompt) {
              setShowInstallModal(true);
          }
      }
  }, [deferredPrompt]);

  // Trigger check IMMEDIATELY when deferredPrompt is ready or component mounts (for iOS)
  // Removed dependency on Screen.UPLOAD to allow modal over Splash Screen
  useEffect(() => {
      checkInstallEligibility();
  }, [deferredPrompt, checkInstallEligibility]);

  useEffect(() => {
    // Listen for the 'beforeinstallprompt' event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e);
      console.log("beforeinstallprompt fired");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('utm_source') === 'twa') {
      setIsTwa(true);
    }

    // Handle return from ad using redirect method
    if (urlParams.get('adRewarded') === 'true') {
      console.log('Volviendo del anuncio recompensado'); // Log del script del usuario
      const savedState = sessionStorage.getItem('poemState');
      if (savedState) {
        try {
          const { savedImageData, savedStyle, savedMood, savedAuthorName, savedLanguage } = JSON.parse(savedState);
          
          if (savedImageData && savedStyle && savedMood) {
             // Restore state
             setImageData(savedImageData);
             setSelectedStyle(savedStyle);
             setSelectedMood(savedMood);
             setAuthorName(savedAuthorName);
             setLanguage(savedLanguage || 'es');
             
             // Trigger generation process directly
             setScreen(Screen.PROCESSING);
             setError(null);
             generatePoemFromImage(savedImageData.base64, savedImageData.mimeType, savedStyle, savedMood, savedLanguage || 'es')
                .then(generatedPoem => {
                  setPoem(generatedPoem);
                  setScreen(Screen.RESULT);
                })
                .catch(err => {
                  const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
                  setError(`Error al generar el poema: ${errorMessage}`);
                  setScreen(Screen.UPLOAD);
                });
          } else {
             setError("Los datos guardados estaban incompletos. Por favor, inténtalo de nuevo.");
             setScreen(Screen.UPLOAD);
          }
        } catch (e) {
          console.error("Failed to parse or restore state from sessionStorage", e);
          setError("Hubo un problema al restaurar tu sesión. Por favor, inténtalo de nuevo.");
          setScreen(Screen.UPLOAD);
        } finally {
          sessionStorage.removeItem('poemState');
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('adRewarded');
          if (newUrl.pathname.includes('/create')) {
              newUrl.pathname = '/';
          }
          window.history.replaceState({}, document.title, newUrl.toString());
        }
      } else {
        setError("No se encontró la sesión guardada después del anuncio. Por favor, inténtalo de nuevo.");
        setScreen(Screen.UPLOAD);
      }
    }
  }, []); // Run only once on mount

  const executePoemGeneration = useCallback(async () => {
    if (!imageData || !selectedStyle || !selectedMood) {
      setError("Por favor, selecciona una imagen, un estilo y un estado de ánimo.");
      return;
    }
    setScreen(Screen.PROCESSING);
    setError(null);
    try {
      const generatedPoem = await generatePoemFromImage(imageData.base64, imageData.mimeType, selectedStyle, selectedMood, language);
      setPoem(generatedPoem);
      setScreen(Screen.RESULT);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      setError(`Error al generar el poema: ${errorMessage}`);
      setScreen(Screen.UPLOAD);
    }
  }, [imageData, selectedStyle, selectedMood, language]);

  const handlePoemGeneration = useCallback(() => {
    if (isTwa) {
      const stateToSave = {
        savedImageData: imageData,
        savedStyle: selectedStyle,
        savedMood: selectedMood,
        savedAuthorName: authorName,
        savedLanguage: language,
      };
      sessionStorage.setItem('poemState', JSON.stringify(stateToSave));
      
      const appBaseUrl = 'https://photoverse-app-265715129860.us-west1.run.app';
      // URL a la que volveremos después del anuncio (de acuerdo al script del usuario)
      const returnUrlRaw = `${appBaseUrl}/create?adRewarded=true`;
      const returnUrl = encodeURIComponent(returnUrlRaw);
      
      // URL callback que la TWA interceptará para mostrar el anuncio
      const callback = `${appBaseUrl}/.well-known/twa-callbacks/showRewardAd?returnUrl=${returnUrl}`;
      
      console.log('Navegando a:', callback); // para debug
      
      // Navegar a la URL callback (esto será interceptado por la TWA)
      window.location.href = callback;
    } else {
      console.log("No estamos en TWA. Generando poema directamente.");
      executePoemGeneration();
    }
  }, [isTwa, executePoemGeneration, imageData, selectedStyle, selectedMood, authorName, language]);

  const handleReset = () => {
    setScreen(Screen.UPLOAD);
    setImageData(null);
    setSelectedStyle(null);
    setSelectedMood(null);
    setPoem(null);
    setError(null);
    setAuthorName('');
  };

  // --- Install Handlers ---
  const handleInstallClick = async () => {
      if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
              console.log('User accepted the install prompt');
              setDeferredPrompt(null);
          }
          setShowInstallModal(false);
      }
  };

  const handleInstallModalClose = (dontAskAgain: boolean) => {
      setShowInstallModal(false);
      sessionStorage.setItem('installSessionDismissed', 'true');
      if (dontAskAgain) {
          localStorage.setItem('installDismissed', 'true');
      }
  };

  const renderScreen = () => {
    switch (screen) {
      case Screen.SPLASH:
        return <SplashScreen language={language} />;
      case Screen.UPLOAD:
        return (
          <UploadScreen
            onGenerate={handlePoemGeneration}
            onViewGallery={() => setScreen(Screen.GALLERY)}
            imageData={imageData}
            setImageData={setImageData}
            selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle}
            selectedMood={selectedMood}
            setSelectedMood={setSelectedMood}
            authorName={authorName}
            setAuthorName={setAuthorName}
            error={error}
            language={language}
            setLanguage={setLanguage}
          />
        );
      case Screen.PROCESSING:
        return <ProcessingScreen language={language} />;
      case Screen.RESULT:
        return <ResultScreen poem={poem} image={imageData?.url} onReset={handleReset} authorName={authorName} language={language} />;
      case Screen.GALLERY:
        return <GalleryScreen onBack={() => setScreen(Screen.UPLOAD)} language={language} />;
      default:
        return <SplashScreen language={language} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans p-4 bg-main-teal">
      <div className="w-full max-w-6xl h-auto min-h-[90vh] bg-main-teal shadow-clay rounded-4xl flex flex-col overflow-hidden transition-all duration-500 my-8 relative">
        {renderScreen()}
      </div>
      
      {/* Install Modal MOVED OUTSIDE the main container to avoid CSS clipping and transform issues */}
      <InstallPromptModal 
          isOpen={showInstallModal}
          onClose={handleInstallModalClose}
          onInstall={handleInstallClick}
          isIOS={isIOS}
          language={language}
      />
    </div>
  );
};

export default App;
