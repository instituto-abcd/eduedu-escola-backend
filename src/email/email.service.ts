import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { passwordTemplate } from 'src/templates/password-reset-template';
import { emailConfirmTemplate } from 'src/templates/email-confirm-template';
import { BcryptService } from 'src/common/services/bcrypt.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bcryptService: BcryptService) {}

  private async getClient() {
    const credentials = await this.prismaService.settings.findFirst();

    try {
      const transport = nodemailer.createTransport({
        host: credentials.smtpHostName,
        port: 465,
        secure: credentials.sslIsActive,
        auth: {
          user: credentials.smtpUserName,
          pass: this.bcryptService.decrypt(credentials.smtpPassword),
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
