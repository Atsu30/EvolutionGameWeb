
import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { splitImage, reCropCell, removeBackground, resizeImage } from '../utils/image';
import { Sticker, CropOffset } from '../types';
import StickerCard from './StickerCard';
import LineChatPreview from './LineChatPreview';

const SplitterTab: React.FC = () => {
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(4);
  const [tolerance, setTolerance] = useState<number>(30);
  const [removeInterior, setRemoveInterior] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [originalSheetUrl, setOriginalSheetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showChatPreview, setShowChatPreview] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalSheetUrl(event.target?.result as string);
        setStickers([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('画像の読み込みに失敗しました。');
    }
  };

  const handleSplit = async () => {
    if (!originalSheetUrl) return;

    setIsProcessing(true);
    setError(null);
    try {
      const croppedUrls = await splitImage(originalSheetUrl, rows, cols);

      const newStickers: Sticker[] = croppedUrls.map((url, index) => ({
        id: `sticker-${Date.now()}-${index}`,
        url,
        isSelected: true,
        row: Math.floor(index / cols),
        col: index % cols,
        cropOffset: { top: 0, right: 0, bottom: 0, left: 0 },
      }));
      setStickers(newStickers);
    } catch (err: any) {
      setError('画像の分割に失敗しました。画像の形式やグリッド設定を確認してください。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessBackground = async (id: string) => {
    const target = stickers.find(s => s.id === id);
    if (!target) return;
    try {
      const processed = await removeBackground(target.url, tolerance, removeInterior);
      setStickers(prev => prev.map(s => s.id === id ? { ...s, processedUrl: processed } : s));
    } catch (err) {
      console.error('Processing error:', err);
    }
  };

  const processAllSelected = async () => {
    setIsProcessing(true);
    const selected = stickers.filter(s => s.isSelected);
    for (const s of selected) {
      await handleProcessBackground(s.id);
    }
    setIsProcessing(false);
  };

  const handleResize = async (id: string) => {
    const target = stickers.find(s => s.id === id);
    if (!target) return;
    try {
      const source = target.processedUrl || target.url;
      const resized = await resizeImage(source, 370, 320);
      setStickers(prev => prev.map(s => s.id === id ? { ...s, resizedUrl: resized } : s));
    } catch (err) {
      console.error('Resize error:', err);
    }
  };

  const resizeAllSelected = async () => {
    setIsProcessing(true);
    const selected = stickers.filter(s => s.isSelected);
    for (const s of selected) {
      await handleResize(s.id);
    }
    setIsProcessing(false);
  };

  const downloadSelected = async () => {
    const selected = stickers.filter(s => s.isSelected);
    if (selected.length === 0) return;

    const zip = new JSZip();
    const pad = selected.length >= 100 ? 3 : 2;

    await Promise.all(
      selected.map(async (s, i) => {
        const dataUrl = s.resizedUrl || s.processedUrl || s.url;
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const name = String(i).padStart(pad, '0') + '.png';
        zip.file(name, blob);
      })
    );

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stickers.zip';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReCrop = async (id: string, offset: CropOffset) => {
    if (!originalSheetUrl) return;
    const target = stickers.find(s => s.id === id);
    if (!target) return;
    try {
      const newUrl = await reCropCell(originalSheetUrl, target.row, target.col, rows, cols, offset);
      setStickers(prev => prev.map(s =>
        s.id === id ? { ...s, url: newUrl, processedUrl: undefined, cropOffset: offset } : s
      ));
    } catch (err) {
      console.error('Re-crop error:', err);
    }
  };

  const toggleSelect = (id: string) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, isSelected: !s.isSelected } : s));
  };

  const reset = () => {
    setOriginalSheetUrl(null);
    setStickers([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Config Panel */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tighter italic">
              <span className="bg-line-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] not-italic shadow-md">01</span>
              シートをアップロード
            </h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`group relative w-full aspect-video rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${originalSheetUrl ? 'border-line-400 bg-line-50/20' : 'border-slate-200 bg-slate-50 hover:border-line-400 hover:bg-line-50'}`}
            >
              {originalSheetUrl ? (
                <img src={originalSheetUrl} alt="Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center p-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">画像を選択</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
            {originalSheetUrl && (
              <button onClick={reset} className="mt-4 w-full text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                画像をリセット
              </button>
            )}
          </section>

          <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tighter italic">
              <span className="bg-line-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] not-italic shadow-md">02</span>
              分割設定
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">行数 (Rows)</label>
                  <input
                    type="number"
                    value={rows}
                    onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black text-center focus:ring-2 focus:ring-line-400 outline-none"
                  />
                </div>
                <div className="text-slate-300 font-black mt-4">&times;</div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">列数 (Cols)</label>
                  <input
                    type="number"
                    value={cols}
                    onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black text-center focus:ring-2 focus:ring-line-400 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleSplit}
                disabled={!originalSheetUrl || isProcessing}
                className="w-full py-5 bg-line-600 hover:bg-line-700 disabled:bg-slate-200 text-white font-black rounded-2xl transition-all shadow-lg shadow-line-100 flex items-center justify-center gap-2 uppercase italic tracking-tighter"
              >
                画像を分割する
              </button>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tighter italic">
              <span className="bg-line-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] not-italic shadow-md">03</span>
              透過設定
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">透過の許容度 (Tolerance)</label>
                  <span className="text-xs font-black text-line-600 bg-line-50 px-2 py-1 rounded-md">{tolerance}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="150"
                  step="1"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-line-600"
                />
                <p className="mt-2 text-[9px] text-slate-400 font-bold leading-tight">
                  ※値が大きいほど、背景色に近い色がより広く透過されます。エッジが残る場合は値を上げてください。
                </p>
              </div>
              <div>
                <label className="flex items-center justify-between cursor-pointer" onClick={() => setRemoveInterior(v => !v)}>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">内部も透過する</span>
                    <p className="mt-1 text-[9px] text-slate-400 font-bold leading-tight">
                      OFFにすると外周から繋がった背景のみ透過します
                    </p>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${removeInterior ? 'bg-line-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${removeInterior ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </label>
              </div>
              {stickers.length > 0 && (
                 <button
                  onClick={processAllSelected}
                  disabled={isProcessing}
                  className="w-full py-4 bg-line-600 hover:bg-line-700 disabled:bg-slate-200 text-white font-black rounded-2xl transition-all shadow-lg shadow-line-100 flex items-center justify-center gap-2 uppercase italic tracking-tighter"
                >
                  背景透過を再適用
                </button>
              )}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tighter italic">
              <span className="bg-line-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] not-italic shadow-md">04</span>
              リサイズ
            </h2>
            <div className="space-y-4">
              <p className="text-[9px] text-slate-400 font-bold leading-tight">
                LINE スタンプ規格に合わせて 370&times;320px にリサイズします。アスペクト比を維持し、透明余白で中央配置します。
              </p>
              {stickers.length > 0 && (
                <button
                  onClick={resizeAllSelected}
                  disabled={isProcessing}
                  className="w-full py-4 bg-line-600 hover:bg-line-700 disabled:bg-slate-200 text-white font-black rounded-2xl transition-all shadow-lg shadow-line-100 flex items-center justify-center gap-2 uppercase italic tracking-tighter"
                >
                  選択中を 370&times;320 にリサイズ
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-8">
          {stickers.length > 0 ? (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">分割完了</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                    {rows}x{cols} = 計 {stickers.length} 枚
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowChatPreview(true)}
                    className="px-6 py-3 bg-line-500 text-white hover:bg-line-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    LINEプレビュー
                  </button>
                  <button
                    onClick={downloadSelected}
                    className="px-6 py-3 bg-slate-900 text-white hover:bg-black rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    選択中を保存
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {stickers.map((sticker) => (
                  <StickerCard
                    key={sticker.id}
                    sticker={sticker}
                    onToggleSelect={toggleSelect}
                    onProcess={handleProcessBackground}
                    onReCrop={handleReCrop}
                    onResize={handleResize}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center opacity-20 select-none border-4 border-dashed border-slate-200 rounded-[3rem]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-slate-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">準備完了</h3>
              <p className="text-sm font-bold max-w-xs mt-2">シート画像をアップロードし、分割数を指定して実行してください。</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-xl text-red-700 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Master Preview Section (Bottom) */}
      {originalSheetUrl && (
        <div className="mt-12 animate-in fade-in duration-700">
          <div className="border-t border-slate-200 pt-10">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 italic">元の画像プレビュー</h2>
            <div className="bg-white p-4 rounded-[2rem] shadow-inner inline-block border border-slate-100 max-w-full">
              <img src={originalSheetUrl} alt="Original" className="max-h-[300px] w-auto rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {showChatPreview && (
        <LineChatPreview
          stickers={stickers.filter(s => s.isSelected)}
          onClose={() => setShowChatPreview(false)}
        />
      )}
    </>
  );
};

export default SplitterTab;
