import nodemailer from "nodemailer";

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
    from: `"Jaylin_love_Erika" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: options.subject,
    text: options.text,
    html: options.html ?? `<p>${options.text.replace(/\n/g, "<br/>")}</p>`,
  });

  return true;
}

export async function notifyLin(
  type: string,
  message: string,
): Promise<void> {
  const subjectMap: Record<string, string> = {
    study_complete: "Erika completed today's study",
    homework_submitted: "Erika submitted homework",
    wish_added: "Erika has a new learning wish",
    streak_risk: "Erika might miss her streak today",
  };

  await sendNotificationEmail({
    subject: `[Jaylin_love_Erika] ${subjectMap[type] ?? "Update"}`,
    text: message,
  });
}
