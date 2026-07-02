import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 10, 60 * 1000); // 10 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'portal_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI Assistant key not configured' }, { status: 500 });
    }

    const { messages } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        system: `Ты — AI-помощник для администратора медицинского портала Duxtur.org.
Портал публикует верифицированные медицинские статьи для Центральной Азии на 5 языках: русский, узбекский, таджикский, казахский, кыргызский.
Целевая аудитория: пациенты без медицинского образования.
Авторы: практикующие врачи.

Твои задачи:
- Помогать модерировать статьи (критерии качества, безопасности, E-E-A-T)
- Давать советы по управлению медицинским контентом
- Помогать с SEO для медицинских сайтов
- Составлять шаблоны ответов врачам
- Анализировать качество платформы

Отвечай конкретно, по делу, на русском языке. Если нужны списки — используй их.`,
        messages: messages
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
