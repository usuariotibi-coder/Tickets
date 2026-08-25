import nodemailer from "nodemailer";

type TicketInfo = {
  number: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  requesterName: string;
  requesterEmail: string;
};

type ConversationLine = { role: "user" | "assistant"; content: string };

const isConfigured = (v?: string) => v && v.length > 0;

type EmailPayload = { subject: string; text: string };

async function sendViaResend(to: string, payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!isConfigured(apiKey) || !isConfigured(from)) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject: payload.subject, text: payload.text }),
    });
    if (!res.ok) {
      console.error("Resend error:", res.status, await res.text());
    }
    return res.ok;
  } catch (e) {
    console.error("Resend notification failed:", e);
    return false;
  }
}

async function sendViaSMTP(to: string, payload: EmailPayload): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  if (!isConfigured(smtpHost) || !isConfigured(process.env.SMTP_FROM)) return false;
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: payload.subject,
      text: payload.text,
    });
    return true;
  } catch (e) {
    console.error("Email notification failed:", e);
    return false;
  }
}

async function sendEmail(to: string, payload: EmailPayload): Promise<boolean> {
  if (!to) return false;
  return (await sendViaResend(to, payload)) || (await sendViaSMTP(to, payload));
}

function buildTicketEmail(ticket: TicketInfo): EmailPayload {
  return {
    subject: `[TI] Nueva solicitud #${ticket.number}: ${ticket.title}`,
    text: [
      `Nueva solicitud #${ticket.number}`,
      `Solicitante: ${ticket.requesterName} <${ticket.requesterEmail}>`,
      `Categoría: ${ticket.category}`,
      `Prioridad: ${ticket.priority}`,
      "",
      ticket.title,
      ticket.description,
    ].join("\n"),
  };
}

const escapeTelegramMarkdown = (text: string): string =>
  text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");

export async function notifyTicketCreated(ticket: TicketInfo) {
  const results = { telegram: false, email: false };

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  if (isConfigured(telegramToken) && isConfigured(telegramChatId)) {
    try {
      const md = escapeTelegramMarkdown;
      const text = [
        `📋 *Nueva solicitud #${md(String(ticket.number))}*`,
        `👤 ${md(ticket.requesterName)} (${md(ticket.requesterEmail)})`,
        `📁 Categoría: ${md(ticket.category)}`,
        `⚡ Prioridad: ${md(ticket.priority)}`,
        ``,
        `*${md(ticket.title)}*`,
        md(ticket.description),
      ].join("\n");

      const res = await fetch(
        `https://api.telegram.org/bot${telegramToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text,
            parse_mode: "MarkdownV2",
          }),
        }
      );
      results.telegram = res.ok;
    } catch (e) {
      console.error("Telegram notification failed:", e);
    }
  }

  const staffEmail = process.env.NOTIFY_EMAIL_TO;
  if (staffEmail) {
    results.email = await sendEmail(staffEmail, buildTicketEmail(ticket));
  }

  return results;
}

export async function notifySuspiciousActivity(info: {
  userName: string;
  userEmail: string;
  message: string;
  offenseCount: number;
}) {
  return sendEmail(process.env.NOTIFY_EMAIL_TO || "", {
    subject: `[TI] ⚠️ Interacción sospechosa de ${info.userName}`,
    text: [
      `El usuario ${info.userName} (${info.userEmail}) está teniendo una interacción sospechosa y fuera de temas profesionales.`,
      ``,
      `Último mensaje: "${info.message}"`,
      `Faltas fuera de tema acumuladas: ${info.offenseCount}/3`,
      `Si llega a 3, el sistema bloqueará temporalmente al usuario.`,
    ].join("\n"),
  });
}

export async function notifyUserBlocked(info: {
  userName: string;
  userEmail: string;
  reason: string;
  conversation: ConversationLine[];
}) {
  const lines = [
    `El sistema bloqueó temporalmente al usuario ${info.userName} (${info.userEmail}).`,
    `Motivo: ${info.reason}`,
    ``,
    `Copia de la conversación:`,
    ``,
  ];
  for (const m of info.conversation) {
    lines.push(`${m.role === "user" ? "👤 Usuario" : "🤖 Asistente"}: ${m.content}`);
  }
  lines.push("", "Para desbloquearlo, ve a /admin/blocks en el panel de administración.");

  return sendEmail(process.env.NOTIFY_EMAIL_TO || "", {
    subject: `[TI] 🚫 Usuario bloqueado: ${info.userName}`,
    text: lines.join("\n"),
  });
}
