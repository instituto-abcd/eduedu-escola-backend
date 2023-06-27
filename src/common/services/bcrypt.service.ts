import { Injectable } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class BcryptService {
  private saltRounds = 10;
  private readonly secretKey = 'Ns!+5Pn}wUGfS85F#:?c';

  // Criptografar senha (não pode ser descriptografada)
  async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(this.saltRounds);
    return hash(password, salt);
  }

  // Verificar senha se são iguais
  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  // Criptografar texto
  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.secretKey).toString();
  }

  // Descriptografar texto
  decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
