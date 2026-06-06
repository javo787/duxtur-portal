import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';
import ClinicInvitation from '@/models/ClinicInvitation';
import { auth } from '@/auth';
import { sendMessageToAdmin } from '@/lib/telegram';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json(); // 'accept' | 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await dbConnect();

    const doctor = await Doctor.findOne({ userId: session.user?.id });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const invitation = await ClinicInvitation.findOne({
      _id: id,
      doctorId: doctor._id,
      status: 'pending'
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or not pending' }, { status: 404 });
    }

    if (action === 'accept') {
      // Security: Check if doctor is already linked to another clinic
      if (doctor.clinicId) {
        return NextResponse.json({ error: 'Doctor is already linked to another clinic' }, { status: 400 });
      }

      invitation.status = 'accepted';
      await invitation.save();

      await Clinic.findByIdAndUpdate(invitation.clinicId, {
        $addToSet: { doctorIds: doctor._id }
      });

      await Doctor.findByIdAndUpdate(doctor._id, {
        $set: { clinicId: invitation.clinicId }
      });

      // Recalculate clinic stats
      const { recalculateClinicRating } = await import('@/app/actions/clinic');
      await recalculateClinicRating(invitation.clinicId.toString());

      // Notify through Telegram (optional, but requested in plan)
      const clinic = await Clinic.findById(invitation.clinicId);
      if (clinic) {
        const message = `👨‍⚕️ <b>Доктор принял приглашение!</b>\n\n` +
          `Доктор: ${doctor.name}\n` +
          `Клиника: ${clinic.name?.ru || 'Ваша клиника'}\n` +
          `Теперь он отображается в списке врачей клиники.`;
        sendMessageToAdmin(message); // Using admin as fallback for now
      }
    } else {
      invitation.status = 'declined';
      await invitation.save();
    }

    return NextResponse.json(invitation, { status: 200 });
  } catch (error) {
    console.error('Update invitation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
