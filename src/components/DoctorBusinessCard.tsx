// src/components/DoctorBusinessCard.tsx
'use client';

import { QRCodeSVG } from 'qrcode.react';

interface DoctorBusinessCardProps {
  doctor: {
    name: string;
    image?: string;
    experience?: number;
    workplace?: string;
    education?: string;
    languages?: string[];
    phone?: string;
    bio?: string;
    slug?: string;
    _id?: string;
  };
  specialtyLabel: string;
  mission: string;
  articles: Array<{
    title: any;
    slug: string;
    createdAt: string;
  }>;
  lang: string;
  doctorUrl: string;
}

export default function DoctorBusinessCard({
  doctor,
  specialtyLabel,
  mission,
  articles,
  lang,
  doctorUrl,
}: DoctorBusinessCardProps) {
  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const topArticles = articles.slice(0, 4);

  return (
    // Этот div рендерится скрыто, только для html2canvas
    <div
      id="doctor-business-card"
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '794px',       // A4 ширина при 96dpi
        fontFamily: "'Georgia', 'Times New Roman', serif",
        background: 'transparent',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      {/* ══════════════════════════════════════
          СТРАНИЦА 1 — ЛИЦЕВАЯ (тёмная)
      ══════════════════════════════════════ */}
      <div
        id="card-page-1"
        style={{
          width: '794px',
          height: '1123px',   // A4 высота при 96dpi
          background: '#060d1a',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Фоновые декоративные круги */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          right: '-80px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Верхняя полоска-акцент */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #2563eb, #10b981, #2563eb)',
        }} />

        {/* Верхний блок — логотип + слоган */}
        <div style={{
          padding: '36px 52px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: '22px',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.5px',
              fontFamily: "'Georgia', serif",
            }}>
              duxtur<span style={{ color: '#334155', fontWeight: 300 }}>.org</span>
            </div>
            <div style={{
              fontSize: '10px',
              color: '#64748b',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginTop: '3px',
              fontFamily: 'sans-serif',
            }}>
              Медицинский портал Центральной Азии
            </div>
          </div>
          {/* Верифицировано бейдж */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '20px',
            padding: '6px 14px',
            fontFamily: 'sans-serif',
          }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="#10b981">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
              Верифицированный врач
            </span>
          </div>
        </div>

        {/* Центральный блок — фото + имя */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 52px',
          position: 'relative',
        }}>
          {/* Фото */}
          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 60px rgba(37,99,235,0.25)',
            marginBottom: '28px',
            background: '#0f2a52',
          }}>
            {doctor.image ? (
              <img
                src={doctor.image}
                alt={doctor.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f2a52, #1e3a6e)',
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Специальность */}
          <div style={{
            fontSize: '12px',
            fontFamily: 'sans-serif',
            color: '#3b82f6',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: '10px',
          }}>
            {specialtyLabel}
          </div>

          {/* Имя */}
          <div style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            marginBottom: '16px',
          }}>
            {doctor.name}
          </div>

          {/* Разделитель */}
          <div style={{
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
            marginBottom: '16px',
          }} />

          {/* Миссия */}
          <div style={{
            fontSize: '15px',
            color: 'rgba(148,163,184,0.9)',
            textAlign: 'center',
            fontStyle: 'italic',
            maxWidth: '520px',
            lineHeight: 1.6,
            marginBottom: '36px',
          }}>
            «{mission}»
          </div>

          {/* Детали — стаж, место работы */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {doctor.experience && doctor.experience > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px 20px',
                textAlign: 'center',
                fontFamily: 'sans-serif',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                  {doctor.experience}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', letterSpacing: '0.05em' }}>
                  лет опыта
                </div>
              </div>
            )}
            {doctor.workplace && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px 20px',
                textAlign: 'center',
                fontFamily: 'sans-serif',
                maxWidth: '280px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                  {doctor.workplace}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  место работы
                </div>
              </div>
            )}
            {doctor.languages && doctor.languages.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px 20px',
                textAlign: 'center',
                fontFamily: 'sans-serif',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                  {doctor.languages.join(' · ')}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  языки приёма
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Нижний блок — контакт + QR */}
        <div style={{
          padding: '28px 52px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Телефон + ссылка */}
          <div style={{ fontFamily: 'sans-serif' }}>
            {doctor.phone && (
              <div style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '6px',
                letterSpacing: '0.02em',
              }}>
                {doctor.phone}
              </div>
            )}
            <div style={{
              fontSize: '13px',
              color: '#3b82f6',
              fontWeight: 500,
            }}>
              {doctorUrl.replace('https://', '')}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#475569',
              marginTop: '4px',
            }}>
              Сканируйте QR для полного профиля →
            </div>
          </div>

          {/* QR код */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}>
            <QRCodeSVG
              value={doctorUrl}
              size={90}
              level="M"
            />
            <div style={{
              fontSize: '9px',
              color: '#64748b',
              fontFamily: 'sans-serif',
              letterSpacing: '0.05em',
            }}>
              МОЙ ПРОФИЛЬ
            </div>
          </div>
        </div>

        {/* Нижняя полоска */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #2563eb, #10b981, #2563eb)',
        }} />
      </div>

      {/* ══════════════════════════════════════
          СТРАНИЦА 2 — ОБОРОТ (светлая)
      ══════════════════════════════════════ */}
      <div
        id="card-page-2"
        style={{
          width: '794px',
          height: '1123px',
          background: '#f8fafc',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Верхняя полоска */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #2563eb, #10b981, #2563eb)',
        }} />

        {/* Декоративный фон */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle at top right, rgba(37,99,235,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Шапка страницы 2 */}
        <div style={{
          padding: '36px 52px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
              fontWeight: 600,
              marginBottom: '6px',
            }}>
              Советы от эксперта
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '-0.5px',
            }}>
              {doctor.name}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#3b82f6',
              fontFamily: 'sans-serif',
              marginTop: '4px',
              fontWeight: 500,
            }}>
              {specialtyLabel}
            </div>
          </div>
          <div style={{ fontFamily: 'sans-serif', textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              duxtur<span style={{ color: '#cbd5e1', fontWeight: 300 }}>.org</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', letterSpacing: '0.1em' }}>
              МЕДИЦИНСКИЙ ПОРТАЛ
            </div>
          </div>
        </div>

        {/* Миссия-цитата */}
        <div style={{
          margin: '28px 52px',
          background: 'linear-gradient(135deg, #0f2a52 0%, #1e3a6e 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '120px',
            color: 'rgba(255,255,255,0.04)',
            lineHeight: 1,
            fontFamily: 'Georgia, serif',
          }}>
            "
          </div>
          <div style={{
            fontSize: '11px',
            color: '#3b82f6',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontFamily: 'sans-serif',
            fontWeight: 600,
            marginBottom: '12px',
          }}>
            Моя миссия
          </div>
          <div style={{
            fontSize: '18px',
            color: '#ffffff',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            {mission}
          </div>
        </div>

        {/* Статьи */}
        {topArticles.length > 0 && (
          <div style={{ padding: '0 52px', flex: 1 }}>
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
              fontWeight: 600,
              marginBottom: '16px',
            }}>
              Мои публикации на duxtur.org
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topArticles.map((article, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontFamily: 'sans-serif',
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#2563eb',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      lineHeight: 1.3,
                    }}>
                      {t(article.title)}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      marginTop: '2px',
                    }}>
                      {new Date(article.createdAt).toLocaleDateString('ru', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#3b82f6',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}>
                    ЧИТАТЬ →
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Нижний блок — QR на статьи + призыв */}
        <div style={{
          padding: '28px 52px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '1px solid #e2e8f0',
          marginTop: 'auto',
        }}>
          <div style={{ fontFamily: 'sans-serif' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '4px',
            }}>
              Читайте проверенные медицинские статьи
            </div>
            <div style={{
              fontSize: '12px',
              color: '#64748b',
              lineHeight: 1.5,
              maxWidth: '380px',
            }}>
              Все материалы написаны и проверены практикующими врачами. 
              Только достоверная информация о здоровье на вашем языке.
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
              flexWrap: 'wrap',
            }}>
              {['Таджикский', 'Узбекский', 'Русский', 'Казахский', 'Кыргызский'].map((lang) => (
                <div key={lang} style={{
                  fontSize: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                }}>
                  {lang}
                </div>
              ))}
            </div>
          </div>

          {/* QR на профиль для статей */}
          <div style={{
            background: '#0f172a',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}>
            <QRCodeSVG
              value={doctorUrl}
              size={90}
              level="M"
              bgColor="#0f172a"
              fgColor="#ffffff"
            />
            <div style={{
              fontSize: '9px',
              color: '#64748b',
              letterSpacing: '0.05em',
            }}>
              МОИ СТАТЬИ
            </div>
          </div>
        </div>

        {/* Нижняя полоска */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #2563eb, #10b981, #2563eb)',
        }} />
      </div>
    </div>
  );
}
