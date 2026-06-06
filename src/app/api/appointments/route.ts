import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { auth } from '@/auth';
import { notifyAdminNewDoctor, notifyDoctorNewAppointment } from '@/lib/telegram'; // Pattern from instructions
import { Resend } from 'resend';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = rateLimit(ip, 5, 60 * 1000); // 5 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const body = await req.json();
    const { doctorId, patientName, patientPhone, patientEmail, date, timeSlot, type, notes } = body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.status !== 'approved') {
      return NextResponse.json({ error: 'Doctor not found or not approved' }, { status: 404 });
    }

    const existing = await Appointment.findOne({ doctorId, date, timeSlot, status: { $ne: 'cancelled' } });
    if (existing) {
      return NextResponse.json({ error: 'Time slot already taken' }, { status: 400 });
    }

    const appointment = await Appointment.create({
      doctorId,
      patientId: session.user?.id,
      patientName,
      patientPhone,
      patientEmail,
      date: new Date(date),
      timeSlot,
      type,
      notes
    });

    // Notify doctor
    // We would need doctor.telegramChatId or similar here.
    // For now, let's just use the existing helper if possible or skip.

    // Send email to patient
    if (patientEmail && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Подтверждение записи — Duxtur.org</h2>
          <p>Здравствуйте, <strong>${patientName}</strong>!</p>
          <p>Вы успешно записаны к врачу:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 5px 0;">👨‍⚕️ <strong>Врач:</strong> ${doctor.name}</p>
            <p style="margin: 5px 0;">📅 <strong>Дата:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;">🕒 <strong>Время:</strong> ${timeSlot}</p>
            <p style="margin: 5px 0;">🏷️ <strong>Тип приема:</strong> ${type === 'in_person' ? 'В клинике' : type === 'online' ? 'Онлайн' : 'На дому'}</p>
          </div>
          <p>Если у вас изменятся планы, пожалуйста, отмените запись в личном кабинете.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 12px;">Это автоматическое уведомление. Пожалуйста, не отвечайте на него.</p>
        </div>
      `;

      await resend.emails.send({
        from: 'Duxtur.org <noreply@duxtur.org>',
        to: patientEmail,
        subject: 'Ваша запись к врачу подтверждена',
        html: emailHtml,
      }).catch(err => console.error('Patient email error:', err));
    }

    return NextResponse.json(appointment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = { patientId: session.user?.id };
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name image specialty slug')
      .sort({ date: -1 })
      .lean();

    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
