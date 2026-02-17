
import React from 'react';

const specs = [
  { label: 'メイン画像サイズ', value: '370 × 320 px (最大)' },
  { label: 'フォーマット', value: 'PNG（透過背景）' },
  { label: 'ファイルサイズ', value: '1MB以下 / 1スタンプ' },
  { label: 'カラーモード', value: 'RGB' },
];

const stickerCounts = [8, 16, 24, 32, 40];

const LineSpecCard: React.FC = () => {
  return (
    <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
      <h2 className="text-lg font-black mb-2 uppercase tracking-tighter italic">
        LINE仕様リファレンス
      </h2>
      <p className="text-xs text-slate-400 font-bold mb-6">
        LINE Creators Market のスタンプ画像要件
      </p>

      <div className="space-y-3 mb-6">
        {specs.map((spec) => (
          <div key={spec.label} className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-xs font-bold text-slate-500">{spec.label}</span>
            <span className="text-xs font-black text-slate-800 bg-slate-50 px-3 py-1 rounded-lg">{spec.value}</span>
          </div>
        ))}
      </div>

      <div>
        <span className="text-xs font-bold text-slate-500 block mb-2">販売可能なスタンプ個数</span>
        <div className="flex flex-wrap gap-2">
          {stickerCounts.map((count) => (
            <span key={count} className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
              {count}個
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
          ※ タブ画像（96×74px）とトークルームタブ画像（96×74px）も別途必要です。
          詳細は LINE Creators Market のガイドラインをご確認ください。
        </p>
      </div>
    </section>
  );
};

export default LineSpecCard;
