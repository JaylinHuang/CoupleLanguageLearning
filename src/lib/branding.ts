/** 站点品牌（与具体人名无关；可用环境变量覆盖） */

export function siteName() {
  return process.env.NEXT_PUBLIC_SITE_NAME ?? "CoupleLanguageLearning";
}

export function siteTagline() {
  return (
    process.env.NEXT_PUBLIC_SITE_TAGLINE ??
    "Private couple language tutoring"
  );
}

export function mailFromName() {
  return process.env.MAIL_FROM_NAME ?? siteName();
}

export function mailSubjectPrefix() {
  return `[${siteName()}]`;
}
