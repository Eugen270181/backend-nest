export const emailExamples = {
  registrationEmail(code: string) {
    return ` <h1>Thank for your registration</h1>
               <p>To finish registration please follow the link below:<br>
                  <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>
              </p>`;
  },
  resendingCodeRegistrationEmail(code: string) {
    return `<h1>Resending Registration Code</h1>
            <p>You requested to resend the code to complete your registration. Please follow the link below:<br>
               <a href='https://somesite.com/confirm-email?code=${code}'>Complete Registration</a>
            </p>`;
  },
  passwordRecoveryEmail(code: string) {
    return `<h1>Password recovery</h1>
        <p>To finish password recovery please follow the link below:
            <a href='https://somesite.com/password-recovery?recoveryCode=${code}'>recovery password</a>
        </p>`;
  },
};
