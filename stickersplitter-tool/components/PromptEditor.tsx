
import React, { useState, useMemo } from 'react';
import { PromptTemplate, PromptVariable } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import StickerTableEditor from './StickerTableEditor';

function isStickerListFormat(value: string): boolean {
  const lines = value.split('\n').filter(l => l.trim());
  if (lines.length < 3) return false;
  return lines.every(l => /^\d+\.\s*【/.test(l));
}

interface PromptEditorProps {
  template: PromptTemplate;
  onClose: () => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ template, onClose }) => {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables.forEach(v => {
      initial[v.key] = v.defaultValue;
    });
    return initial;
  });
  const [copied, setCopied] = useState(false);

  const resolvedPrompt = useMemo(() => {
    let result = template.body;
    template.variables.forEach(v => {
      const value = values[v.key] || v.defaultValue;
      result = result.replaceAll(`{{${v.key}}}`, value);
    });
    return result;
  }, [template, values]);

  const handleCopy = async () => {
    const success = await copyToClipboard(resolvedPrompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="font-black text-sm text-slate-700">変数を入力</h4>
        <button
          onClick={onClose}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          閉じる
        </button>
      </div>

      <div className="space-y-3">
        {template.variables.map((variable) => (
          <div key={variable.key}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              {variable.label}
            </label>
            {variable.inputType === 'stickerTable' || isStickerListFormat(values[variable.key]) ? (
              <StickerTableEditor
                value={values[variable.key]}
                onChange={(val) => handleChange(variable.key, val)}
              />
            ) : variable.defaultValue.includes('\n') ? (
              <textarea
                value={values[variable.key]}
                onChange={(e) => handleChange(variable.key, e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-400 outline-none resize-y"
              />
            ) : (
              <input
                type="text"
                value={values[variable.key]}
                onChange={(e) => handleChange(variable.key, e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-400 outline-none"
              />
            )}
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            プレビュー
          </label>
          <span className="text-[10px] font-bold text-slate-300">
            {resolvedPrompt.length} 文字
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 max-h-60 overflow-y-auto">
          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">{resolvedPrompt}</pre>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className={`w-full py-4 font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase italic tracking-tighter ${
          copied
            ? 'bg-sky-500 text-white shadow-sky-100'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
        }`}
      >
        {copied ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            コピーしました！
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            クリップボードにコピー
          </>
        )}
      </button>
    </div>
  );
};

export default PromptEditor;
