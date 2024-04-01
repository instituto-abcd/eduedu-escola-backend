import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { passwordTemplate } from 'src/templates/password-reset-template';
import { emailConfirmTemplate } from 'src/templates/email-confirm-template';
import { BcryptService } from 'src/common/services/bcrypt.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {}

  private async getClient() {
    const credentials = await this.prismaService.settings.findFirst();

    const transport = nodemailer.createTransport({
      host: credentials.smtpHostName,
      port: credentials.smtpPort,
      secure: credentials.sslIsActive,
      auth: {
        user: credentials.smtpUserName,
        pass: this.bcryptService.decrypt(credentials.smtpPassword),
      },
      tls: {
        ciphers: 'SSLv3',
      },
    });

    transport.on('error', (error) => {
      throw new HttpException(`Erro SMTP: ${error}`, 500);
    });

    return transport;
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

    client
      .sendMail({
        from: 'EduEdu Escola <edueduescola@institutoabcd.org>',
        to: email,
        subject: 'Redefinição de senha',
        html: passwordTemplate(url, name),
        attachments: [
          {
            filename: 'eduedu-preta.png',
            path: `${__dirname}/../../templates/eduedu-preta.png`,
            cid: 'logoeduedu',
          },
        ],
      })
      .catch((error) => {
        console.error('Erro ao enviar email:', error);
      });
  }

  async confirmEmail({ url, email }: { url: string; email: string }) {
    try {
      // Buscando as configurações de email no banco de dados
      const settings = await this.prismaService.settings.findFirst();

      // Criando o cliente de email
      const client = await this.getClient();

      // Enviando o email
      await client.sendMail({
        from: `EduEdu Escola ${
          settings?.smtpUserName || 'edueduescola@institutoabcd.org'
        }`,
        to: email,
        subject: 'Confirmação de email',
        html: emailConfirmTemplate(url, email),
        attachments: [
          {
            filename: 'eduedu-preta.png',
            path: `${__dirname}/../../templates/eduedu-preta.png`,
            cid: 'logoeduedu',
          },
        ],
      });

      console.log('Email enviado com sucesso.');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }
}
