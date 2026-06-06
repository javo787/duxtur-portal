import 'server-only'
import { ru } from '@/i18n/locales/ru'
import { uz } from '@/i18n/locales/uz'
import { tg } from '@/i18n/locales/tg'
import { kk } from '@/i18n/locales/kk'
import { ky } from '@/i18n/locales/ky'
import type { Locale, Translations } from '@/i18n/types'

const localeMap: Record<Locale, Translations> = { ru, uz, tg, kk, ky }

function mapToLegacy(locale: Translations): Record<string, string> {
  return {
    meta_title: locale.meta.title,
    meta_desc: locale.meta.description,
    nav_login: locale.nav.login,
    hero_title: locale.home.heroTitle,
    hero_subtitle: locale.home.heroSubtitle,
    hero_badge: locale.home.heroBadge,
    hero_cta_read: locale.home.heroCtaRead,
    hero_cta_write: locale.home.heroCtaWrite,
    hero_stat_languages: locale.home.heroStatLanguages,
    hero_stat_verification: locale.home.heroStatVerification,
    hero_stat_time: locale.home.heroStatTime,
    search_placeholder: locale.home.searchPlaceholder,
    search_btn: locale.common.search,
    cat_title: locale.home.categoriesTitle,
    cat_dentist: locale.blog.categoryDentistry,
    cat_cardio: locale.blog.categoryCardiology,
    cat_neuro: locale.blog.categoryNeurology,
    cat_pediatr: locale.blog.categoryPediatrics,
    blog_title: locale.home.articlesTitle,
    blog_verified: locale.blog.verified,
    read_more: locale.blog.readMore,
    for_doctors: locale.home.ctaTitle,
    for_doctors_desc: locale.home.ctaSubtitle,
    btn_join: locale.home.ctaBtn,
    doc_exp: locale.doctor.experience,
    doc_lang: locale.doctor.languages,
    doc_price: locale.doctor.priceFrom,
    book_btn: locale.doctor.bookAppointment,
    reviews: locale.doctor.reviews,
    years: locale.common.years,
    somoni: locale.common.currency,
    no_articles: locale.doctor.noArticles,
    login_title: locale.auth.loginTitle,
    login_subtitle: locale.auth.loginSubtitle,
    login_google: locale.auth.loginGoogle,
    login_or_email: locale.auth.loginEmail,
    login_forgot: locale.auth.loginForgot,
    login_no_acc: locale.auth.loginNoAcc,
    login_apply: locale.auth.loginApply,
    login_help: locale.auth.loginHelp,
    login_write_tg: locale.auth.loginWriteTg,
    reg_title: locale.auth.registerTitle,
    reg_subtitle: locale.auth.registerSubtitle,
    reg_google_title: locale.auth.registerGoogleTitle,
    reg_google_btn: locale.auth.registerGoogleBtn,
    reg_google_hint: locale.auth.registerGoogleHint,
    reg_or_pass: locale.auth.registerOr,
    reg_name: locale.auth.registerName,
    reg_specialty: locale.auth.registerSpecialty,
    reg_phone: locale.auth.registerPhone,
    reg_email: locale.auth.registerEmail,
    reg_pass: locale.auth.registerPassword,
    reg_diploma: locale.auth.registerDiploma,
    reg_upload: locale.auth.registerUpload,
    reg_upload_hint: locale.auth.registerUploadHint,
    reg_btn: locale.auth.registerBtn,
    reg_success_title: locale.auth.registerSuccessTitle,
    reg_success_desc: locale.auth.registerSuccessDesc,
    forgot_title: locale.auth.forgotTitle,
    forgot_desc: locale.auth.forgotDesc,
    forgot_btn: locale.auth.forgotBtn,
    forgot_sent_title: locale.auth.forgotSentTitle,
    forgot_sent_desc: locale.auth.forgotSentDesc,
    reset_title: locale.auth.resetTitle,
    reset_new_pass: locale.auth.resetNewPass,
    reset_confirm_pass: locale.auth.resetConfirmPass,
    reset_btn: locale.auth.resetBtn,
    reset_success: locale.auth.resetSuccess,
  }
}

export async function getDictionary(locale: Locale) {
  const l = localeMap[locale] ?? localeMap.ru
  return mapToLegacy(l)
}
