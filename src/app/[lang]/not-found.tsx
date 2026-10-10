'use client';

import { useParams } from 'next/navigation';
import NotFoundView, { resolveNotFoundLang } from '@/components/NotFoundView';

/**
 * notFound() thrown by any page under /[lang]/…: rendered inside the [lang] layout (which owns <html>),
 * in the language of the route. Reads route params, not request headers, so ISR pages can use notFound().
 */
export default function LangNotFound() {
  const params = useParams<{ lang?: string }>();
  return <NotFoundView lang={resolveNotFoundLang(params?.lang)} />;
}
