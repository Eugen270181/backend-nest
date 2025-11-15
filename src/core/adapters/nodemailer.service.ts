import nodemailer from 'nodemailer';
import { appConfig } from '../settings/config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export class NodemailerService {
  async sendEmail(email: string, content: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: appConfig.EMAIL,
        pass: appConfig.EMAIL_PASS,
      },
    });

    const info: SMTPTransport.SentMessageInfo = await transporter.sendMail({
      from: '"Kek 👻" <codeSender>',
      to: email,
      subject: 'Your code is here',
      html: content, // html body
    });

    return !!info;
  }
}
