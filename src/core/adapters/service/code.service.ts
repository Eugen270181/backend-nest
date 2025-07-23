import { randomUUID, UUID } from 'crypto';

export const codeService = {
  genRandomCode(): UUID {
    return randomUUID();
  },
};
