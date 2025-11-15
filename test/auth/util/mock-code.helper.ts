import { UserModelType } from '../../../src/modules/user-accounts/domain/user.entity';

export class MockCodeHelper {
  private confirmCodeSpy: jest.SpyInstance | null = null;

  // Один универсальный метод для всех случаев
  setMockConfirmationCode(
    UserModel: UserModelType,
    code?: string,
    date?: Date,
  ): jest.SpyInstance {
    if (this.confirmCodeSpy) {
      this.confirmCodeSpy.mockRestore();
    }

    this.confirmCodeSpy = jest
      .spyOn(UserModel.prototype, 'setConfirmationCode')
      .mockImplementation(function (c: string, d: Date) {
        return {
          confirmationCode: code ?? c,
          expirationDate: date ?? d,
        };
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
