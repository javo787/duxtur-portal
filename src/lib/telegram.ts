const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function notifyAdminNewDoctor(
  doctorName: string,
  phone: string,
  specialty: string,
  diplomaUrl: string,
  isClaim: boolean = false,
  importSourceUrl: string = ''
) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    console.warn("Telegram токен не найден, уведомление не отправлено.");
    return;
  }

  const message = `
${isClaim ? '⚠️ <b>ЗАЯВЛЕН СУЩЕСТВУЮЩИЙ ПРОФИЛЬ (CLAIM)</b>' : '🚨 <b>Новая заявка врача!</b>'}

👨‍⚕️ <b>Имя:</b> ${doctorName}
💼 <b>Спец:</b> ${specialty}
📞 <b>Тел:</b> ${phone}

📄 <a href="${diplomaUrl}">Посмотреть диплом</a>
${isClaim && importSourceUrl ? `🔗 <a href="${importSourceUrl}">Оригинал (Scraped)</a>` : ''}

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

export async function notifyDoctorNewAppointment(doctorChatId: string, appointment: any) {
  const message = `
📅 <b>Новая запись!</b>
👤 Пациент: ${appointment.patientName}
📞 Тел: ${appointment.patientPhone}
🕒 Время: ${new Date(appointment.date).toLocaleDateString()} в ${appointment.timeSlot}
🏷 Тип: ${appointment.type}
📝 Заметка: ${appointment.notes || 'нет'}
  `;
  await sendTelegramMessage(doctorChatId, message);
}

export async function notifyPatientAppointmentConfirmed(patientTelegram: string, appointment: any) {
  const message = `
✅ <b>Ваша запись подтверждена!</b>
👨‍⚕️ Врач: ${appointment.doctorId.name}
🕒 Время: ${new Date(appointment.date).toLocaleDateString()} в ${appointment.timeSlot}
📍 Место: ${appointment.doctorId.address || 'уточните у врача'}
  `;
  await sendTelegramMessage(patientTelegram, message);
}

export async function notifyPatientAppointmentReminder(patientTelegram: string, appointment: any) {
  const message = `
🔔 <b>Напоминание о записи!</b>
👨‍⚕️ Врач: ${appointment.doctorId.name}
🕒 Завтра в ${appointment.timeSlot}
📍 ${appointment.doctorId.address || ''}
  `;
  await sendTelegramMessage(patientTelegram, message);
}

export async function sendAppointmentSummaryToDoctor(doctorChatId: string, appointments: any[]) {
  let message = `📅 <b>Ваши записи на сегодня:</b>\n\n`;
  appointments.forEach(a => {
    message += `• ${a.timeSlot} - ${a.patientName} (${a.type})\n`;
  });
  await sendTelegramMessage(doctorChatId, message);
}

export async function sendMessageToAdmin(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) return;
  await sendTelegramMessage(TELEGRAM_ADMIN_CHAT_ID, text);
}

async function sendTelegramMessage(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch (e) { console.error(e); }
}
