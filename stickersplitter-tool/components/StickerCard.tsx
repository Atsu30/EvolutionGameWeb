
import React, { useState } from 'react';
import { Sticker, CropOffset } from '../types';

interface StickerCardProps {
  sticker: Sticker;
  onToggleSelect: (id: string) => void;
  onProcess: (id: string) => void;
  onReCrop: (id: string, offset: CropOffset) => void;
  onResize: (id: string) => void;
}

const STEP = 2;

const StickerCard: React.FC<StickerCardProps> = ({ sticker, onToggleSelect, onProcess, onReCrop, onResize }) => {
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
          src={sticker.resizedUrl || sticker.processedUrl || sticker.url}
          alt="Sticker"
          className="max-w-full max-h-full object-contain"
        />
      </div>

      <div className="p-3 bg-white space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => onProcess(sticker.id)}
              className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${sticker.processedUrl ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700 hover:bg-line-50 hover:text-line-700'}`}
            >
              {sticker.processedUrl ? '透過済' : '透過'}
            </button>
            <button
              onClick={() => onResize(sticker.id)}
              className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${sticker.resizedUrl ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'}`}
            >
              {sticker.resizedUrl ? '370x320' : 'リサイズ'}
            </button>
          </div>

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
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center">
              {(['top', 'left', 'right', 'bottom'] as const).map((dir) => {
                const label = { top: '上', left: '左', right: '右', bottom: '下' }[dir];
                return (
                  <React.Fragment key={dir}>
                    <span className="text-[9px] font-bold text-slate-400 text-right">{label}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateOffset(dir, -STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center flex-shrink-0">−</button>
                      <span className="flex-1 text-center text-[10px] font-bold text-slate-600">{offset[dir]}</span>
                      <button onClick={() => updateOffset(dir, STEP)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-500 flex items-center justify-center flex-shrink-0">+</button>
                    </div>
                  </React.Fragment>
                );
              })}
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
