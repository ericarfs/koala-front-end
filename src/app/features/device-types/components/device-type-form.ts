import { FormDialogData } from '@shared/components/dialogs/entity-form-dialog/entity-form-dialog.types';
import { DeviceType } from '@shared/interfaces/device-type';

export const DEVICE_TYPE_ADD_DIALOG = {
  title: 'SENSORS.ADD.TITLE',
  subtitle: 'SENSORS.ADD.SUBTITLE',
  submitLabel: 'COMMON.ACTIONS.CREATE',
  fields: [
    { key: 'name',        label: 'COMMON.FORM.NAME',        placeholder: 'COMMON.FORM.NAME_PLACEHOLDER',        required: true },
    { key: 'icon',        label: 'COMMON.FORM.ICON',        placeholder: 'COMMON.FORM.ICON_PLACEHOLDER',        required: true },
    { key: 'description', label: 'COMMON.FORM.DESCRIPTION', placeholder: 'COMMON.FORM.DESCRIPTION_PLACEHOLDER', type: 'textarea', rows: 4 },
  ],
} satisfies Omit<FormDialogData<DeviceType>, 'onSubmit'>;

export const DEVICE_TYPE_EDIT_DIALOG = {
  ...DEVICE_TYPE_ADD_DIALOG,
  title: 'SENSORS.EDIT.TITLE',
  subtitle: 'SENSORS.EDIT.SUBTITLE',
  submitLabel: 'COMMON.ACTIONS.SAVE',
} satisfies Omit<FormDialogData<DeviceType>, 'onSubmit'>;
