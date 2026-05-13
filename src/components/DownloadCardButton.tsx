'use client';

import { useEffect, useState } from 'react';

interface DownloadCardButtonProps {
  doctorSlug: string;
  lang: string;
}

const btnText: Record<string, string> = {
  ru: 'Скачать визитку',
  uz: 'Vizitka yuklab olish',
  tg: 'Боргирии визитка',
  kk: 'Визитка жүктеу',
  ky: 'Визитка жүктөө',
};

export default function DownloadCardButton({ doctorSlug, lang }: DownloadCardButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setError(false);

    try {
      // Динамически импортируем @react-pdf/renderer только при нажатии
      const [
        { pdf },
        { Document, Page, View, Text, Image, StyleSheet, Font, Link },
      ] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@react-pdf/renderer'),
      ]);

      // Регистрируем шрифт с поддержкой кириллицы
      Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: '/fonts/NotoSans-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: '/fonts/NotoSans-Bold.ttf',
      fontWeight: 700,
    },
    {
      src: '/fonts/NotoSans-Black.ttf',
      fontWeight: 900,
    },
  ],
});

      // Фетчим данные врача
      const res = await fetch(`/api/doctor/${doctorSlug}/card?lang=${lang}&format=data`);
      if (!res.ok) throw new Error('Failed to fetch doctor data');
      const doctor = await res.json();

      const accentColor = doctor.accentColor || '#2563eb';
      const theme = doctor.cardTheme || 'dark';
      const bgColor = theme === 'dark' ? '#060d1a' : '#ffffff';
      const textColor = theme === 'dark' ? '#ffffff' : '#1e293b';
      const secondaryText = theme === 'dark' ? '#94a3b8' : '#64748b';
      const statLabelColor = theme === 'dark' ? '#64748b' : '#94a3b8';

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://duxtur.org/${lang}/doctor/${doctorSlug}`)}&bgcolor=${theme === 'dark' ? '060d1a' : 'ffffff'}&color=${theme === 'dark' ? 'ffffff' : '000000'}&margin=4`;

      const styles = StyleSheet.create({
        page: {
          width: '90mm',
          height: '50mm',
          backgroundColor: bgColor,
          fontFamily: 'NotoSans',
          flexDirection: 'column',
        },
        accentBar: {
          height: 2,
          backgroundColor: accentColor,
        },
        content: {
          flexDirection: 'row',
          flex: 1,
          paddingHorizontal: 11,
          paddingVertical: 8,
          gap: 8,
        },
        left: {
          flexDirection: 'row',
          flex: 1,
          gap: 7,
          alignItems: 'flex-start',
        },
        photo: {
          width: 45,
          height: 45,
          borderRadius: 5,
          objectFit: 'cover',
        },
        photoPlaceholder: {
          width: 45,
          height: 45,
          borderRadius: 5,
          backgroundColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
        },
        info: {
          flex: 1,
        },
        name: {
          fontSize: 11,
          fontWeight: 900,
          color: textColor,
          lineHeight: 1.1,
          fontFamily: 'NotoSans',
        },
        specialty: {
          fontSize: 7,
          color: accentColor,
          fontWeight: 700,
          marginTop: 2,
          fontFamily: 'NotoSans',
        },
        workplace: {
          fontSize: 6,
          color: secondaryText,
          marginTop: 2,
          lineHeight: 1.3,
          fontFamily: 'NotoSans',
        },
        right: {
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexShrink: 0,
          width: 42,
        },
        verifiedBadge: {
          backgroundColor: 'rgba(16,185,129,0.15)',
          borderRadius: 8,
          paddingHorizontal: 4,
          paddingVertical: 2,
        },
        verifiedText: {
          fontSize: 6,
          color: '#10b981',
          fontWeight: 700,
          fontFamily: 'NotoSans',
        },
        qr: {
          width: 38,
          height: 38,
          backgroundColor: '#ffffff',
          borderRadius: 3,
          padding: 1,
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingHorizontal: 11,
          paddingBottom: 6,
        },
        stats: {
          flexDirection: 'row',
          gap: 8,
        },
        stat: {
          alignItems: 'center',
        },
        statVal: {
          fontSize: 8,
          fontWeight: 700,
          color: textColor,
          fontFamily: 'NotoSans',
        },
        statLbl: {
          fontSize: 5,
          color: statLabelColor,
          fontFamily: 'NotoSans',
        },
        profileUrl: {
          fontSize: 5,
          color: accentColor,
          fontFamily: 'NotoSans',
        },
        socialRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
          marginBottom: 2,
        },
        socialText: {
          fontSize: 5,
          color: secondaryText,
          fontFamily: 'NotoSans',
        },
      });

      const dict: Record<string, any> = {
        ru: { articles: 'статей', years: 'лет', languages: 'языков', verified: '✓ Проверен', hours: 'Часы' },
        uz: { articles: 'maqola', years: 'yil', languages: 'til', verified: '✓ Tasdiqlangan', hours: 'Vaqt' },
        tg: { articles: 'мақола', years: 'сол', languages: 'забон', verified: '✓ Тасдиқшуда', hours: 'Соат' },
        kk: { articles: 'мақала', years: 'жыл', languages: 'тіл', verified: '✓ Тексерілген', hours: 'Уақыт' },
        ky: { articles: 'макала', years: 'жыл', languages: 'тил', verified: '✓ Текшерилген', hours: 'Убакыт' },
      };
      const __ = (key: string) => dict[lang]?.[key] || dict.ru[key];

      const t = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[lang] || field['ru'] || '';
      };

      const specialtyLabel = t(doctor.specialty) || t(doctor.specialization) || '';
      const profileUrl = `duxtur.org/${lang}/doctor/${doctorSlug}`;

      const getSocialUsername = (url: string, type: 'instagram' | 'telegram' | 'whatsapp') => {
        if (!url) return null;
        if (type === 'instagram') {
          const m = url.match(/instagram\.com\/([^/?]+)/);
          return m ? `@${m[1]}` : url;
        }
        if (type === 'telegram') {
          const m = url.match(/t(?:elegram)?\.me\/([^/?]+)/);
          return m ? `@${m[1]}` : url;
        }
        return url.replace('https://wa.me/', '');
      };

      const instagramHandle = doctor.instagram ? getSocialUsername(doctor.instagram, 'instagram') : null;
      const telegramHandle = doctor.telegram ? getSocialUsername(doctor.telegram, 'telegram') : null;
      const whatsappHandle = doctor.whatsapp ? getSocialUsername(doctor.whatsapp, 'whatsapp') : null;

      const MyDoc = (
        <Document>
          <Page size={[255.12, 141.73]} style={styles.page}>
            {/* Верхняя полоска */}
            <View style={styles.accentBar} />

            {/* Основной контент */}
            <View style={styles.content}>
              <View style={styles.left}>
                {/* Фото */}
                {doctor.image ? (
                  <Image src={doctor.image} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder} />
                )}

                {/* Имя, специальность, место работы */}
                <View style={styles.info}>
                  <Text style={styles.name}>{doctor.name}</Text>
                  {specialtyLabel ? <Text style={styles.specialty}>{specialtyLabel}</Text> : null}
                  {doctor.workplace ? <Text style={styles.workplace}>{doctor.workplace}</Text> : null}

                  {/* Соцсети */}
                  {(instagramHandle || telegramHandle || whatsappHandle) ? (
                    <View style={{ marginTop: 5 }}>
                      {instagramHandle ? (
                        <View style={styles.socialRow}>
                          <Text style={{ ...styles.socialText, color: '#e1306c' }}>IG</Text>
                          <Text style={styles.socialText}>{instagramHandle}</Text>
                        </View>
                      ) : null}
                      {telegramHandle ? (
                        <View style={styles.socialRow}>
                          <Text style={{ ...styles.socialText, color: '#0088cc' }}>TG</Text>
                          <Text style={styles.socialText}>{telegramHandle}</Text>
                        </View>
                      ) : null}
                      {whatsappHandle ? (
                        <View style={styles.socialRow}>
                          <Text style={{ ...styles.socialText, color: '#25d366' }}>WA</Text>
                          <Text style={styles.socialText}>{whatsappHandle}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Правая колонка */}
              <View style={styles.right}>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>{__('verified')}</Text>
                </View>
                <Image src={qrUrl} style={styles.qr} />
              </View>
            </View>

            {/* Футер */}
            <View style={styles.footer}>
              <View style={styles.stats}>
                {doctor.articlesCount > 0 ? (
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{doctor.articlesCount}</Text>
                    <Text style={styles.statLbl}>{__('articles')}</Text>
                  </View>
                ) : null}
                {doctor.experience > 0 ? (
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{doctor.experience}</Text>
                    <Text style={styles.statLbl}>{__('years')}</Text>
                  </View>
                ) : null}
                {doctor.languages?.length > 0 ? (
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{doctor.languages.length}</Text>
                    <Text style={styles.statLbl}>{__('languages')}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.profileUrl}>{profileUrl}</Text>
            </View>

            {/* Нижняя полоска */}
            <View style={styles.accentBar} />
          </Page>
        </Document>
      );

      const blob = await pdf(MyDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vizitka-${doctorSlug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // Инкрементируем счётчик скачиваний
      fetch(`/api/doctor/${doctorSlug}/card?format=count`, { method: 'POST' }).catch(() => {});
    } catch (err) {
      console.error('PDF error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="no-print w-full bg-gradient-to-r from-[#0a1628] to-[#0f2a52] border border-blue-900/40 rounded-2xl p-4 flex items-center justify-center gap-2.5 text-sm font-bold text-white hover:from-[#0f2a52] hover:to-[#1a3a6e] transition-all duration-300 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Генерируем PDF...</span>
        </>
      ) : error ? (
        <>
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-300">Ошибка. Попробуйте ещё раз</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{btnText[lang] || btnText.ru}</span>
        </>
      )}
    </button>
  );
}
