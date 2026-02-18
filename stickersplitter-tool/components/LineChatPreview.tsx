
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sticker } from '../types';
import chatSampleTexts from '../data/chatSampleTexts';

type ChatMessage =
  | { type: 'text'; content: string; side: 'left' | 'right' }
  | { type: 'sticker'; stickerUrl: string; side: 'left' | 'right' };

interface LineChatPreviewProps {
  stickers: Sticker[];
  onClose: () => void;
}

const bgPresets = [
  { id: 'line',   label: 'LINE',   color: '#7494C0', dark: false },
  { id: 'white',  label: '白',     color: '#FFFFFF', dark: false },
  { id: 'black',  label: '黒',     color: '#000000', dark: true },
  { id: 'dark',   label: 'ダーク', color: '#1A1A2E', dark: true },
  { id: 'checker', label: '市松',  color: '', dark: false },
] as const;

type BgPresetId = typeof bgPresets[number]['id'];

const LineChatPreview: React.FC<LineChatPreviewProps> = ({ stickers, onClose }) => {
  const [bgPreset, setBgPreset] = useState<BgPresetId>('line');
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const currentPreset = bgPresets.find(p => p.id === bgPreset)!;
  const isDark = currentPreset.dark;

  const messages = useMemo<ChatMessage[]>(() => {
    const result: ChatMessage[] = [];
    let textIndex = 0;
    let side: 'left' | 'right' = 'left';

    for (const sticker of stickers) {
      // Insert a text message before each sticker
      result.push({
        type: 'text',
        content: chatSampleTexts[textIndex % chatSampleTexts.length],
        side,
      });
      textIndex++;

      // Insert the sticker
      result.push({
        type: 'sticker',
        stickerUrl: sticker.processedUrl || sticker.url,
        side,
      });

      // Alternate sides
      side = side === 'left' ? 'right' : 'left';
    }

    // Add a closing text message
    if (stickers.length > 0) {
      result.push({
        type: 'text',
        content: chatSampleTexts[textIndex % chatSampleTexts.length],
        side,
      });
    }

    return result;
  }, [stickers]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Auto-scroll to bottom on open
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const chatBg = currentPreset.color;
  const theme = isDark
    ? { selfBubble: '#3B6B3B', otherBubble: '#2A2A3E', selfText: '#E0E0E0', otherText: '#D0D0D0' }
    : { selfBubble: '#8CE68B', otherBubble: '#FFFFFF', selfText: '#1A1A1A', otherText: '#1A1A1A' };

  const checkerStyle: React.CSSProperties = bgPreset === 'checker'
    ? {
        backgroundColor: '#cccccc',
        backgroundImage: 'linear-gradient(45deg, #999 25%, transparent 25%), linear-gradient(-45deg, #999 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #999 75%), linear-gradient(-45deg, transparent 75%, #999 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }
    : {};

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col overflow-hidden shadow-2xl"
        style={{ maxWidth: 420, width: '100%', height: '85vh', borderRadius: '2rem', backgroundColor: chatBg || '#cccccc' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-line-600 text-white flex-shrink-0">
          <button onClick={onClose} className="p-1 hover:bg-line-500 rounded-lg transition-colors" aria-label="閉じる">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-black text-sm tracking-tight">LINE プレビュー</span>
          <div className="flex items-center gap-1.5">
            {bgPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setBgPreset(preset.id)}
                className={`w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 ${bgPreset === preset.id ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'}`}
                style={
                  preset.id === 'checker'
                    ? {
                        backgroundColor: '#ccc',
                        backgroundImage: 'linear-gradient(45deg, #999 25%, transparent 25%), linear-gradient(-45deg, #999 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #999 75%), linear-gradient(-45deg, transparent 75%, #999 75%)',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                      }
                    : { backgroundColor: preset.color }
                }
                aria-label={preset.label}
                title={preset.label}
              />
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={bgPreset === 'checker' ? checkerStyle : { backgroundColor: chatBg }}>
          {messages.map((msg, i) => {
            const isRight = msg.side === 'right';
            return (
              <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'text' ? (
                  <div
                    className="max-w-[70%] px-3 py-2 text-sm"
                    style={{
                      backgroundColor: isRight ? theme.selfBubble : theme.otherBubble,
                      color: isRight ? theme.selfText : theme.otherText,
                      borderRadius: isRight ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <img
                    src={msg.stickerUrl}
                    alt="sticker"
                    className="object-contain"
                    style={{ width: 140, height: 140 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ backgroundColor: isDark ? '#0D0D1A' : '#F0F0F0' }}>
          <div
            className="flex-1 rounded-full px-4 py-2 text-xs"
            style={{
              backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF',
              color: isDark ? '#666' : '#999',
            }}
          >
            Aa
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isDark ? '#333' : '#CCCCCC' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke={isDark ? '#888' : '#666'}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineChatPreview;
