import React, { useState, useEffect, useRef } from 'react';
import ClayButton from './ClayButton';
import { Copy, RefreshCw, Download, Share2, Smartphone, Square, Image as ImageIcon, FileText } from 'lucide-react';
import { Poem, Language, ShareTemplate } from '../types';
import { t } from '../translations';


declare global {
  interface Window {
    jspdf: any;
  }
}

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
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShareTemplate>(ShareTemplate.Story);
  
  const displayedPoem = useTypewriter(poem?.poem || t.poemError[language], 30);
  const isFinishedTyping = poem?.poem === displayedPoem;

  const getFullPoemText = () => {
      if (!poem) return '';
      const authorLine = authorName ? `\n\n- ${authorName}` : '';
      return `${poem.title}\n\n${poem.poem}${authorLine}`;
  }

  const handleCopy = () => {
    if (poem) {
      navigator.clipboard.writeText(getFullPoemText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      img.crossOrigin = "Anonymous";
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
            // let drawY = 0;
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
            // Post: Image Top 50%, Text Bottom 50% (More space for text in square if poem is long)
            const margin = 50 * scale;
            const contentWidth = width - margin * 2;
            
            // Draw Image (Top 50%)
            const imgTargetHeight = height * 0.5;
            const aspect = img.naturalWidth / img.naturalHeight;
            
            let drawW = width;
            let drawH = width / aspect;
            let drawX = 0;
            let drawY = 0;
            
            if (drawH < imgTargetHeight) {
                drawH = imgTargetHeight;
                drawW = drawH * aspect;
                drawX = (width - drawW) / 2;
            } else {
                drawY = (imgTargetHeight - drawH) / 2;
            }

            ctx.save();
            ctx.beginPath();
            ctx.rect(0,0, width, imgTargetHeight);
            ctx.clip();
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();

            // Text Background
            ctx.fillStyle = '#F0FDFA';
            ctx.fillRect(0, imgTargetHeight, width, height - imgTargetHeight);

            // Text Logic
            ctx.fillStyle = '#1F2937';
            ctx.textAlign = 'center';
            
            // Draw Title
            ctx.font = titleFontStr;
            const titleY = imgTargetHeight + 80 * scale;
            ctx.fillText(poem.title, width/2, titleY);
            
            // Calculate space for body
            const authorHeight = authorName ? 60 * scale : 0;
            const bodyStartY = titleY + 20 * scale; // Start slightly below title
            const maxBodyHeight = height - bodyStartY - margin - authorHeight;

            // Auto-fit Body
            const { fontSize, lines, lineHeight, totalHeight } = fitTextToArea(poem.poem, contentWidth, maxBodyHeight, baseBodyFontSize);

            ctx.font = `${fontSize}px "Times New Roman", serif`;
            // Center text block vertically in available space if it's short, otherwise start at top
            const verticalOffset = (maxBodyHeight - totalHeight) / 2;
            const actualStartY = bodyStartY + Math.max(0, verticalOffset);
            
            const textEndY = drawLines(ctx, lines, width/2, actualStartY + lineHeight, lineHeight);

            if (authorName) {
                ctx.font = creditFontStr;
                ctx.textAlign = 'center'; // Center author in Square mode usually looks better, or right
                ctx.fillText(`- ${authorName}`, width/2, height - margin/2);
            }

        } else {
            // Polaroid
            const margin = 60 * scale;
            const topMargin = 60 * scale;
            const imgSize = width - margin * 2; // Square image area
            
            // Draw Image
            ctx.save();
            ctx.beginPath();
            ctx.rect(margin, topMargin, imgSize, imgSize);
            ctx.clip();
            
            const aspect = img.naturalWidth / img.naturalHeight;
            let drawW = imgSize;
            let drawH = imgSize / aspect;
            let drawX = margin;
            let drawY = topMargin + (imgSize - drawH) / 2;
            if (aspect < 1) {
                drawH = imgSize;
                drawW = imgSize * aspect;
                drawY = topMargin;
                drawX = margin + (imgSize - drawW) / 2;
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();

            // Border Inner Shadow effect
            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 2;
            ctx.strokeRect(margin, topMargin, imgSize, imgSize);

            // Text Logic
            ctx.fillStyle = '#1F2937';
            ctx.textAlign = 'center';
            
            // Draw Title
            ctx.font = titleFontStr;
            const titleY = topMargin + imgSize + 80 * scale; // Space below image
            ctx.fillText(poem.title, width/2, titleY);
            
            // Calculate space for body
            const authorHeight = authorName ? 50 * scale : 0;
            const bottomPadding = 40 * scale;
            const bodyStartY = titleY + 20 * scale;
            
            // Available height for the poem body
            const maxBodyHeight = height - bodyStartY - authorHeight - bottomPadding;
            const contentWidth = width - margin * 2;

            // Auto-fit Body
            // Use Courier New for Polaroid feel
            const { fontSize, lines, lineHeight, totalHeight } = fitTextToArea(
                poem.poem, 
                contentWidth, 
                maxBodyHeight, 
                baseBodyFontSize, 
                '"Courier New", monospace'
            );
            
            ctx.font = `${fontSize}px "Courier New", monospace`;
            
            // If text is short, center it vertically in the whitespace, otherwise top align
            // (Optional: Polaroids usually look good top-aligned or centered. Let's center block if plenty of space)
            // const verticalBlockOffset = Math.max(0, (maxBodyHeight - totalHeight) / 2);
            const actualStartY = bodyStartY; // + verticalBlockOffset;

            const textEndY = drawLines(ctx, lines, width/2, actualStartY + lineHeight, lineHeight);

             if (authorName) {
                ctx.font = creditFontStr;
                // Place author dynamically below text, but ensure it doesn't fall off if calculation was tight
                const authorY = textEndY + 40 * scale; 
                ctx.fillText(`- ${authorName}`, width/2, authorY);
            }
        }

        // Download
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

  const handleDownloadPdf = async () => {
    if (!poem || !image) return;
    setIsDownloading(true);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Photo Verse", pageWidth / 2, 25, { align: "center" });
      
      const img = await loadImage(image);
      const availableWidth = pageWidth - margin * 2;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      let imgWidth = availableWidth;
      let imgHeight = imgWidth / aspectRatio;

      if (imgHeight > pageHeight * 0.45) {
        imgHeight = pageHeight * 0.45;
        imgWidth = imgHeight * aspectRatio;
      }

      const imgX = (pageWidth - imgWidth) / 2;
      const imgY = 35;

      doc.addImage(img, 'JPEG', imgX, imgY, imgWidth, imgHeight);
      
      const textStartY = imgY + imgHeight + 15;

      // Title
      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.text(poem.title, pageWidth / 2, textStartY, { align: "center" });
      
      // Poem
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      const splitPoem = doc.splitTextToSize(poem.poem, availableWidth);
      doc.text(splitPoem, pageWidth / 2, textStartY + 10, { align: "center", lineHeightFactor: 1.5 });
      
      if (authorName) {
        doc.setFont("times", "italic");
        doc.text(`- ${authorName}`, pageWidth - margin, textStartY + 10 + (splitPoem.length * 6) + 10, { align: "right" });
      }

      doc.save(`${poem.title.replace(/\s/g, '_')}-photo-verse.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("No se pudo generar el PDF.");
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <div className="w-full h-full flex flex-col bg-main-teal overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Controls & Info */}
          <div className="w-full md:w-1/3 lg:w-1/4 p-6 bg-main-teal border-b md:border-b-0 md:border-r border-shadow-dark flex flex-col z-10 shadow-xl">
            <h1 className="text-2xl font-bold text-surface mb-6">{poem?.title || t.generatingTitle[language]}</h1>
            
            <div className="mb-8">
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

            <div className="flex-1 overflow-y-auto mb-6 md:hidden">
                 {/* Mobile Text View */}
                 <div className="whitespace-pre-wrap text-surface font-sans text-sm leading-relaxed">
                    {displayedPoem}
                 </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
                 <ClayButton onClick={handleDownloadImage} color="accent" disabled={isDownloading || !isFinishedTyping} fullWidth>
                    <Download className="mr-2" size={20} /> {isDownloading ? t.generating[language] : t.downloadImage[language]}
                 </ClayButton>
                 
                 <div className="flex gap-2">
                    <ClayButton onClick={handleShareText} color="secondary" disabled={!isFinishedTyping} fullWidth className="text-sm px-2">
                        <Share2 className="mr-1" size={18} /> {t.share[language]}
                    </ClayButton>
                    <ClayButton onClick={handleDownloadPdf} color="secondary" disabled={!isFinishedTyping} fullWidth className="text-sm px-2">
                        <FileText className="mr-1" size={18} /> PDF
                    </ClayButton>
                 </div>
                 
                 <ClayButton onClick={onReset} fullWidth className="mt-2">
                    <RefreshCw className="mr-2" size={20} /> {t.createAnother[language]}
                 </ClayButton>
            </div>
          </div>

          {/* Right Panel: Preview Area */}
          <div className="hidden md:flex w-full md:w-2/3 lg:w-3/4 bg-surface/5 p-8 items-center justify-center overflow-y-auto relative">
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
             
             {/* Preview Container */}
             <div 
                className={`relative transition-all duration-500 ease-in-out shadow-2xl flex flex-col overflow-hidden ${
                    selectedTemplate === ShareTemplate.Story ? 'aspect-[9/16] h-[85vh] rounded-3xl bg-main-teal' : 
                    selectedTemplate === ShareTemplate.Square ? 'aspect-square h-[80vh] max-h-[800px] rounded-xl bg-surface' : 
                    'aspect-[4/5] h-[80vh] bg-white rounded-sm p-4 pb-12' // Polaroid
                }`}
             >
                {selectedTemplate === ShareTemplate.Story && (
                    <>
                        <div className="h-[55%] w-full relative">
                            {image && <img src={image} className="w-full h-full object-cover" alt="Preview" />}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-main-teal"></div>
                        </div>
                        <div className="flex-1 bg-surface rounded-t-[3rem] -mt-12 p-8 relative z-10 flex flex-col items-center text-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                            <h2 className="text-2xl font-bold text-text-dark font-serif mb-4">{poem?.title}</h2>
                            <p className="text-text-dark whitespace-pre-wrap font-serif text-sm leading-relaxed overflow-y-auto no-scrollbar flex-1">
                                {displayedPoem}
                            </p>
                            {authorName && <p className="text-text-light italic text-xs mt-4">- {authorName}</p>}
                        </div>
                    </>
                )}

                {selectedTemplate === ShareTemplate.Square && (
                    <>
                         <div className="h-[50%] w-full overflow-hidden">
                            {image && <img src={image} className="w-full h-full object-cover" alt="Preview" />}
                        </div>
                        <div className="h-[50%] w-full bg-surface p-6 flex flex-col items-center justify-center text-center">
                             <h2 className="text-xl font-bold text-text-dark font-serif mb-2">{poem?.title}</h2>
                             <p className="text-text-dark whitespace-pre-wrap font-serif text-sm leading-relaxed line-clamp-[8] flex-1 overflow-hidden">
                                {displayedPoem}
                            </p>
                             {authorName && <p className="text-text-light italic text-xs mt-2">- {authorName}</p>}
                        </div>
                    </>
                )}

                {selectedTemplate === ShareTemplate.Polaroid && (
                    <>
                         <div className="aspect-square w-full bg-gray-100 border border-gray-200 overflow-hidden mb-6">
                             {image && <img src={image} className="w-full h-full object-cover" alt="Preview" />}
                         </div>
                         <div className="flex-1 flex flex-col items-center text-center px-4 overflow-hidden">
                             <h2 className="text-2xl font-bold text-text-dark font-serif mb-2">{poem?.title}</h2>
                             <p className="text-text-dark whitespace-pre-wrap font-mono text-xs leading-relaxed flex-1 overflow-hidden">
                                {displayedPoem}
                            </p>
                             {authorName && <p className="text-text-light italic text-xs mt-2">- {authorName}</p>}
                         </div>
                    </>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default ResultScreen;