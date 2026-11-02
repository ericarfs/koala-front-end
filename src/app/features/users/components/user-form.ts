import { FormDialogData } from '@shared/components/dialogs/entity-form-dialog/entity-form-dialog.types';
import { UserBasic } from '@shared/interfaces/user';

export const USER_ADD_DIALOG = {
  title: 'USERS.ADD.TITLE',
  subtitle: 'USERS.ADD.SUBTITLE',
  submitLabel: 'COMMON.ACTIONS.CREATE',
  fields: [
    { key: 'username', label: 'COMMON.FORM.USERNAME', placeholder: 'COMMON.FORM.USERNAME', required: true },
    { key: 'email',    label: 'COMMON.FORM.EMAIL',    placeholder: 'user@email.com',       type: 'email', required: true },
  ],
} satisfies Omit<FormDialogData<UserBasic>, 'onSubmit'>;

export const USER_EDIT_DIALOG = {
  ...USER_ADD_DIALOG,
  title: 'USERS.EDIT.TITLE',
  subtitle: 'USERS.EDIT.SUBTITLE',
  submitLabel: 'COMMON.ACTIONS.SAVE',
} satisfies Omit<FormDialogData<UserBasic>, 'onSubmit'>;
