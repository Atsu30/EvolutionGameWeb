
import React, { useState } from 'react';
import TabBar, { TabId } from './components/TabBar';
import SplitterTab from './components/SplitterTab';
import HowToMakeTab from './components/HowToMakeTab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('splitter');

  return (
    <div className="min-h-screen pb-20 bg-slate-50/50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}sticker_tool_icon.png`} alt="LineStickerGen AI" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl shadow-lg" />
            <div>
              <h1 className="font-black text-lg sm:text-xl tracking-tighter leading-none">LINE Sticker <span className="text-line-600">Splitter</span></h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Sticker Sheet Processing Tool</p>
            </div>
          </div>
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {activeTab === 'splitter' && <SplitterTab />}
        {activeTab === 'howto' && <HowToMakeTab />}
      </main>

      <footer className="mt-20 border-t border-slate-200 py-10 opacity-40">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">LINE Sticker Splitter v2.1 • Smart Transparency Tool</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
