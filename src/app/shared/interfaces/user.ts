export interface User {
  id: number;
  username: string;
  email: string;
  newPassword?: string;
  oldPassword?: string;
  newPasswordConfirmation?: string;
}

export interface UserBasic {
  id: number;
  username: string;
  email: string;
}
