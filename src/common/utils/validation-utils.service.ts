import { Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';

@Injectable()
export class ValidationUtilsService {
  isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  isValidDocument(document: string): boolean {
    if (document === '00000000000') {
      return false;
    }

    const cleanDocument = document.replace(/\D/g, '');

    if (!this.isValidLength(cleanDocument)) {
      return false;
    }

    if (this.isAllDigitsEqual(cleanDocument)) {
      return false;
    }

    const digits = cleanDocument.split('').map(Number);
    const firstVerifierDigit = this.calculateVerifierDigit(digits.slice(0, 9));
    const secondVerifierDigit = this.calculateVerifierDigit(
      digits.slice(0, 10),
    );

    return !(
      firstVerifierDigit !== digits[9] || secondVerifierDigit !== digits[10]
    );
  }

  private isValidLength(document: string): boolean {
    return document.length === 11;
  }

  private isAllDigitsEqual(document: string): boolean {
    return document.split('').every((digit) => digit === document[0]);
  }

  private calculateVerifierDigit(digits: number[]): number {
    const sum = digits.reduce((accumulator, digit, index) => {
      return accumulator + digit * (digits.length + 1 - index);
    }, 0);

    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }

    return remainder;
  }

  isValidProfile(profile: string): boolean {
    const validProfiles = Object.values(Profile);
    return validProfiles.includes(profile as Profile);
  }

  isPasswordStrong(password: string): [boolean, string] {
    const passwordMeetsLength = password.length >= 6;
    const passwordMeetsHasLetter = /[A-Za-z]/.test(password);
    const passwordMeetsHasDigit = /[0-9]/.test(password);
    const passwordMeetsNoSequentialLetters =
      !this.hasSequentialLetters(password);
    const passwordMeetsNoSequentialDigits = !this.hasSequentialDigits(password);

    const isPasswordStrong =
      passwordMeetsLength &&
      passwordMeetsHasLetter &&
      passwordMeetsHasDigit &&
      passwordMeetsNoSequentialLetters &&
      passwordMeetsNoSequentialDigits;

    let message = '';

    if (!isPasswordStrong) {
      message += 'A senha deve atender os seguintes requisitos:<br>';
      message += !passwordMeetsLength ? '- Ter pelo menos 6 dígitos<br>' : '';
      message += !passwordMeetsHasLetter ? '- Ter pelo menos 1 letra<br>' : '';
      message += !passwordMeetsHasDigit ? '- Ter pelo menos 1 número<br>' : '';
      message += !passwordMeetsNoSequentialLetters
        ? '- Não conter sequências de letras consecutivas<br>'
        : '';
      message += !passwordMeetsNoSequentialDigits
        ? '- Não conter sequências de números consecutivos<br>'
        : '';
      message += '<br>';
    }

    return [isPasswordStrong, message];
  }

  hasSequentialLetters(password: string): boolean {
    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i);
      const char2 = password.charCodeAt(i + 1);
      const char3 = password.charCodeAt(i + 2);

      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true; // Sequência de letras consecutivas encontrada
      }
    }

    return false; // Nenhuma sequência encontrada
  }

  hasSequentialDigits(password: string): boolean {
    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i);
      const char2 = password.charCodeAt(i + 1);
      const char3 = password.charCodeAt(i + 2);

      if (
        char1 >= 48 &&
        char1 <= 57 &&
        char2 === char1 + 1 &&
        char3 === char2 + 1
      ) {
        return true; // Sequência de números consecutivos encontrada
      }
    }

    return false; // Nenhuma sequência encontrada
  }
}
