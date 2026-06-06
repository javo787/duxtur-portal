import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { auth } from '@/auth';
import { uploadImageToCloudinary } from '@/app/actions/upload-image';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const result = await uploadImageToCloudinary(formData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await dbConnect();
    const clinic = await Clinic.findOneAndUpdate(
      { userId: session.user?.id },
      { $push: { photos: result.url } },
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json({ url: result.url, photos: clinic.photos }, { status: 200 });
  } catch (error) {
    console.error('Clinic photo upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'clinic') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    await dbConnect();
    const clinic = await Clinic.findOneAndUpdate(
      { userId: session.user?.id },
      { $pull: { photos: url } },
      { new: true }
    );

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json({ photos: clinic.photos }, { status: 200 });
  } catch (error) {
    console.error('Clinic photo delete error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
