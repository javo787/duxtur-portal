/**
 * Logic to determine if a clinic is open based on its working hours.
 * Note: This currently uses the server's local time during SSR.
 */
export function isClinicOpen(workingHours: ClinicWorkingHours | undefined): boolean {
  if (!workingHours) return false;

  const now = new Date();
  // Get day in lowercase (mon, tue, etc.)
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[now.getDay()] as keyof typeof workingHours;

  const schedule = workingHours[today];
  if (!schedule || !schedule.isWorking) return false;

  const { open, close } = schedule;
  if (!open || !close) return false;

  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  return currentTime >= openTime && currentTime < closeTime;
}
