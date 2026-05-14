'use client';

import { useEffect, useRef } from 'react';

interface Props {
  botName: string;
  onAuth: (user: any) => void;
  buttonSize?: 'large' | 'medium' | 'small';
}

export default function TelegramLoginWidget({ botName, onAuth, buttonSize = 'large' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Telegram официальный виджет через script tag
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-onauth', 'TelegramLoginCallback');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    // Глобальный callback
    (window as any).TelegramLoginCallback = onAuth;

    ref.current.appendChild(script);

    return () => {
      if (ref.current) ref.current.innerHTML = '';
      delete (window as any).TelegramLoginCallback;
    };
  }, [botName, onAuth, buttonSize]);

  return <div ref={ref} />;
}
