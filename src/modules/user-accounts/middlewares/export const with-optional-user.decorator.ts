import { SetMetadata } from '@nestjs/common';

export const WITH_OPTIONAL_USER_METADATA = 'withOptionalUser';

export const WithOptionalUser = () =>
  SetMetadata(WITH_OPTIONAL_USER_METADATA, true);
