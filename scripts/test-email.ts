import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

import { sendNotificationEmail } from "../src/lib/email";

async function main() {
  const sent = await sendNotificationEmail({
    subject: "[Jaylin_love_Erika] Test notification",
    text: "This is a test email from Erika's Chinese Learning site.\n\nIf you received this, SMTP is working!",
    html: "<p>This is a <strong>test email</strong> from <em>Jaylin_love_Erika</em>.</p><p>If you received this, SMTP is working!</p>",
  });

  if (sent) {
    console.log("Email sent successfully to", process.env.NOTIFY_EMAIL);
  } else {
    console.error("Email was not sent — check SMTP settings in .env");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Email test failed:", err);
  process.exit(1);
});
