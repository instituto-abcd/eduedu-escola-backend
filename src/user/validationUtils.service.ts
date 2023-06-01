import { Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';

@Injectable()
export class ValidationUtilsService {
  isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  isValidDocument(document) {
    const documentPattern = /^\d{11}$/;
    return documentPattern.test(document);
  }
  isValidProfile(profile: string): boolean {
    const validProfiles = Object.values(Profile);
    return validProfiles.includes(profile as Profile);
  }
}
