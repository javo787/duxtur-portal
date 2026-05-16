import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'Duxtur.org';
    const author = searchParams.get('author') || 'Medical Portal';
    const lang = searchParams.get('lang') || 'ru';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(circle at 25% 25%, #1e293b 0%, #0f172a 100%)',
            padding: '80px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '15px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white" />
              </svg>
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>
              duxtur<span style={{ color: '#2563eb' }}>.org</span>
            </span>
          </div>

          <div
            style={{
              fontSize: 60,
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.2,
              marginBottom: '30px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                fontSize: 24,
                color: '#94a3b8',
                fontWeight: 600,
                marginRight: '20px',
              }}
            >
              By {author}
            </div>
            <div
              style={{
                backgroundColor: '#1e293b',
                padding: '8px 16px',
                borderRadius: '20px',
                color: '#38bdf8',
                fontSize: 20,
                fontWeight: 800,
                textTransform: 'uppercase',
                border: '1px solid #334155',
              }}
            >
              {lang}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
