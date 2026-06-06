'use client';

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  value: string;
  onImageClick?: () => void;
}

type FormatAction = {
  icon: React.ReactNode;
  label: string;
  action: (selected: string, before: string, after: string) => { wrap?: [string, string]; replace?: string; linePrefix?: string };
};

export function EditorToolbar({ textareaRef, onChange, value, onImageClick }: EditorToolbarProps) {
  const applyFormat = (
    type: 'wrap' | 'linePrefix' | 'replace',
    payload: { prefix?: string; suffix?: string; linePrefix?: string; replace?: string }
  ) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    let newValue = value;
    let newCursorStart = start;
    let newCursorEnd = end;

    if (type === 'wrap' && payload.prefix !== undefined && payload.suffix !== undefined) {
      const wrapped = `${payload.prefix}${selected || 'текст'}${payload.suffix}`;
      newValue = value.slice(0, start) + wrapped + value.slice(end);
      newCursorStart = start + payload.prefix.length;
      newCursorEnd = newCursorStart + (selected || 'текст').length;
    } else if (type === 'linePrefix' && payload.linePrefix !== undefined) {
      // Find start of line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = value.indexOf('\n', end);
      const actualEnd = lineEnd === -1 ? value.length : lineEnd;
      const lines = value.slice(lineStart, actualEnd).split('\n');
      const prefixed = lines.map((line) => {
        if (line.startsWith(payload.linePrefix!)) return line.slice(payload.linePrefix!.length);
        return payload.linePrefix + line;
      }).join('\n');
      newValue = value.slice(0, lineStart) + prefixed + value.slice(actualEnd);
      newCursorStart = start;
      newCursorEnd = end + (prefixed.length - (actualEnd - lineStart));
    }

    onChange(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  const tools: { icon: string; label: string; onClick: () => void; separator?: boolean }[] = [
    {
      icon: 'B',
      label: 'Жирный (Ctrl+B)',
      onClick: () => applyFormat('wrap', { prefix: '**', suffix: '**' }),
    },
    {
      icon: 'I',
      label: 'Курсив (Ctrl+I)',
      onClick: () => applyFormat('wrap', { prefix: '_', suffix: '_' }),
    },
    {
      icon: 'H2',
      label: 'Заголовок H2',
      onClick: () => applyFormat('linePrefix', { linePrefix: '## ' }),
    },
    {
      icon: 'H3',
      label: 'Заголовок H3',
      onClick: () => applyFormat('linePrefix', { linePrefix: '### ' }),
    },
    {
      icon: '•',
      label: 'Маркированный список',
      onClick: () => applyFormat('linePrefix', { linePrefix: '- ' }),
      separator: true,
    },
    {
      icon: '1.',
      label: 'Нумерованный список',
      onClick: () => applyFormat('linePrefix', { linePrefix: '1. ' }),
    },
    {
      icon: '❝',
      label: 'Цитата',
      onClick: () => applyFormat('linePrefix', { linePrefix: '> ' }),
      separator: true,
    },
  ];

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap rounded-t-xl">
      {tools.map((tool, i) => (
        <div key={i} className="flex items-center">
          {tool.separator && <div className="w-px h-5 bg-gray-300 mx-1.5" />}
          <button
            type="button"
            onClick={tool.onClick}
            title={tool.label}
            className="px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm rounded-lg transition-all min-w-[32px] text-center"
          >
            {tool.icon}
          </button>
        </div>
      ))}

      {/* Divider */}
      <div className="w-px h-5 bg-gray-300 mx-1.5" />

      {/* Image button */}
      {onImageClick && (
        <button
          type="button"
          onClick={onImageClick}
          title="Добавить фото к секции"
          className="px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm rounded-lg transition-all flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Фото
        </button>
      )}
    </div>
  );
}
