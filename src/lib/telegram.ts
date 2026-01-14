const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function notifyAdminNewDoctor(doctorName: string, phone: string, specialty: string, diplomaUrl: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    console.warn("Telegram токен не найден, уведомление не отправлено.");
    return;
  }

  const message = `
🚨 <b>Новая заявка врача!</b>

👨‍⚕️ <b>Имя:</b> ${doctorName}
💼 <b>Спец:</b> ${specialty}
📞 <b>Тел:</b> ${phone}

📄 <a href="${diplomaUrl}">Посмотреть диплом</a>

<i>Зайдите в админку, чтобы одобрить.</i>
`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML' // Чтобы работала жирность и ссылки
      })
    });
  } catch (error) {
    console.error("Ошибка отправки в Telegram:", error);
  }
}
