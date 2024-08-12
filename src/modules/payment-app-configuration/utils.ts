import { obfuscateConfig } from "../app-configuration/utils";
import {
  type PaymentAppConfigEntry,
  type PaymentAppEncryptedConfig,
  type PaymentAppUserVisibleConfigEntry,
  paymentAppUserVisibleConfigEntrySchema,
} from "./config-entry";

export const obfuscateConfigEntry = (
  entry: PaymentAppConfigEntry | PaymentAppUserVisibleConfigEntry,
): PaymentAppUserVisibleConfigEntry => {
  const {
    publishableKey,
    configurationName,
    configurationId,
    webhookId,
    notificationToken,
    apiKey,
  } = entry;

  const configValuesToObfuscate = {
    apiKey,
  } satisfies PaymentAppEncryptedConfig;

  return paymentAppUserVisibleConfigEntrySchema.parse({
    publishableKey,
    configurationId,
    configurationName,
    webhookId,
    notificationToken,
    ...obfuscateConfig(configValuesToObfuscate),
  } satisfies PaymentAppUserVisibleConfigEntry);
};
