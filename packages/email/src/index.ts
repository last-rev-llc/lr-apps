export { sendEmail } from "./send-email";
export type {
  EmailTemplate,
  SendEmailParams,
  SendEmailResult,
} from "./types";
export {
  welcomeEmail,
  subscriptionConfirmationEmail,
  subscriptionCancellationEmail,
  clientHealthAlertEmail,
  type WelcomeEmailData,
  type SubscriptionConfirmationData,
  type SubscriptionCancellationData,
  type ClientHealthAlertEmailData,
  type ClientHealthAlertSeverity,
  type ClientHealthAlertType,
  type ClientHealthAlertOffender,
} from "./templates";
