import nodemailer from "nodemailer";
import { mailFromName, mailSubjectPrefix } from "@/lib/branding";

type SendMailOptions = {
  subject: string;
  text: string;
  html?: string;
};

function canSendEmail(): boolean {
  return Boolean(
    process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.NOTIFY_EMAIL,
  );
}

export async function sendNotificationEmail(
  options: SendMailOptions,
): Promise<boolean> {
  if (!canSendEmail()) {
    console.warn("[email] SMTP not configured, skipping:", options.subject);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.qq.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"${mailFromName()}" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: options.subject,
    text: options.text,
    html: options.html ?? `<p>${options.text.replace(/\n/g, "<br/>")}</p>`,
  });

  return true;
}

export async function notifyTutor(
  type: string,
  message: string,
): Promise<void> {
  const subjectMap: Record<string, string> = {
    study_complete: "Learner completed today's study",
    homework_submitted: "Learner submitted homework",
    wish_added: "Learner has a new learning wish",
    streak_risk: "Learner might miss their streak today",
  };

  await sendNotificationEmail({
    subject: `${mailSubjectPrefix()} ${subjectMap[type] ?? "Update"}`,
    text: message,
  });
}

/** @deprecated 使用 notifyTutor */
export const notifyLin = notifyTutor;
