
import React, { useState, useEffect } from 'react';

interface StickerRow {
  expression: string;
  text: string;
}

interface StickerTableEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const LINE_PATTERN = /^(\d+)\.\s*【(?:表情\/アクション|表情)】(.+?)(?:\s*【テキスト】「(.+?)」)?$/;

function parseRows(value: string): StickerRow[] {
  const lines = value.split('\n').filter(l => l.trim());
  const rows: StickerRow[] = [];
  for (const line of lines) {
    const m = line.match(LINE_PATTERN);
    if (m) {
      rows.push({ expression: m[2], text: m[3] || '' });
    } else {
      rows.push({ expression: line.replace(/^\d+\.\s*/, ''), text: '' });
    }
  }
  return rows.length > 0 ? rows : [{ expression: '', text: '' }];
}

function serializeRows(rows: StickerRow[]): string {
  return rows.map((row, i) => {
    const base = `${i + 1}. 【表情/アクション】${row.expression}`;
    return row.text ? `${base} 【テキスト】「${row.text}」` : base;
  }).join('\n');
}

const StickerTableEditor: React.FC<StickerTableEditorProps> = ({ value, onChange }) => {
  const [rows, setRows] = useState<StickerRow[]>(() => parseRows(value));

  useEffect(() => {
    setRows(parseRows(value));
  }, [value]);

  const updateRows = (newRows: StickerRow[]) => {
    setRows(newRows);
    onChange(serializeRows(newRows));
  };

  const handleCellChange = (index: number, field: keyof StickerRow, val: string) => {
    const newRows = rows.map((r, i) => i === index ? { ...r, [field]: val } : r);
    updateRows(newRows);
  };

  const addRow = () => {
    updateRows([...rows, { expression: '', text: '' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    updateRows(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-indigo-50 text-indigo-700">
            <th className="w-10 px-3 py-2 text-center font-black text-[10px] uppercase tracking-widest">#</th>
            <th className="px-3 py-2 text-left font-black text-[10px] uppercase tracking-widest">表情/ポーズ</th>
            <th className="px-3 py-2 text-left font-black text-[10px] uppercase tracking-widest">テキスト</th>
            <th className="w-10 px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2 text-center text-xs font-bold text-slate-400">{index + 1}</td>
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  value={row.expression}
                  onChange={(e) => handleCellChange(index, 'expression', e.target.value)}
                  placeholder="笑顔で手を振る"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  value={row.text}
                  onChange={(e) => handleCellChange(index, 'text', e.target.value)}
                  placeholder="（空欄可）"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </td>
              <td className="px-2 py-1.5 text-center">
                <button
                  onClick={() => removeRow(index)}
                  disabled={rows.length <= 1}
                  className="text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-lg leading-none"
                  title="行を削除"
                >
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-100 px-3 py-2">
        <button
          onClick={addRow}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          + 行を追加
        </button>
      </div>
    </div>
  );
};

export default StickerTableEditor;
