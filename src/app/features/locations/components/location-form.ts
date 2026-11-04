export const LOCATION_FORM_FIELDS = [
  { key: 'name',        label: 'COMMON.FORM.NAME',        placeholder: 'COMMON.FORM.NAME_PLACEHOLDER',        required: true },
  { key: 'description', label: 'COMMON.FORM.DESCRIPTION', placeholder: 'COMMON.FORM.DESCRIPTION_PLACEHOLDER', type: 'textarea' as const, rows: 4 },
];

export const LOCATION_ADD_DIALOG = {
  title: 'LOCATIONS.ADD.TITLE',
  subtitle: 'LOCATIONS.ADD.SUBTITLE',
  submitLabel: 'COMMON.ACTIONS.CREATE',
  fields: LOCATION_FORM_FIELDS,
} as const;

export const LOCATION_EDIT_DIALOG = {
  title: 'LOCATIONS.EDIT.TITLE',
  subtitle: 'LOCATIONS.EDIT.SUBTITLE',
  submitLabel: 'COMMON.ACTIONS.SAVE',
  fields: LOCATION_FORM_FIELDS,
} as const;
