
import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Geminiを開く',
    description: 'Google AI Studio または Gemini アプリを開きます。画像生成に対応したモデル（Gemini 2.0 Flash等）を選択してください。',
    color: 'bg-blue-600',
  },
  {
    number: '02',
    title: 'プロンプトをコピー＆ペースト',
    description: '下のテンプレートから好みのものを選び、変数を入力してプロンプトをコピーします。Geminiのチャットに貼り付けてください。',
    color: 'bg-emerald-600',
  },
  {
    number: '03',
    title: '参照画像をアップロード',
    description: 'キャラクターのデザイン参考画像があれば、プロンプトと一緒にGeminiにアップロードします。一貫したキャラデザインの維持に役立ちます。',
    color: 'bg-violet-600',
  },
  {
    number: '04',
    title: '生成されたシート画像をダウンロード',
    description: 'Geminiが生成した3×4グリッドのスタンプシート画像をダウンロードします。緑背景（クロマキー）で出力されます。',
    color: 'bg-purple-600',
  },
  {
    number: '05',
    title: '「分割ツール」タブで分割＆透過処理',
    description: '「分割ツール」タブに切り替えて、ダウンロードしたシート画像をアップロード。3行×4列で分割し、背景を透過します。',
    color: 'bg-fuchsia-600',
  },
  {
    number: '06',
    title: '個別PNGをダウンロード',
    description: '透過処理済みの個別スタンプ画像をダウンロードし、LINE Creators Marketに提出します。',
    color: 'bg-pink-600',
  },
];

const WorkflowGuide: React.FC = () => {
  return (
    <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
      <h2 className="text-lg font-black mb-2 uppercase tracking-tighter italic">
        LINEスタンプの作り方
      </h2>
      <p className="text-xs text-slate-400 font-bold mb-6">
        Gemini AIを使ったスタンプ制作の6ステップ
      </p>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-4 items-start">
            <div className={`${step.color} text-white w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-md`}>
              {step.number}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-sm text-slate-800">{step.title}</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WorkflowGuide;
