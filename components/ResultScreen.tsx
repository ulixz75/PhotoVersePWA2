import React, { useState, useEffect, useRef } from 'react';
import ClayButton from './ClayButton';
import { RefreshCw, Download, Share2, Smartphone, Square, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { Poem, Language, ShareTemplate } from '../types';
import { t } from '../translations';

interface ResultScreenProps {
  poem: Poem | null;
  image?: string | null;
  onReset: () => void;
  authorName?: string;
  language: Language;
}

const useTypewriter = (text: string | null, speed: number = 50): string => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        if (!text) {
            setDisplayText('');
            return;
        }
        
        setDisplayText('');
        let timeoutId: number;

        const typeCharacter = (index: number) => {
            if (index >= text.length) {
                return; 
            }
            setDisplayText(prev => text.substring(0, index + 1));
            timeoutId = window.setTimeout(() => typeCharacter(index + 1), speed);
        };
        
        const startTimeoutId = window.setTimeout(() => typeCharacter(0), 10);

        return () => {
            window.clearTimeout(timeoutId);
            window.clearTimeout(startTimeoutId);
        };
    }, [text, speed]);

    return displayText;
};


const ResultScreen: React.FC<ResultScreenProps> = ({ poem, image, onReset, authorName, language }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShareTemplate>(ShareTemplate.Story);
  
  // Single ref for the scrollable text area within the card (used for both mobile and desktop now)
  const textScrollRef = useRef<HTMLDivElement>(null);

  const displayedPoem = useTypewriter(poem?.poem || t.poemError[language], 30);
  const isFinishedTyping = poem?.poem === displayedPoem;

  // Auto-scroll effect
  useEffect(() => {
    if (textScrollRef.current) {
        textScrollRef.current.scrollTop = textScrollRef.current.scrollHeight;
    }
  }, [displayedPoem]);

  const getFullPoemText = () => {
      if (!poem) return '';
      const authorLine = authorName ? `\n\n- ${authorName}` : '';
      return `${poem.title}\n\n${poem.poem}${authorLine}`;
  }

  const handleCopy = () => {
    if (poem) {
      navigator.clipboard.writeText(getFullPoemText());
    }
  };

  const handleShareText = async () => {
    if (navigator.share && poem) {
      try {
        await navigator.share({
          title: poem.title,
          text: getFullPoemText(),
        });
      } catch (error) {
        // Ignore AbortError which happens when user cancels the share dialog
        if (error instanceof Error && error.name === 'AbortError') {
            return;
        }
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };
  
  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });

  // --- Canvas Generation Logic ---
  
  // Helper: Split text into lines based on max width
  const getLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const paragraphs = text.split('\n');
    let lines: string[] = [];

    paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ');
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
    });
    return lines;
  };

  // Helper: Draw lines and return final Y position
  const drawLines = (ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number) => {
      lines.forEach((line, index) => {
          ctx.fillText(line, x, y + (index * lineHeight));
      });
      return y + (lines.length * lineHeight);
  };

  const handleDownloadImage = async () => {
    if (!poem || !image) return;
    setIsDownloading(true);
    
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");

        const img = await loadImage(image);
        
        // Configuración basada en Template
        let width, height;
        const scale = 2; // Alta resolución

        if (selectedTemplate === ShareTemplate.Story) {
            width = 1080 * scale;
            height = 1920 * scale;
        } else if (selectedTemplate === ShareTemplate.Square) {
            width = 1080 * scale;
            height = 1080 * scale;
        } else {
            // Polaroid
            width = 1080 * scale;
            height = 1350 * scale; // 4:5 ratio para polaroid extendida
        }

        canvas.width = width;
        canvas.height = height;

        // Background
        ctx.fillStyle = '#F0FDFA'; // surface
        if (selectedTemplate === ShareTemplate.Story) ctx.fillStyle = '#14B8A6'; // main-teal for Story bg
        if (selectedTemplate === ShareTemplate.Polaroid) ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Base Fonts Configuration
        const titleFontSize = 48 * scale;
        const baseBodyFontSize = selectedTemplate === ShareTemplate.Polaroid ? 28 * scale : 32 * scale;
        const creditFontSize = 24 * scale;

        const titleFontStr = `bold ${titleFontSize}px "Times New Roman", serif`;
        const creditFontStr = `italic ${creditFontSize}px "Times New Roman", serif`;
        
        // --- Helper to auto-fit text ---
        const fitTextToArea = (
            text: string, 
            maxWidth: number, 
            maxHeight: number, 
            startFontSize: number,
            fontFace: string = '"Times New Roman", serif'
        ) => {
            let fontSize = startFontSize;
            let lines: string[] = [];
            let lineHeight = fontSize * 1.4;
            let totalHeight = 0;

            // Minimum font size to prevent unreadable text
            const minFontSize = 14 * scale; 

            do {
                ctx.font = `${fontSize}px ${fontFace}`;
                lineHeight = fontSize * 1.4;
                lines = getLines(ctx, text, maxWidth);
                totalHeight = lines.length * lineHeight;
                
                if (totalHeight > maxHeight && fontSize > minFontSize) {
                    fontSize -= 2; // Reduce font size
                } else {
                    break; // Fits or reached min size
                }
            } while (fontSize > minFontSize);

            return { fontSize, lines, lineHeight, totalHeight };
        };


        // --- Drawing Logic ---
        
        if (selectedTemplate === ShareTemplate.Story) {
            // Story: Img top half, Text bottom half card
            const imgHeight = height * 0.55;
            
            // Draw Image (cover)
            const aspect = img.naturalWidth / img.naturalHeight;
            let drawW = width;
            let drawH = width / aspect;
            let drawX = 0;
            if (drawH < imgHeight) {
                drawH = imgHeight;
                drawW = drawH * aspect;
                drawX = (width - drawW) / 2;
            }
            
            // Clip top area
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, width, imgHeight);
            ctx.clip();
            ctx.drawImage(img, drawX, 0, drawW, drawH);
            ctx.restore();

            // Text Container
            ctx.fillStyle = '#F0FDFA';
            ctx.beginPath();
            // Card floats a bit over the image
            const cardY = imgHeight - 80 * scale;
            const cardHeight = height - cardY - 60 * scale;
            
            ctx.roundRect(40 * scale, cardY, width - 80 * scale, cardHeight, 40 * scale);
            ctx.fill();
            ctx.shadowColor = "rgba(0,0,0,0.1)";
            ctx.shadowBlur = 20;

            // Text setup
            ctx.fillStyle = '#1F2937';
            ctx.textAlign = 'center';
            
            // Draw Title
            ctx.font = titleFontStr;
            const titleY = cardY + 120 * scale;
            ctx.fillText(poem.title, width / 2, titleY);

            // Calculate available space for body
            const footerSpace = 100 * scale; // Space for author
            const bodyStartY = titleY + 40 * scale;
            const maxBodyHeight = (cardY + cardHeight) - bodyStartY - footerSpace;
            const contentWidth = width - 160 * scale;

            // Auto-fit Body
            const { fontSize, lines, lineHeight } = fitTextToArea(poem.poem, contentWidth, maxBodyHeight, baseBodyFontSize);
            
            ctx.font = `${fontSize}px "Times New Roman", serif`;
            drawLines(ctx, lines, width / 2, bodyStartY + lineHeight, lineHeight);
            
            // Author
            if (authorName) {
                ctx.font = creditFontStr;
                ctx.fillText(`- ${authorName}`, width / 2, (cardY + cardHeight) - 50 * scale);
            }

        } else if (selectedTemplate === ShareTemplate.Square) {
            // Post: Mimic Polaroid logic (Reduced size + Contain)
            const margin = 50 * scale;
            const topMargin = 50 * scale;
            const maxImgSize = height * 0.45;
            const imgSize = maxImgSize;
            
            const imgX = (width - imgSize) / 2;
            const imgY = topMargin;

            // Draw Image
            ctx.save();
            ctx.beginPath();
            ctx.rect(imgX, imgY, imgSize, imgSize);
            ctx.clip();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(imgX, imgY, imgSize, imgSize);

            const aspect = img.naturalWidth / img.naturalHeight;
            let drawW = imgSize;
            let drawH = imgSize / aspect;
            let drawX = imgX;
            let drawY = imgY + (imgSize - drawH) / 2;
            
            if (aspect < 1) { // Portrait
                drawH = imgSize;
                drawW = imgSize * aspect;
                drawY = imgY;
                drawX = imgX + (imgSize - drawW) / 2;
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();

            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 2;
            ctx.strokeRect(imgX, imgY, imgSize, imgSize);

            // Text
            ctx.fillStyle = '#1F2937';
            ctx.textAlign = 'center';
            
            ctx.font = titleFontStr;
            const titleY = imgY + imgSize + 80 * scale;
            ctx.fillText(poem.title, width/2, titleY);
            
            const authorHeight = authorName ? 60 * scale : 0;
            const bodyStartY = titleY + 20 * scale;
            const bottomPadding = margin;
            const maxBodyHeight = height - bodyStartY - authorHeight - bottomPadding;
            const contentWidth = width - margin * 2;

            const { fontSize, lines, lineHeight } = fitTextToArea(poem.poem, contentWidth, maxBodyHeight, baseBodyFontSize);

            ctx.font = `${fontSize}px "Times New Roman", serif`;
            const textEndY = drawLines(ctx, lines, width/2, bodyStartY + lineHeight, lineHeight);

            if (authorName) {
                ctx.font = creditFontStr;
                const authorY = textEndY + 50 * scale;
                ctx.fillText(`- ${authorName}`, width/2, authorY);
            }

        } else {
            // Polaroid
            const margin = 60 * scale;
            const topMargin = 60 * scale;
            const maxImgSize = height * 0.45;
            const imgSize = Math.min(width - margin * 2, maxImgSize);
            const imgX = (width - imgSize) / 2;
            const imgY = topMargin;

            ctx.save();
            ctx.beginPath();
            ctx.rect(imgX, imgY, imgSize, imgSize);
            ctx.clip();
            
            const aspect = img.naturalWidth / img.naturalHeight;
            let drawW = imgSize;
            let drawH = imgSize / aspect;
            let drawX = imgX;
            let drawY = imgY + (imgSize - drawH) / 2;
            
            if (aspect < 1) {
                drawH = imgSize;
                drawW = imgSize * aspect;
                drawY = imgY;
                drawX = imgX + (imgSize - drawW) / 2;
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();

            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 2;
            ctx.strokeRect(imgX, imgY, imgSize, imgSize);

            ctx.fillStyle = '#1F2937';
            ctx.textAlign = 'center';
            
            ctx.font = titleFontStr;
            const titleY = imgY + imgSize + 80 * scale;
            ctx.fillText(poem.title, width/2, titleY);
            
            const authorHeight = authorName ? 50 * scale : 0;
            const bottomPadding = 40 * scale;
            const bodyStartY = titleY + 20 * scale;
            const maxBodyHeight = height - bodyStartY - authorHeight - bottomPadding;
            const contentWidth = width - margin * 2;

            const { fontSize, lines, lineHeight } = fitTextToArea(
                poem.poem, 
                contentWidth, 
                maxBodyHeight, 
                baseBodyFontSize, 
                '"Courier New", monospace'
            );
            
            ctx.font = `${fontSize}px "Courier New", monospace`;
            const textEndY = drawLines(ctx, lines, width/2, bodyStartY + lineHeight, lineHeight);

             if (authorName) {
                ctx.font = creditFontStr;
                const authorY = textEndY + 40 * scale; 
                ctx.fillText(`- ${authorName}`, width/2, authorY);
            }
        }

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `photoverse-${poem.title.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();

    } catch (e) {
        console.error("Failed to generate image", e);
    } finally {
        setIsDownloading(false);
    }
  };

  // Custom scrollbar hider styles
  const scrollbarHideStyles = {
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
  };

  // Helper to render scroll indicator overlay
  const ScrollIndicator = () => (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface via-surface/80 to-transparent pointer-events-none flex flex-col items-center justify-end pb-2 z-20">
        <ChevronDown className="text-main-teal animate-bounce opacity-70" size={24} />
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col-reverse md:flex-row bg-main-teal overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
      `}</style>
      
      {/* LEFT PANEL (Controls) - Bottom on Mobile, Left on Desktop */}
      <div className="w-full md:w-1/3 lg:w-1/4 p-4 md:p-6 bg-main-teal border-t md:border-t-0 md:border-r border-shadow-dark flex flex-col z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:shadow-xl shrink-0">
        {/* Title visible only on desktop to avoid duplication on mobile */}
        <h1 className="hidden md:block text-2xl font-bold text-surface mb-6">{poem?.title || t.generatingTitle[language]}</h1>
        
        <div className="mb-4 md:mb-8">
            <h3 className="text-surface/80 text-sm font-bold uppercase tracking-wider mb-3">{t.customizeView[language]}</h3>
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => setSelectedTemplate(ShareTemplate.Story)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${selectedTemplate === ShareTemplate.Story ? 'bg-surface text-main-teal shadow-clay-sm-inset' : 'bg-main-teal text-surface hover:bg-surface/10'}`}
                >
                    <Smartphone size={24} className="mb-1" />
                    <span className="text-xs">{t.templateStory[language]}</span>
                </button>
                <button 
                    onClick={() => setSelectedTemplate(ShareTemplate.Square)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${selectedTemplate === ShareTemplate.Square ? 'bg-surface text-main-teal shadow-clay-sm-inset' : 'bg-main-teal text-surface hover:bg-surface/10'}`}
                >
                    <Square size={24} className="mb-1" />
                    <span className="text-xs">{t.templateSquare[language]}</span>
                </button>
                <button 
                    onClick={() => setSelectedTemplate(ShareTemplate.Polaroid)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${selectedTemplate === ShareTemplate.Polaroid ? 'bg-surface text-main-teal shadow-clay-sm-inset' : 'bg-main-teal text-surface hover:bg-surface/10'}`}
                >
                    <ImageIcon size={24} className="mb-1" />
                    <span className="text-xs">{t.templatePolaroid[language]}</span>
                </button>
            </div>
        </div>

        {/* Buttons Section */}
        <div className="mt-auto flex flex-col gap-3">
             <ClayButton onClick={handleDownloadImage} color="accent" disabled={isDownloading || !isFinishedTyping} fullWidth>
                <Download className="mr-2" size={20} /> {isDownloading ? t.generating[language] : t.downloadImage[language]}
             </ClayButton>
             
             <ClayButton onClick={handleShareText} color="secondary" disabled={!isFinishedTyping} fullWidth className="text-sm px-2">
                <Share2 className="mr-1" size={18} /> {t.share[language]}
             </ClayButton>
             
             <ClayButton onClick={onReset} fullWidth className="mt-2">
                <RefreshCw className="mr-2" size={20} /> {t.createAnother[language]}
             </ClayButton>
        </div>
      </div>

      {/* RIGHT PANEL (Preview) - Top on Mobile, Right on Desktop */}
      <div className="flex-1 w-full md:w-2/3 lg:w-3/4 bg-surface/5 p-4 md:p-8 flex items-center justify-center overflow-y-auto relative min-h-0">
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
         
         {/* Unified Preview Container */}
         <div 
            className={`relative transition-all duration-500 ease-in-out shadow-2xl flex flex-col overflow-hidden ${
                selectedTemplate === ShareTemplate.Story ? 'aspect-[9/16] h-full md:h-[85vh] rounded-3xl bg-main-teal' : 
                selectedTemplate === ShareTemplate.Square ? 'aspect-square max-h-[60vh] md:max-h-[80vh] w-full max-w-[600px] md:max-w-none rounded-xl bg-surface' : 
                'aspect-[4/5] max-h-[60vh] md:max-h-[80vh] w-full max-w-[500px] md:max-w-none bg-white rounded-sm p-4 pb-12' // Polaroid
            }`}
         >
            {selectedTemplate === ShareTemplate.Story && (
                <>
                    <div className="h-[55%] w-full relative flex-none">
                        {image && <img src={image} className="w-full h-full object-cover" alt="Preview" />}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-main-teal"></div>
                    </div>
                    <div className="flex-1 bg-surface rounded-t-[3rem] -mt-12 pt-8 px-8 pb-4 relative z-10 flex flex-col items-center text-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] min-h-0">
                        <h2 className="text-2xl font-bold text-text-dark font-serif mb-4 flex-none">{poem?.title}</h2>
                        
                        {/* Story Scrollable Area */}
                        <div className="flex-1 w-full relative min-h-0">
                            <div 
                                ref={textScrollRef}
                                className="absolute inset-0 overflow-y-auto no-scrollbar pb-8"
                                style={scrollbarHideStyles}
                            >
                                 <p className="text-text-dark whitespace-pre-wrap font-serif text-sm leading-relaxed">
                                    {displayedPoem}
                                </p>
                            </div>
                            <ScrollIndicator />
                        </div>
                        
                        {authorName && <p className="text-text-light italic text-xs mt-4 flex-none">- {authorName}</p>}
                    </div>
                </>
            )}

            {selectedTemplate === ShareTemplate.Square && (
                <>
                     <div className="h-[45%] w-full flex items-center justify-center p-4 flex-none">
                        <div className="aspect-square h-full max-w-full bg-white border border-gray-200 shadow-sm overflow-hidden relative flex items-center justify-center">
                            {image && <img src={image} className="max-w-full max-h-full object-contain" alt="Preview" />}
                        </div>
                    </div>
                    <div className="flex-1 w-full bg-surface px-6 pb-6 flex flex-col items-center text-center overflow-hidden min-h-0">
                         <h2 className="text-xl font-bold text-text-dark font-serif mb-2 flex-none">{poem?.title}</h2>
                         
                         {/* Square Scrollable Area */}
                         <div className="flex-1 w-full relative min-h-0">
                            <div 
                                ref={textScrollRef}
                                className="absolute inset-0 overflow-y-auto no-scrollbar pb-8"
                                style={scrollbarHideStyles}
                            >
                                <p className="text-text-dark whitespace-pre-wrap font-serif text-sm leading-relaxed">
                                    {displayedPoem}
                                </p>
                            </div>
                            <ScrollIndicator />
                         </div>

                         {authorName && <p className="text-text-light italic text-xs mt-2 flex-none">- {authorName}</p>}
                    </div>
                </>
            )}

            {selectedTemplate === ShareTemplate.Polaroid && (
                <>
                     <div className="h-[45%] w-full flex items-center justify-center mb-6 flex-none">
                        <div className="aspect-square h-full bg-gray-100 border border-gray-200 overflow-hidden">
                            {image && <img src={image} className="w-full h-full object-cover" alt="Preview" />}
                        </div>
                     </div>
                     <div className="flex-1 w-full flex flex-col items-center text-center px-4 overflow-hidden min-h-0">
                         <h2 className="text-2xl font-bold text-text-dark font-serif mb-2 flex-none">{poem?.title}</h2>
                         
                         {/* Polaroid Scrollable Area */}
                         <div className="flex-1 w-full relative min-h-0">
                            <div 
                                ref={textScrollRef}
                                className="absolute inset-0 overflow-y-auto no-scrollbar pb-8"
                                style={scrollbarHideStyles}
                            >
                                <p className="text-text-dark whitespace-pre-wrap font-mono text-xs leading-relaxed">
                                    {displayedPoem}
                                </p>
                            </div>
                            <ScrollIndicator />
                         </div>

                         {authorName && <p className="text-text-light italic text-xs mt-2 flex-none">- {authorName}</p>}
                     </div>
                </>
            )}
         </div>
      </div>
    </div>
  );
};

export default ResultScreen;
