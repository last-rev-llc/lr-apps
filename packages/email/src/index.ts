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
  type WelcomeEmailData,
  type SubscriptionConfirmationData,
  type SubscriptionCancellationData,
} from "./templates";
