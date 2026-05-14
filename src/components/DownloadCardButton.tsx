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

const ICON_IG = 'https://res.cloudinary.com/dprydst2c/image/upload/v1778719653/instagram_1_iqjqbu.png';
const ICON_TG = 'https://res.cloudinary.com/dprydst2c/image/upload/v1778719654/telegram_gtzapm.png';
const ICON_WA = 'https://res.cloudinary.com/dprydst2c/image/upload/v1778719653/whatsapp_x8ilnv.png';

const W = 255.12;
const H = 141.73;

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
      const bg          = theme === 'dark' ? '#000000' : '#ffffff';
      const bg2         = theme === 'dark' ? '#0c0c0c' : '#f9f9f9';
      const surface     = theme === 'dark' ? '#141414' : '#f0f0f0';
      const border      = theme === 'dark' ? '#222222' : '#e5e5e5';
      const textPrimary    = theme === 'dark' ? '#f0f0f0' : '#111111';
      const textSecondary  = theme === 'dark' ? '#888888' : '#666666';
      const textTertiary   = theme === 'dark' ? '#444444' : '#bbbbbb';

      const t = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[lang] || field['ru'] || '';
      };
      const truncate = (str: string, max: number) =>
        str && str.length > max ? str.slice(0, max) + '…' : str || '';

      const getSocial = (url: string, type: 'instagram' | 'telegram' | 'whatsapp') => {
        if (!url) return null;
        if (type === 'instagram') {
          const m = url.match(/instagram\.com\/([^/?]+)/);
          return m ? `@${m[1]}` : url;
        }
        if (type === 'telegram') {
          const m = url.match(/t(?:elegram)?\.me\/([^/?]+)/);
          return m ? `@${m[1]}` : url;
        }
        return url.replace('https://wa.me/', '').replace(/^\+?/, '+');
      };

      const displayName    = truncate(t(doctor.name) || doctor.name || '', 28);
      const specialty      = truncate(t(doctor.specialty) || t(doctor.specialization) || '', 36);
      const rawBio         = typeof doctor.bio === 'string' ? doctor.bio : (doctor.bio?.[lang] || doctor.bio?.ru || '');
      const missionShort   = truncate(rawBio, 65);
      const missionFull    = truncate(rawBio, 160);
      const phoneDisplay   = doctor.phone ? (doctor.phone.startsWith('+') ? doctor.phone : `+${doctor.phone}`) : null;
      const ig = doctor.instagram ? getSocial(doctor.instagram, 'instagram') : null;
      const tg = doctor.telegram  ? getSocial(doctor.telegram,  'telegram')  : null;
      const wa = doctor.whatsapp  ? getSocial(doctor.whatsapp,  'whatsapp')  : null;
      const profileUrl = `duxtur.org/${lang}/doctor/${doctorSlug}`;

      const qrColor = theme === 'dark' ? 'f0f0f0' : '111111';
      const qrBg    = theme === 'dark' ? '000000' : 'ffffff';
      const qrFront = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://duxtur.org/${lang}/doctor/${doctorSlug}`)}&bgcolor=${qrBg}&color=${qrColor}&margin=4`;
      const qrBack  = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://duxtur.org/${lang}/doctor/${doctorSlug}`)}&bgcolor=${theme === 'dark' ? '0c0c0c' : 'f9f9f9'}&color=${qrColor}&margin=6`;

      const dict: Record<string, any> = {
        ru: { verified: 'Верифицирован', years: 'лет', scan: 'МОЙ ПРОФИЛЬ', reception: 'ЧАСЫ ПРИЁМА', langLabel: 'ЯЗЫКИ', mission: 'МОЯ МИССИЯ', contacts: 'КОНТАКТЫ', allByQr: 'Все статьи по QR-коду' },
        uz: { verified: 'Tasdiqlangan', years: 'yil', scan: 'MENING PROFILIM', reception: 'QABUL VAQTI', langLabel: 'TILLAR', mission: 'MAQSADIM', contacts: 'KONTAKTLAR', allByQr: 'Barcha maqolalar QR orqali' },
        tg: { verified: 'Тасдикшуда', years: 'сол', scan: 'ПРОФИЛИ МАН', reception: 'СОАТҲОИ ҚАБУЛ', langLabel: 'ЗАБОНҲО', mission: 'МАҚСАДИ МАН', contacts: 'ТАМОС', allByQr: 'Ҳама мақолаҳо тавассути QR' },
        kk: { verified: 'Тексерілген', years: 'жыл', scan: 'МЕНІҢ ПРОФИЛІМ', reception: 'ҚАБЫЛДАУ', langLabel: 'ТІЛДЕР', mission: 'МЕНІҢ МАҚСАТЫМ', contacts: 'БАЙЛАНЫС', allByQr: 'Барлық мақалалар QR арқылы' },
        ky: { verified: 'Текшерилген', years: 'жыл', scan: 'МЕНИН ПРОФИЛИМ', reception: 'КАБЫЛ АЛУУ', langLabel: 'ТИЛДЕР', mission: 'МЕНИН МАКСАТЫМ', contacts: 'БАЙЛАНЫШ', allByQr: 'Бардык макалалар QR аркылуу' },
      };
      const __ = (k: string) => dict[lang]?.[k] || dict.ru[k];

      const s = StyleSheet.create({
        // ══ ПЕРЕДНЯЯ ══════════════════════════════════════
        page: {
          width: W, height: H,
          backgroundColor: bg,
          fontFamily: 'NotoSans',
          flexDirection: 'column',
        },
        bar: { height: 2.5, backgroundColor: accent },

        // Шапка — 1 строка
        topRow: {
          height: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
        },
        logoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        logoDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: accent },
        logoText: { fontSize: 8.5, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans' },
        logoSub: { fontSize: 6, color: textTertiary, fontFamily: 'NotoSans' },
        verBadge: {
          flexDirection: 'row', alignItems: 'center', gap: 3,
          backgroundColor: 'rgba(52,199,89,0.12)',
          borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2.5,
        },
        verDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#34c759' },
        verText: { fontSize: 6, fontWeight: 700, color: '#34c759', fontFamily: 'NotoSans' },

        divLine: { height: 0.5, backgroundColor: border, marginHorizontal: 12 },

        // Центральный блок
        centerRow: {
          flex: 1,
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 12,
        },

        // Фото
        photo: {
          width: 52, height: 52,
          borderRadius: 10,
          objectFit: 'cover',
        },
        photoPlaceholder: {
          width: 52, height: 52,
          borderRadius: 10,
          backgroundColor: surface,
        },

        // Инфо — середина
        infoCol: {
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 3,
        },
        specialtyBadge: {
          alignSelf: 'flex-start',
          backgroundColor: `${accent}20`,
          borderRadius: 20,
          paddingHorizontal: 7, paddingVertical: 2,
        },
        specialtyText: {
          fontSize: 6, fontWeight: 700, color: accent,
          fontFamily: 'NotoSans', textTransform: 'uppercase', letterSpacing: 0.6,
        },
        nameText: {
          fontSize: 12, fontWeight: 900, color: textPrimary,
          fontFamily: 'NotoSans', lineHeight: 1.15,
        },
        phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
        phoneDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: accent },
        phoneText: { fontSize: 9, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans' },
        missionRow: { marginTop: 3 },
        missionShortText: {
          fontSize: 6.5, color: textSecondary,
          fontFamily: 'NotoSans', fontStyle: 'italic', lineHeight: 1.4,
        },

        // QR — правая колонка
        qrCol: {
          width: 54,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        },
        qrBox: {
          width: 50, height: 50,
          borderRadius: 8,
          backgroundColor: theme === 'dark' ? '#141414' : '#f0f0f0',
          padding: 3,
        },
        qrImg: { width: 44, height: 44 },
        qrText: {
          fontSize: 5.5, color: textTertiary,
          fontFamily: 'NotoSans', textAlign: 'center', letterSpacing: 0.4,
        },

        // Footer
        bottomRow: {
          height: 18,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
        },
        footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
        statNum: { fontSize: 9, fontWeight: 900, color: textPrimary, fontFamily: 'NotoSans' },
        statLabel: { fontSize: 6, color: textSecondary, fontFamily: 'NotoSans' },
        footerUrl: { fontSize: 6, color: accent, fontFamily: 'NotoSans' },

        // ══ ЗАДНЯЯ ════════════════════════════════════════
        backPage: {
          width: W, height: H,
          backgroundColor: bg2,
          fontFamily: 'NotoSans',
          flexDirection: 'column',
        },

        // Шапка задней
        backTop: {
          height: 26,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
        },
        backName: { fontSize: 9, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans' },
        backSpecialty: { fontSize: 6.5, color: accent, fontFamily: 'NotoSans', fontWeight: 700 },
        backLogoText: { fontSize: 7.5, fontWeight: 700, color: textTertiary, fontFamily: 'NotoSans' },

        // Тело задней — 2 колонки
        backBody: {
          flex: 1,
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingBottom: 6,
          gap: 14,
        },

        // Левая колонка задней
        backLeft: {
          flex: 1,
          flexDirection: 'column',
          gap: 8,
        },

        // Соцсети
        contactsLabel: {
          fontSize: 6, fontWeight: 700, color: textTertiary,
          fontFamily: 'NotoSans', letterSpacing: 0.7, marginBottom: 2,
        },
        socialsCol: { flexDirection: 'column', gap: 6 },
        socialRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        socialIcon: { width: 18, height: 18, borderRadius: 4 },
        socialHandle: { fontSize: 8, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans' },

        // Часы
        blockLabel: {
          fontSize: 6, fontWeight: 700, color: textTertiary,
          fontFamily: 'NotoSans', letterSpacing: 0.7, marginBottom: 2,
        },
        blockValue: {
          fontSize: 8.5, fontWeight: 700, color: textPrimary, fontFamily: 'NotoSans',
        },

        // Языки
        langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
        langTag: {
          backgroundColor: `${accent}18`,
          borderRadius: 4,
          paddingHorizontal: 6, paddingVertical: 2,
        },
        langText: { fontSize: 6.5, color: accent, fontWeight: 700, fontFamily: 'NotoSans' },

        // Правая колонка задней — QR + миссия
        backRight: {
          width: 80,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        },
        bigQrBox: {
          width: 70, height: 70,
          borderRadius: 10,
          backgroundColor: theme === 'dark' ? '#141414' : '#f0f0f0',
          padding: 4,
        },
        bigQrImg: { width: 62, height: 62 },
        scanText: {
          fontSize: 6, color: textSecondary,
          fontFamily: 'NotoSans', textAlign: 'center', lineHeight: 1.5,
        },

        // Миссия задней
        missionBox: {
          backgroundColor: surface,
          borderRadius: 6,
          padding: 7,
          borderLeftWidth: 2,
          borderLeftColor: accent,
        },
        missionLabel: {
          fontSize: 6, fontWeight: 700, color: accent,
          fontFamily: 'NotoSans', letterSpacing: 0.6, marginBottom: 3,
        },
        missionText: {
          fontSize: 7, color: textPrimary,
          fontFamily: 'NotoSans', fontStyle: 'italic', lineHeight: 1.45,
        },

        // Footer задней
        backBottom: {
          height: 18,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
        },
        backFooterText: {
          fontSize: 6.5, fontWeight: 700, color: textSecondary, fontFamily: 'NotoSans',
        },
      });

      const MyDoc = (
        <Document>

          {/* ══════ ПЕРЕДНЯЯ СТОРОНА ══════ */}
          <Page size={[W, H]} style={s.page}>
            <View style={s.bar} />

            <View style={s.topRow}>
              <View style={s.logoRow}>
                <View style={s.logoDot} />
                <Text style={s.logoText}>duxtur.org</Text>
                <Text style={s.logoSub}> · МЕДИЦИНСКИЙ ПОРТАЛ</Text>
              </View>
              <View style={s.verBadge}>
                <View style={s.verDot} />
                <Text style={s.verText}>{__('verified')}</Text>
              </View>
            </View>

            <View style={s.divLine} />

            <View style={s.centerRow}>
              {/* Фото */}
              {doctor.image
                ? <Image src={doctor.image} style={s.photo} />
                : <View style={s.photoPlaceholder} />}

              {/* Инфо */}
              <View style={s.infoCol}>
                {specialty
                  ? <View style={s.specialtyBadge}>
                      <Text style={s.specialtyText}>{specialty}</Text>
                    </View>
                  : null}
                <Text style={s.nameText}>{displayName}</Text>
                {phoneDisplay
                  ? <View style={s.phoneRow}>
                      <View style={s.phoneDot} />
                      <Text style={s.phoneText}>{phoneDisplay}</Text>
                    </View>
                  : null}
                {missionShort
                  ? <View style={s.missionRow}>
                      <Text style={s.missionShortText}>«{missionShort}»</Text>
                    </View>
                  : null}
              </View>

              {/* QR */}
              <View style={s.qrCol}>
                <View style={s.qrBox}>
                  <Image src={qrFront} style={s.qrImg} />
                </View>
                <Text style={s.qrText}>{__('scan')}</Text>
              </View>
            </View>

            <View style={s.divLine} />

            <View style={s.bottomRow}>
              <View style={s.footerLeft}>
                {(doctor.articlesCount || 0) > 0
                  ? <View style={s.statItem}>
                      <Text style={s.statNum}>{doctor.articlesCount}</Text>
                      <Text style={s.statLabel}> статей</Text>
                    </View>
                  : null}
                {(doctor.languages?.length || 0) > 0
                  ? <View style={s.statItem}>
                      <Text style={s.statNum}>{doctor.languages.length}</Text>
                      <Text style={s.statLabel}> языков</Text>
                    </View>
                  : null}
              </View>
              <Text style={s.footerUrl}>{profileUrl}</Text>
            </View>

            <View style={s.bar} />
          </Page>

          {/* ══════ ЗАДНЯЯ СТОРОНА ══════ */}
          <Page size={[W, H]} style={s.backPage}>
            <View style={s.bar} />

            <View style={s.backTop}>
              <View>
                <Text style={s.backName}>{displayName}</Text>
                {specialty ? <Text style={s.backSpecialty}>{specialty}</Text> : null}
              </View>
              <Text style={s.backLogoText}>duxtur.org</Text>
            </View>

            <View style={s.divLine} />

            <View style={s.backBody}>

              {/* Левая колонка */}
              <View style={s.backLeft}>

                {/* Соцсети */}
                {(ig || tg || wa)
                  ? <View>
                      <Text style={s.contactsLabel}>{__('contacts')}</Text>
                      <View style={s.socialsCol}>
                        {ig ? <View style={s.socialRow}>
                          <Image src={ICON_IG} style={s.socialIcon} />
                          <Text style={s.socialHandle}>{ig}</Text>
                        </View> : null}
                        {tg ? <View style={s.socialRow}>
                          <Image src={ICON_TG} style={s.socialIcon} />
                          <Text style={s.socialHandle}>{tg}</Text>
                        </View> : null}
                        {wa ? <View style={s.socialRow}>
                          <Image src={ICON_WA} style={s.socialIcon} />
                          <Text style={s.socialHandle}>{wa}</Text>
                        </View> : null}
                      </View>
                    </View>
                  : null}

                {/* Часы */}
                {doctor.workingHours
                  ? <View>
                      <Text style={s.blockLabel}>{__('reception')}</Text>
                      <Text style={s.blockValue}>{doctor.workingHours}</Text>
                    </View>
                  : null}

                {/* Языки */}
                {(doctor.languages?.length || 0) > 0
                  ? <View>
                      <Text style={s.blockLabel}>{__('langLabel')}</Text>
                      <View style={s.langRow}>
                        {doctor.languages.map((l: string, i: number) => (
                          <View key={i} style={s.langTag}>
                            <Text style={s.langText}>{l}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  : null}

              </View>

              {/* Правая колонка */}
              <View style={s.backRight}>
                <View style={s.bigQrBox}>
                  <Image src={qrBack} style={s.bigQrImg} />
                </View>
                <Text style={s.scanText}>Сканируйте для{'\n'}полного профиля</Text>

                {missionFull
                  ? <View style={s.missionBox}>
                      <Text style={s.missionLabel}>{__('mission')}</Text>
                      <Text style={s.missionText}>«{missionFull}»</Text>
                    </View>
                  : null}
              </View>

            </View>

            <View style={s.divLine} />

            <View style={s.backBottom}>
              <Text style={s.backFooterText}>{__('allByQr')}</Text>
              <Text style={s.footerUrl}>{profileUrl}</Text>
            </View>

            <View style={s.bar} />
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

      if (navigator.sendBeacon) {
        navigator.sendBeacon(`/api/doctor/${doctorSlug}/card`);
      } else {
        fetch(`/api/doctor/${doctorSlug}/card`, { method: 'POST' }).catch(() => {});
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
