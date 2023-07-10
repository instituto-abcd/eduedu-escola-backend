import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { passwordTemplate } from 'src/templates/password-reset-template';
import { emailConfirmTemplate } from 'src/templates/email-confirm-template';

@Injectable()
export class EmailService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getClient() {
    const credentials = await this.prismaService.settings.findFirst();

    try {
      const transport = nodemailer.createTransport({
        host: credentials.smtpHostName,
        port: 465,
        secure:
          process.env.NODE_ENV === 'production'
            ? credentials.sslIsActive
            : false,
        auth: {
          user: credentials.smtpUserName,
          pass: credentials.smtpPassword,
        },
      });

      return transport;
    } catch (error) {
      console.error(error);
    }
  }

  async resetPassword({
    url,
    name,
    email,
  }: {
    url: string;
    name: string;
    email: string;
  }) {
    const client = await this.getClient();

    client.sendMail({
      from: 'EduEdu Escola <edueduescola@institutoabcd.org>',
      to: email,
      subject: 'Redefinição de senha',
      html: passwordTemplate(url, name),
    });
  }

  async confirmEmail({ url, email }: { url: string; email: string }) {
    const client = await this.getClient();

    client.sendMail({
      from: 'EduEdu Escola <edueduescola@institutoabcd.org>',
      to: email,
      subject: 'Confirmação de email',
      html: emailConfirmTemplate(url, email),
    });
  }
}
