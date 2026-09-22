import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transport = null;
if (env.smtp.host && env.smtp.user) {
  transport = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
}

export const email = {
  async send({ to, subject, text, html }) {
    const from = env.mailFrom;
    if (!transport) {
      console.log(`[email:console] To=${to} subject="${subject}"\n${text || ''}`);
      return { messageId: `console-${Date.now()}`, delivered: false };
    }
    const info = await transport.sendMail({ from, to, subject, text, html });
    return { messageId: info.messageId, delivered: true };
  },

  sendOtp(to, otp, purpose = 'verification') {
    return email.send({
      to,
      subject: `Your QuickMart ${purpose} code is ${otp}`,
      text: `Your QuickMart ${purpose} code is ${otp}. It is valid for 10 minutes.`,
    });
  },

  sendOrderConfirmation(to, order) {
    return email.send({
      to,
      subject: `Order ${order.orderId} confirmed — QuickMart`,
      text: `Your order ${order.orderId} totaling ₹${order.total} is being prepared. Track it live in the app.`,
    });
  },
};

export default email;