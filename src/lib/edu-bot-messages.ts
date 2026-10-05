import type { LoginPurpose } from '@/lib/edu-telegram-login';

/**
 * What the bot says when somebody opens a login link. One bot, three jobs: the text must say which one, so a person
 * who never asked for it knows to ignore it. `hint` is the browser and city that made the request.
 */
export function confirmationMessage(purpose: LoginPurpose, hint: string | null): { text: string; button: string } {
  const from = hint ? `\nЗапрос из: ${hint}\n` : '\n';
  const ignore = 'Если это были не вы, просто проигнорируйте это сообщение.';

  if (purpose === 'portal') {
    return {
      text: `🔐 Вход на duxtur.org\n${from}\nЕсли вы только что нажали «Войти через Telegram» на сайте duxtur.org — подтвердите вход.\n${ignore}`,
      button: '✅ Подтвердить вход',
    };
  }
  if (purpose === 'portal_link') {
    return {
      text: `🔗 Подключение Telegram к аккаунту duxtur.org\n${from}\nЕсли вы только что нажали «Подключить Telegram» в своём аккаунте на duxtur.org — подтвердите. После этого в аккаунт можно будет входить через Telegram.\n${ignore}`,
      button: '✅ Подключить Telegram',
    };
  }
  return {
    text: `🔐 Вход в Duxtur Edu\n${from}\nЕсли вы только что нажали «Войти через Telegram» на сайте duxtur.org/edu — подтвердите вход.\n${ignore}`,
    button: '✅ Подтвердить вход',
  };
}
