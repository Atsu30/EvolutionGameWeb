
import React, { useState } from 'react';
import { Sticker, CropOffset } from '../types';

interface StickerCardProps {
  sticker: Sticker;
  onToggleSelect: (id: string) => void;
  onProcess: (id: string) => void;
  onReCrop: (id: string, offset: CropOffset) => void;
}

const STEP = 2;

const StickerCard: React.FC<StickerCardProps> = ({ sticker, onToggleSelect, onProcess, onReCrop }) => {
  const [showAdjust, setShowAdjust] = useState(false);
  const [offset, setOffset] = useState<CropOffset>(sticker.cropOffset);

  const updateOffset = (key: keyof CropOffset, delta: number) => {
    setOffset(prev => ({ ...prev, [key]: prev[key] + delta }));
  };

  const handleReCrop = () => {
    onReCrop(sticker.id, offset);
  };

  const hasOffset = offset.top !== 0 || offset.right !== 0 || offset.bottom !== 0 || offset.left !== 0;

  return (
    <div className={`relative group border-2 rounded-xl overflow-hidden transition-all duration-300 ${sticker.isSelected ? 'border-line-500 ring-2 ring-line-200' : 'border-slate-200 hover:border-slate-300'}`}>
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

      <div className="p-3 bg-white space-y-2">
        <div className="flex justify-between items-center">
          <button
            onClick={() => onProcess(sticker.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${sticker.processedUrl ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700 hover:bg-line-50 hover:text-line-700'}`}
          >
            {sticker.processedUrl ? '透過済み' : '背景を透過'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdjust(v => !v)}
              className={`p-1.5 rounded-lg transition-colors ${showAdjust ? 'bg-line-100 text-line-700' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
              title="切り取り微調整"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M12 3v14m0 0l-4-4m4 4l4-4M3 7v10M21 7v10" />
              </svg>
            </button>
            <input
              type="checkbox"
              checked={sticker.isSelected}
              onChange={() => onToggleSelect(sticker.id)}
              className="w-5 h-5 text-line-600 rounded border-slate-300 focus:ring-line-500"
            />
          </div>
        </div>

        {showAdjust && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {/* Directional pad layout */}
            <div className="flex flex-col items-center gap-1">
              {/* Top */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-slate-400 w-5 text-right">上</span>
                <button onClick={() => updateOffset('top', -STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center">−</button>
                <span className="w-8 text-center text-[10px] font-bold text-slate-600">{offset.top}</span>
                <button onClick={() => updateOffset('top', STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center">+</button>
              </div>
              {/* Left & Right */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-400 w-5 text-right">左</span>
                  <button onClick={() => updateOffset('left', -STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center">−</button>
                  <span className="w-8 text-center text-[10px] font-bold text-slate-600">{offset.left}</span>
                  <button onClick={() => updateOffset('left', STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center">+</button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-400 w-5 text-right">右</span>
                  <button onClick={() => updateOffset('right', -STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center">−</button>
                  <span className="w-8 text-center text-[10px] font-bold text-slate-600">{offset.right}</span>
                  <button onClick={() => updateOffset('right', STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center">+</button>
                </div>
              </div>
              {/* Bottom */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-slate-400 w-5 text-right">下</span>
                <button onClick={() => updateOffset('bottom', -STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center">−</button>
                <span className="w-8 text-center text-[10px] font-bold text-slate-600">{offset.bottom}</span>
                <button onClick={() => updateOffset('bottom', STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center">+</button>
              </div>
            </div>
            <button
              onClick={handleReCrop}
              disabled={!hasOffset}
              className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-black rounded-lg transition-colors uppercase tracking-wider"
            >
              再切り取り
            </button>
          </div>
        )}
      </div>

      {sticker.isSelected && (
        <div className="absolute top-2 right-2 bg-line-500 text-white rounded-full p-1 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default StickerCard;
