export interface EmailTemplate<T> {
  subject: (data: T) => string;
  html: (data: T) => string;
  text?: (data: T) => string;
}

export interface SendEmailParams<T> {
  to: string | string[];
  from?: string;
  replyTo?: string;
  template: EmailTemplate<T>;
  data: T;
}

export interface SendEmailResult {
  id: string;
}
