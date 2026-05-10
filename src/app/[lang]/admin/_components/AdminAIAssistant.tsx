'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  { icon: '📊', label: 'Анализ контента', prompt: 'Проанализируй качество медицинского контента на портале. Что улучшить?' },
  { icon: '✅', label: 'Критерии модерации', prompt: 'Какие критерии использовать при проверке медицинской статьи перед публикацией?' },
  { icon: '📋', label: 'Шаблон отказа', prompt: 'Напиши вежливый шаблон ответа врачу, чья статья не прошла модерацию.' },
  { icon: '🔍', label: 'SEO советы', prompt: 'Дай конкретные советы по улучшению SEO медицинского портала для Центральной Азии.' },
  { icon: '⚠️', label: 'Красные флаги', prompt: 'Перечисли признаки опасного медицинского контента который нельзя публиковать.' },
  { icon: '📝', label: 'E-E-A-T чеклист', prompt: 'Составь чеклист проверки E-E-A-T для медицинской статьи на Duxtur.' },
];

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export function AdminAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Здравствуйте! Я AI-помощник администратора Duxtur. Помогу с модерацией статей, анализом контента, SEO и управлением платформой. Чем могу помочь?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Ты — AI-помощник для администратора медицинского портала Duxtur.org. 
Портал публикует верифицированные медицинские статьи для Центральной Азии на 5 языках: русский, узбекский, таджикский, казахский, кыргызский.
Целевая аудитория: пациенты без медицинского образования.
Авторы: практикующие врачи.

Твои задачи:
- Помогать модерировать статьи (критерии качества, безопасности, E-E-A-T)
- Давать советы по управлению медицинским контентом
- Помогать с SEO для медицинских сайтов
- Составлять шаблоны ответов врачам
- Анализировать качество платформы

Отвечай конкретно, по делу, на русском языке. Если нужны списки — используй их.`,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const assistantText = data.content?.[0]?.text || 'Ошибка получения ответа.';
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '⚠️ Ошибка подключения. Проверьте соединение и попробуйте снова.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => setMessages([{
    role: 'assistant',
    content: 'Чат очищен. Чем могу помочь?',
  }]);

  if (!isOpen) return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-2xl shadow-blue-900 transition active:scale-95"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      AI Помощник
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
    </button>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden" style={{ height: '600px', maxHeight: 'calc(100vh - 3rem)' }}>

      {/* HEADER */}
      <div className="bg-gray-800 border-b border-gray-700 px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">AI Помощник</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-gray-400">Онлайн</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat} title="Очистить чат"
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Quick prompts — show only at start */}
        {messages.length <= 1 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">Быстрые запросы:</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((qp) => (
                <button key={qp.label} onClick={() => sendMessage(qp.prompt)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-700 rounded-xl text-left transition group">
                  <span className="text-base shrink-0">{qp.icon}</span>
                  <span className="text-xs font-bold text-gray-300 group-hover:text-blue-400 transition leading-tight">{qp.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-800 text-gray-200 rounded-bl-sm border border-gray-700'
            }`}>
              {msg.content.split('\n').map((line, j) => (
                <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mr-2">
              <Spinner />
            </div>
            <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="border-t border-gray-700 p-4 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос... (Enter для отправки)"
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-blue-600 transition resize-none leading-relaxed"
            style={{ maxHeight: '100px' }}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}
            className="w-10 h-10 shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition active:scale-95">
            {isLoading ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-2 text-center">Shift+Enter для новой строки</p>
      </div>
    </div>
  );
}
