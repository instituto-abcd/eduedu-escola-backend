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

  isPasswordStrong(password: string) {
    let passwordMeetsLength = password.length >= 6;
    let passwordMeetsHasUpperCase = /[A-Z]+/.test(password);
    let passwordMeetsHasLowerCase = /[a-z]+/.test(password);
    let passwordMeetsHasDigit = /[0-9]+/.test(password);
    let passwordMeetsHasSpecialChar = /[^A-Za-z0-9]+/.test(password);

    const isPasswordStrong = passwordMeetsLength &&
                             passwordMeetsHasUpperCase &&
                             passwordMeetsHasLowerCase &&
                             passwordMeetsHasDigit &&
                             passwordMeetsHasSpecialChar;

    return isPasswordStrong;
  }
}
