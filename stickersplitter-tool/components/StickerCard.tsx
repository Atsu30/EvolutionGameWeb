
import React from 'react';
import { Sticker } from '../types';

interface StickerCardProps {
  sticker: Sticker;
  onToggleSelect: (id: string) => void;
  onProcess: (id: string) => void;
}

const StickerCard: React.FC<StickerCardProps> = ({ sticker, onToggleSelect, onProcess }) => {
  return (
    <div className={`relative group border-2 rounded-xl overflow-hidden transition-all duration-300 ${sticker.isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300'}`}>
      <div 
        className="aspect-square bg-[url('https://www.transparenttextures.com/patterns/graphy-light.png')] bg-slate-100 flex items-center justify-center p-2 cursor-pointer"
        onClick={() => onToggleSelect(sticker.id)}
      >
        <img 
          src={sticker.processedUrl || sticker.url} 
          alt="Sticker" 
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      <div className="p-3 bg-white flex justify-between items-center">
        <button 
          onClick={() => onProcess(sticker.id)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${sticker.processedUrl ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
        >
          {sticker.processedUrl ? '透過済み' : '背景を透過'}
        </button>
        
        <input 
          type="checkbox" 
          checked={sticker.isSelected} 
          onChange={() => onToggleSelect(sticker.id)}
          className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
        />
      </div>

      {sticker.isSelected && (
        <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default StickerCard;
