import { UserHelperService } from '../../../src/core/adapters/user-helper.service';
import { UserConfirmCodeDto } from '../../../src/core/dto/type/user-confirm-code.dto';

export class MockCodeHelper {
  private confirmCodeSpy: jest.SpyInstance | null = null;

  // Один универсальный метод для всех случаев
  setMockConfirmationCode(
    userHelperService: UserHelperService,
    code?: string,
    date?: Date,
  ): jest.SpyInstance {
    if (this.confirmCodeSpy) {
      this.confirmCodeSpy.mockRestore();
    }

    // Сохраняем оригинальную реализацию ДО spyOn
    const originalCreateUserConfirmCodeDto =
      userHelperService.createUserConfirmCodeDto.bind(userHelperService) as (
        durationStr: string,
      ) => UserConfirmCodeDto;

    this.confirmCodeSpy = jest
      .spyOn(UserHelperService.prototype, 'createUserConfirmCodeDto')
      .mockImplementation(function (
        this: UserHelperService,
        durationStr: string,
      ): UserConfirmCodeDto {
        // Вызываем оригинальный метод
        const originalResult: UserConfirmCodeDto =
          originalCreateUserConfirmCodeDto(durationStr);
        return {
          confirmationCode: code ?? originalResult.confirmationCode,
          expirationDate: date ?? originalResult.expirationDate,
        } as UserConfirmCodeDto;
      });

    return this.confirmCodeSpy;
  }

  // Восстанавливаем спай
  restore(): void {
    if (this.confirmCodeSpy) {
      this.confirmCodeSpy.mockRestore();
      this.confirmCodeSpy = null;
    }
  }
}
