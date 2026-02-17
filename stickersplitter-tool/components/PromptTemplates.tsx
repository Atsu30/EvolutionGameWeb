
import React, { useState, useEffect } from 'react';
import { PromptTemplate } from '../types';
import { loadTemplates, saveTemplates, deleteTemplate as deleteFromStorage } from '../utils/storage';
import { defaultTemplates } from '../data/defaultTemplates';
import PromptEditor from './PromptEditor';

const INIT_KEY = 'sticker-templates-initialized-v1';

const PromptTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for add/edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBody, setFormBody] = useState('');

  useEffect(() => {
    const initialized = localStorage.getItem(INIT_KEY);
    let loaded = loadTemplates();
    if (!initialized) {
      const now = Date.now();
      const defaults = defaultTemplates.map(t => ({
        ...t,
        createdAt: now,
        updatedAt: now,
      }));
      saveTemplates(defaults);
      localStorage.setItem(INIT_KEY, '1');
      loaded = defaults;
    }
    setTemplates(loaded);
  }, []);

  const extractVariables = (body: string) => {
    const matches = body.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    const unique = [...new Set(matches.map(m => m.slice(2, -2)))];
    return unique.map(key => ({
      key,
      label: key,
      defaultValue: '',
    }));
  };

  const handleAdd = () => {
    if (!formName.trim() || !formBody.trim()) return;
    const now = Date.now();
    const newTemplate: PromptTemplate = {
      id: `custom-${now}`,
      name: formName.trim(),
      description: formDescription.trim(),
      body: formBody,
      variables: extractVariables(formBody),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setTemplates(updated);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingId || !formName.trim() || !formBody.trim()) return;
    const now = Date.now();
    const updated = templates.map(t =>
      t.id === editingId
        ? {
            ...t,
            name: formName.trim(),
            description: formDescription.trim(),
            body: formBody,
            variables: extractVariables(formBody),
            updatedAt: now,
          }
        : t
    );
    saveTemplates(updated);
    setTemplates(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updated = deleteFromStorage(id);
    setTemplates(updated);
    if (activeTemplateId === id) setActiveTemplateId(null);
    if (editingId === id) resetForm();
  };

  const startEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setFormName(template.name);
    setFormDescription(template.description);
    setFormBody(template.body);
    setIsAdding(false);
    setActiveTemplateId(null);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormBody('');
    setActiveTemplateId(null);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormBody('');
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tighter italic">
            プロンプトテンプレート
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Geminiに貼り付けるプロンプトを管理
          </p>
        </div>
        <button
          onClick={startAdd}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-colors shadow-md flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </button>
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 space-y-4">
          <h3 className="font-black text-sm text-slate-700">
            {editingId ? 'テンプレートを編集' : '新しいテンプレートを作成'}
          </h3>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">テンプレート名</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="例: 猫キャラ基本セット"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-400 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">説明</label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="テンプレートの簡単な説明"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-400 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              プロンプト本文
              <span className="normal-case tracking-normal ml-2 text-slate-300">{'{{変数名}}'} で変数を埋め込み</span>
            </label>
            <textarea
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={10}
              placeholder="プロンプト本文を入力... {{characterName}} のように変数を埋め込めます"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono font-medium focus:ring-2 focus:ring-emerald-400 outline-none resize-y"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={!formName.trim() || !formBody.trim()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-black text-xs rounded-xl transition-colors shadow-md uppercase"
            >
              {editingId ? '更新' : '作成'}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-xl transition-colors uppercase"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Template List */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base text-slate-800">{template.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{template.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {template.variables.map(v => (
                    <span key={v.key} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {`{{${v.key}}}`}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(template)}
                  className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors px-2 py-1"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                >
                  削除
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveTemplateId(activeTemplateId === template.id ? null : template.id)}
              className={`mt-4 w-full py-3 font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTemplateId === template.id
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {activeTemplateId === template.id ? '閉じる' : '使う'}
            </button>

            {activeTemplateId === template.id && (
              <PromptEditor
                template={template}
                onClose={() => setActiveTemplateId(null)}
              />
            )}
          </div>
        ))}
      </div>

      {templates.length === 0 && !isAdding && (
        <div className="text-center py-12 opacity-40">
          <p className="text-sm font-bold text-slate-400">テンプレートがありません</p>
          <p className="text-xs text-slate-300 mt-1">「新規作成」ボタンからテンプレートを追加してください</p>
        </div>
      )}
    </section>
  );
};

export default PromptTemplates;
