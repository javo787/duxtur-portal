'use client';

import { useState } from 'react';

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

// иконки соцсетей (Cloudinary)
const ICON_IG = 'https://res.cloudinary.com/dprydst2c/image/upload/v1778719653/instagram_1_iqjqbu.png';
const ICON_TG = 'https://res.cloudinary.com/dprydst2c/image/upload/v1778719654/telegram_gtzapm.png';
const ICON_WA = 'https://res.cloudinary.com/dprydst2c/image/upload/v1778719653/whatsapp_x8ilnv.png';

// 90x50мм
const W = 255.12;
const H = 141.73;
const BAR_H = 2;

export default function DownloadCardButton({ doctorSlug, lang }: DownloadCardButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setError(false);

    try {
      const { pdf, Document, Page, View, Text, Image, StyleSheet, Font } =
        await import('@react-pdf/renderer');

      Font.register({
        family: 'NotoSans',
        fonts: [
          { src: '/fonts/NotoSans-Regular.ttf', fontWeight: 400 },
          { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 700 },
          { src: '/fonts/NotoSans-Black.ttf', fontWeight: 900 },
        ],
      });

      const res = await fetch(`/api/doctor/${doctorSlug}/card?lang=${lang}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const doctor = await res.json();

      const accent = doctor.accentColor || '#2563eb';
      const theme = doctor.cardTheme || 'dark';

      const bg = theme === 'dark' ? '#000000' : '#ffffff';
      const bg2 = theme === 'dark' ? '#0a0a0a' : '#fafafa';
      const surface = theme === 'dark' ? '#111111' : '#f5f5f7';
      const border = theme === 'dark' ? '#1d1d1f' : '#e8e8ed';
      const textPrimary = theme === 'dark' ? '#f5f5f7' : '#1d1d1f';
      const textSecondary = theme === 'dark' ? '#86868b' : '#6e6e73';
      const textTertiary = theme === 'dark' ? '#48484a' : '#aeaeb2';

      const t = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[lang] || field['ru'] || '';
      };

      const truncate = (str: string, max: number) =>
        str && str.length > max ? str.slice(0, max) + '…' : str || '';

      const getSocialHandle = (url: string, type: 'instagram' | 'telegram' | 'whatsapp') => {
        if (!url) return null;
        if (type === 'instagram') {
          const m = url.match(/instagram\.com\/([^/?]+)/);
          return m ? `@${m[1]}` : url;
        }
        if (type === 'telegram') {
          const m = url.match(/t(?:elegram)?\.me\/([^/?]+)/);
          return m ? `@${m[1]}` : url;
        }
        // Исправляем двойной плюс
        return url.replace('https://wa.me/', '+').replace(/^\++/, '+');
      };

      const specialtyLabel = truncate(t(doctor.specialty) || t(doctor.specialization) || '', 40);
      const displayName = truncate(doctor.name || '', 30);
      const displayWork = truncate(doctor.workplace || '', 50);
      const rawBio = typeof doctor.bio === 'string' ? doctor.bio : (doctor.bio?.[lang] || doctor.bio?.ru || '');
      const bioText = truncate(rawBio, 140);
      const showExperience = (doctor.experience || 0) >= 3;

      const ig = doctor.instagram ? getSocialHandle(doctor.instagram, 'instagram') : null;
      const tg = doctor.telegram ? getSocialHandle(doctor.telegram, 'telegram') : null;
      const wa = doctor.whatsapp ? getSocialHandle(doctor.whatsapp, 'whatsapp') : null;

      const phoneDisplay = doctor.phone
        ? (doctor.phone.startsWith('+') ? doctor.phone : `+${doctor.phone}`)
        : null;

      const profileUrl = `duxtur.org/${lang}/doctor/${doctorSlug}`;

      const qrBgColor = theme === 'dark' ? '000000' : 'ffffff';
      const qrFgColor = theme === 'dark' ? 'f5f5f7' : '1d1d1f';
      const qrUrlFront = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`https://duxtur.org/${lang}/doctor/${doctorSlug}`)}&bgcolor=${qrBgColor}&color=${qrFgColor}&margin=6`;
      const qrUrlBack = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://duxtur.org/${lang}/doctor/${doctorSlug}`)}&bgcolor=${theme === 'dark' ? '0a0a0a' : 'fafafa'}&color=${qrFgColor}&margin=8`;

      const dict: Record<string, any> = {
        ru: { verified: 'Верифицированный врач', years: 'лет практики', articles: 'статей', languages: 'языков', mission: 'МОЯ МИССИЯ', scan: 'Сканируйте для\nполного профиля', myProfile: 'МОЙ ПРОФИЛЬ', reception: 'ЧАСЫ ПРИЁМА', langLabel: 'ЯЗЫКИ ПРИЁМА', articlesLabel: 'МОИ СТАТЬИ', allByQr: 'Все материалы доступны по QR' },
        uz: { verified: 'Tasdiqlangan shifokor', years: 'yil tajriba', articles: 'maqola', languages: 'til', mission: 'MENING MAQSADIM', scan: 'To\'liq profil uchun\nskanlang', myProfile: 'MENING PROFILIM', reception: 'QABUL VAQTI', langLabel: 'TILLAR', articlesLabel: 'MAQOLALARIM', allByQr: 'Barcha materiallar QR orqali' },
        tg: { verified: 'Шифокори тасдикшуда', years: 'соли таҷриба', articles: 'мақола', languages: 'забон', mission: 'МАҚСАДИ МАН', scan: 'Барои профил\nQR скан кунед', myProfile: 'ПРОФИЛИ МАН', reception: 'СОАТҲОИ ҚАБУЛ', langLabel: 'ЗАБОНҲО', articlesLabel: 'МАҚОЛАҲОЯМ', allByQr: 'Ҳама маводҳо тавассути QR' },
        kk: { verified: 'Тексерілген дәрігер', years: 'жыл тәжірибе', articles: 'мақала', languages: 'тіл', mission: 'МЕНІҢ МАҚСАТЫМ', scan: 'Толық профиль үшін\nQR сканерлеңіз', myProfile: 'МЕНІҢ ПРОФИЛІМ', reception: 'ҚАБЫЛДАУ УАҚЫТЫ', langLabel: 'ТІЛДЕР', articlesLabel: 'МАҚАЛАЛАРЫМ', allByQr: 'Барлық материалдар QR арқылы' },
        ky: { verified: 'Текшерилген дарыгер', years: 'жыл тажрыйба', articles: 'макала', languages: 'тил', mission: 'МЕНИН МАКСАТЫМ', scan: 'Толук профиль үчүн\nQR сканерлеңиз', myProfile: 'МЕНИН ПРОФИЛИМ', reception: 'КАБЫЛ АЛУУ', langLabel: 'ТИЛДЕР', articlesLabel: 'МАКАЛАЛАРЫМ', allByQr: 'Бардык материалдар QR аркылуу' },
      };
      const __ = (key: string) => dict[lang]?.[key] || dict.ru[key];

      const s = StyleSheet.create({
        // ─── ОБЩИЕ СТРАНИЦЫ ────────────────────────────────
        page: {
          width: W,
          height: H,
          backgroundColor: bg,
          fontFamily: 'NotoSans',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        inner: {
          flex: 1,
          paddingHorizontal: 10,
          paddingVertical: 7,
        },
        // полоски
        accentBar: { height: BAR_H, backgroundColor: accent },

        // ─── ПЕРЕДНЯЯ СТОРОНА ─────────────────────────────
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        logoRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
        logoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: accent },
        logoText: { fontSize: 8, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans', letterSpacing: 0.3 },
        logoSub: { fontSize: 6, color: textTertiary, fontFamily: 'NotoSans' },
        verifiedPill: {
          flexDirection: 'row', alignItems: 'center', gap: 3,
          backgroundColor: 'rgba(52,199,89,0.1)',
          borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2,
        },
        verifiedDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#34c759' },
        verifiedText: { fontSize: 6, fontWeight: 700, color: '#34c759', fontFamily: 'NotoSans' },

        body: { flexDirection: 'row', flex: 1, gap: 9 },

        photoWrap: { flexDirection: 'column', alignItems: 'center', paddingTop: 0, marginTop: -2 },
        photo: { width: 46, height: 46, borderRadius: 10, objectFit: 'cover' },
        photoPlaceholder: { width: 46, height: 46, borderRadius: 10, backgroundColor: surface },

        infoCol: { flex: 1, flexDirection: 'column' },
        specialtyPill: {
          alignSelf: 'flex-start',
          backgroundColor: `${accent}18`,
          borderRadius: 20,
          paddingHorizontal: 6, paddingVertical: 2,
          marginBottom: 3,
        },
        specialtyText: {
          fontSize: 6, fontWeight: 700, color: accent,
          fontFamily: 'NotoSans', textTransform: 'uppercase', letterSpacing: 0.5,
        },
        name: {
          fontSize: 10.5, fontWeight: 900, color: textPrimary,
          fontFamily: 'NotoSans', lineHeight: 1.1, marginBottom: 2,
        },
        workplace: { fontSize: 6.5, color: textSecondary, fontFamily: 'NotoSans', marginBottom: 4 },

        expRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
        expLine: { width: 2, height: 12, borderRadius: 1, backgroundColor: accent },
        expText: { fontSize: 7, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans' },

        phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
        phonePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: accent },
        phoneText: { fontSize: 8, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans' },

        socialsCol: { flexDirection: 'column', gap: 3 },
        socialRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
        socialIcon: { width: 14, height: 14, borderRadius: 3 },
        socialHandle: { fontSize: 6.5, color: textSecondary, fontFamily: 'NotoSans' },

        // Абсолютное позиционирование QR
        qrAbs: {
          position: 'absolute',
          right: 8,
          bottom: 14,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        },
        qrWrap: {
          width: 44, height: 44,
          borderRadius: 8,
          backgroundColor: theme === 'dark' ? '#111111' : '#f5f5f7',
          padding: 3,
          alignItems: 'center',
          justifyContent: 'center',
        },
        qrImg: { width: 38, height: 38 },
        qrLabel: { fontSize: 6, color: textTertiary, fontFamily: 'NotoSans', textAlign: 'center' },

        divider: { height: 0.5, backgroundColor: border, marginVertical: 5 },

        footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        statsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
        statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
        statNum: { fontSize: 9, fontWeight: 900, color: textPrimary, fontFamily: 'NotoSans' },
        statLabel: { fontSize: 6, color: textSecondary, fontFamily: 'NotoSans' },
        footerUrl: { fontSize: 6, color: accent, fontFamily: 'NotoSans' },

        // ─── ЗАДНЯЯ СТОРОНА ───────────────────────────────
        backPage: {
          width: W,
          height: H,
          backgroundColor: bg2,
          fontFamily: 'NotoSans',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        backInner: {
          flex: 1,
          paddingHorizontal: 10,
          paddingVertical: 7,
        },
        backHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 6,
        },
        backNameCol: { flexDirection: 'column', gap: 1 },
        backName: { fontSize: 9, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans' },
        backSpecialty: { fontSize: 6.5, color: accent, fontFamily: 'NotoSans', fontWeight: 700 },
        backLogo: { fontSize: 8, fontWeight: 700, color: textTertiary, fontFamily: 'NotoSans' },
        backBody: { flexDirection: 'row', flex: 1, gap: 10 },
        backLeft: { flex: 1, flexDirection: 'column', gap: 7 },

        missionBox: {
          backgroundColor: surface,
          borderRadius: 8,
          padding: 8,
          borderLeftWidth: 2,
          borderLeftColor: accent,
        },
        missionLabel: {
          fontSize: 6, fontWeight: 700, color: accent,
          fontFamily: 'NotoSans', letterSpacing: 0.6, marginBottom: 4,
        },
        missionText: {
          fontSize: 7.5, color: textPrimary,
          fontFamily: 'NotoSans', lineHeight: 1.5,
          fontStyle: 'italic',
        },

        infoBlock: { flexDirection: 'column', gap: 2 },
        infoBlockLabel: {
          fontSize: 6, fontWeight: 700, color: textTertiary,
          fontFamily: 'NotoSans', letterSpacing: 0.6,
        },
        infoBlockText: {
          fontSize: 7.5, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans',
        },

        langTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
        langTag: {
          backgroundColor: `${accent}15`,
          borderRadius: 4,
          paddingHorizontal: 5, paddingVertical: 2,
        },
        langTagText: { fontSize: 6, color: accent, fontWeight: 700, fontFamily: 'NotoSans' },

        backRight: {
          flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 5, width: 72,
        },
        bigQrWrap: {
          width: 64, height: 64,
          borderRadius: 10,
          backgroundColor: theme === 'dark' ? '#111111' : '#f5f5f7',
          padding: 4,
          alignItems: 'center', justifyContent: 'center',
        },
        bigQrImg: { width: 56, height: 56 },
        bigQrLabel: {
          fontSize: 6, color: textSecondary,
          fontFamily: 'NotoSans', textAlign: 'center', lineHeight: 1.5,
        },

        // Нижний колонтитул задней стороны (вынесен из backInner)
        backFooterContainer: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        backFooterLeft: { flexDirection: 'column', gap: 1 },
        backFooterLabel: {
          fontSize: 6, color: textTertiary,
          fontFamily: 'NotoSans', letterSpacing: 0.4,
        },
        backFooterText: {
          fontSize: 7, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans',
        },
      });

      const MyDoc = (
        <Document>
          {/* ── Передняя сторона ── */}
          <Page size={[W, H]} style={s.page}>
            <View style={s.accentBar} />
            <View style={s.inner}>
              <View style={s.header}>
                <View style={s.logoRow}>
                  <View style={s.logoDot} />
                  <Text style={s.logoText}>duxtur.org</Text>
                  <Text style={s.logoSub}> · МЕДИЦИНСКИЙ ПОРТАЛ</Text>
                </View>
                <View style={s.verifiedPill}>
                  <View style={s.verifiedDot} />
                  <Text style={s.verifiedText}>{__('verified')}</Text>
                </View>
              </View>

              <View style={s.divider} />

              <View style={s.body}>
                <View style={s.photoWrap}>
                  {doctor.image ? (
                    <Image src={doctor.image} style={s.photo} />
                  ) : (
                    <View style={s.photoPlaceholder} />
                  )}
                </View>

                <View style={s.infoCol}>
                  {specialtyLabel ? (
                    <View style={s.specialtyPill}>
                      <Text style={s.specialtyText}>{specialtyLabel}</Text>
                    </View>
                  ) : null}
                  <Text style={s.name}>{displayName}</Text>
                  {displayWork ? <Text style={s.workplace}>{displayWork}</Text> : null}

                  {showExperience ? (
                    <View style={s.expRow}>
                      <View style={s.expLine} />
                      <Text style={s.expText}>{doctor.experience} {__('years')}</Text>
                    </View>
                  ) : null}

                  {phoneDisplay ? (
                    <View style={s.phoneRow}>
                      <View style={s.phonePulse} />
                      <Text style={s.phoneText}>{phoneDisplay}</Text>
                    </View>
                  ) : null}

                  {(ig || tg || wa) ? (
                    <View style={s.socialsCol}>
                      {ig ? (
                        <View style={s.socialRow}>
                          <Image src={ICON_IG} style={s.socialIcon} />
                          <Text style={s.socialHandle}>{ig}</Text>
                        </View>
                      ) : null}
                      {tg ? (
                        <View style={s.socialRow}>
                          <Image src={ICON_TG} style={s.socialIcon} />
                          <Text style={s.socialHandle}>{tg}</Text>
                        </View>
                      ) : null}
                      {wa ? (
                        <View style={s.socialRow}>
                          <Image src={ICON_WA} style={s.socialIcon} />
                          <Text style={s.socialHandle}>{wa}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={s.divider} />

              <View style={s.footer}>
                <View style={s.statsRow}>
                  {(doctor.articlesCount || 0) > 0 ? (
                    <View style={s.statItem}>
                      <Text style={s.statNum}>{doctor.articlesCount}</Text>
                      <Text style={s.statLabel}> {__('articles')}</Text>
                    </View>
                  ) : null}
                  {(doctor.languages?.length || 0) > 0 ? (
                    <View style={s.statItem}>
                      <Text style={s.statNum}>{doctor.languages.length}</Text>
                      <Text style={s.statLabel}> {__('languages')}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={s.footerUrl}>{profileUrl}</Text>
              </View>
            </View>

            {/* QR абсолютно в правом нижнем углу */}
            <View style={s.qrAbs}>
              <View style={s.qrWrap}>
                <Image src={qrUrlFront} style={s.qrImg} />
              </View>
              <Text style={s.qrLabel}>{__('myProfile')}</Text>
            </View>

            <View style={s.accentBar} />
          </Page>

          {/* ── Задняя сторона ── */}
          <Page size={[W, H]} style={s.backPage}>
            <View style={s.accentBar} />
            <View style={s.backInner}>
              <View style={s.backHeader}>
                <View style={s.backNameCol}>
                  <Text style={s.backName}>{displayName}</Text>
                  {specialtyLabel ? <Text style={s.backSpecialty}>{specialtyLabel}</Text> : null}
                </View>
                <Text style={s.backLogo}>duxtur.org</Text>
              </View>

              <View style={s.divider} />

              <View style={s.backBody}>
                <View style={s.backLeft}>
                  {bioText ? (
                    <View style={s.missionBox}>
                      <Text style={s.missionLabel}>{__('mission')}</Text>
                      <Text style={s.missionText}>«{bioText}»</Text>
                    </View>
                  ) : null}

                  {doctor.workingHours ? (
                    <View style={s.infoBlock}>
                      <Text style={s.infoBlockLabel}>{__('reception')}</Text>
                      <Text style={s.infoBlockText}>{doctor.workingHours}</Text>
                    </View>
                  ) : null}

                  {(doctor.languages?.length || 0) > 0 ? (
                    <View style={s.infoBlock}>
                      <Text style={s.infoBlockLabel}>{__('langLabel')}</Text>
                      <View style={s.langTags}>
                        {doctor.languages.map((l: string, i: number) => (
                          <View key={i} style={s.langTag}>
                            <Text style={s.langTagText}>{l}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={s.backRight}>
                  <View style={s.bigQrWrap}>
                    <Image src={qrUrlBack} style={s.bigQrImg} />
                  </View>
                  <Text style={s.bigQrLabel}>{__('scan')}</Text>
                </View>
              </View>
            </View>

            {/* Footer задней стороны вынесен наружу */}
            <View style={s.backFooterContainer}>
              <View style={s.backFooterLeft}>
                <Text style={s.backFooterLabel}>{__('articlesLabel')}</Text>
                <Text style={s.backFooterText}>{__('allByQr')}</Text>
              </View>
              <Text style={s.footerUrl}>{profileUrl}</Text>
            </View>

            <View style={s.accentBar} />
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

      const beaconUrl = `/api/doctor/${doctorSlug}/card`;
      if (navigator.sendBeacon) {
        navigator.sendBeacon(beaconUrl);
      } else {
        fetch(beaconUrl, { method: 'POST' }).catch(() => {});
      }
    } catch (err) {
      console.error('PDF error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="no-print flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#0a1628] to-[#0f2a52] border border-blue-900/40 rounded-2xl p-4 flex items-center justify-center gap-2.5 text-sm font-bold text-white hover:from-[#0f2a52] hover:to-[#1a3a6e] transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Генерируем PDF…</span>
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
      <p className="text-xs text-center text-gray-500">
        PDF · 2 стороны · для печати и мессенджеров
      </p>
    </div>
  );
}
