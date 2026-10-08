import { Observable } from "rxjs";

export interface FormField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'password' | 'number' | 'email' | 'textarea';
  rows?: number;
}

export interface FormDialogData<T = unknown> {
  title: string;
  subtitle?: string;
  fields: FormField[];
  initialValues?: Record<string, unknown>;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (values: Record<string, unknown>) => Observable<T>;
}
