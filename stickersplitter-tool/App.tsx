
import React, { useState } from 'react';
import TabBar, { TabId } from './components/TabBar';
import SplitterTab from './components/SplitterTab';
import HowToMakeTab from './components/HowToMakeTab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('splitter');

  return (
    <div className="min-h-screen pb-20 bg-slate-50/50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter leading-none">LINE Sticker <span className="text-emerald-600">Splitter</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sticker Sheet Processing Tool</p>
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
