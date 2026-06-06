import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await dbConnect();

  const clinic = await Clinic.findOne({ slug }).lean();
  if (!clinic) return new NextResponse('Not Found', { status: 404 });

  const rating = (clinic.rating?.avg || 0).toFixed(1);
  const count = clinic.rating?.count || 0;
  const isVerified = clinic.status === 'approved';
  const name = (clinic.name as any).ru || 'Clinic';

  const badgeSvg = `
    <svg width="240" height="80" viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="80" rx="20" fill="white"/>
      <rect x="0.5" y="0.5" width="239" height="79" rx="19.5" stroke="#F1F5F9"/>

      <text x="20" y="30" fill="#94A3B8" style="font-family: sans-serif; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;">Verified by</text>
      <text x="20" y="55" fill="#2563EB" style="font-family: sans-serif; font-weight: 900; font-size: 20px;">Duxtur.org</text>

      ${isVerified ? `
        <circle cx="210" cy="40" r="15" fill="#2563EB"/>
        <path d="M205 40L208.5 43.5L215 37" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ` : ''}

      <g transform="translate(140, 20)">
        <text x="0" y="10" fill="#F59E0B" style="font-family: sans-serif; font-weight: bold; font-size: 14px;">★ ${rating}</text>
        <text x="0" y="25" fill="#94A3B8" style="font-family: sans-serif; font-weight: bold; font-size: 10px;">${count} reviews</text>
      </g>
    </svg>
  `.trim();

  return new NextResponse(badgeSvg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
