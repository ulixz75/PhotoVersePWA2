import React from 'react';
import { SelectionOption, Language } from '../types';

interface SelectionCardProps {
  option: SelectionOption;
  isSelected: boolean;
  onClick: () => void;
  language: Language;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ option, isSelected, onClick, language }) => {
  const stateClasses = isSelected 
    ? 'shadow-clay-sm-inset' 
    : 'shadow-clay-sm hover:scale-105';

  const iconAnimationClass = isSelected ? 'animate-icon-pop' : '';

  return (
    <>
      <style>{`
        @keyframes icon-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-icon-pop {
          animation: icon-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
      <button
        onClick={onClick}
        className={`flex-shrink-0 w-32 h-32 flex flex-col items-center justify-center rounded-4xl p-4 space-y-2 cursor-pointer transition-all duration-300 ease-in-out transform active:scale-95 focus:outline-none text-text-dark ${option.color} ${stateClasses}`}
      >
        <div className={`p-3 rounded-full transition-colors duration-300 ${option.colorLight} ${iconAnimationClass}`}>
          {React.cloneElement(option.icon, { className: 'transition-colors duration-300 text-text-dark' })}
        </div>
        <span className="font-semibold text-sm text-center">{option.label[language]}</span>
      </button>
    </>
  );
};

export default SelectionCard;