import { z } from "zod";
import { deobfuscateValues } from "../app-configuration/utils";

export const DANGEROUS_paymentAppConfigHiddenSchema = z.object({
  webhookSecret: z.string().min(1),
});

export const paymentAppConfigEntryInternalSchema = z.object({
  configurationId: z.string().min(1),
  webhookId: z.string().min(1),
});

export const paymentAppConfigEntryEncryptedSchema = z.object({
  apiKey: z
    .string({ required_error: "Api key is required" })
    .min(1, { message: "Api key required" }),
});

export const paymentAppConfigEntryPublicSchema = z.object({
  publishableKey: z
    .string({ required_error: "Publishable Key is required" })
    .min(1, { message: "Publishable Key is required" }),
  notificationToken: z
    .string({ required_error: "Notification token is required" })
    .min(1, { message: "Notification token is required" }),
  configurationName: z
    .string({ required_error: "Configuration name is required" })
    .min(1, { message: "Configuration name is required" }),
});

export const paymentAppConfigEntrySchema = DANGEROUS_paymentAppConfigHiddenSchema.merge(
  paymentAppConfigEntryEncryptedSchema,
)
  .merge(paymentAppConfigEntryPublicSchema)
  .merge(paymentAppConfigEntryInternalSchema);

// Entire config available to user
export const paymentAppUserVisibleConfigEntrySchema = paymentAppConfigEntryPublicSchema
  .merge(paymentAppConfigEntryEncryptedSchema)
  .merge(paymentAppConfigEntryInternalSchema)
  .strict();

// Fully configured app - all fields are required
// Zod doesn't have a utility for marking fields as non-nullable, we need to use unwrap
export const paymentAppFullyConfiguredEntrySchema = z
  .object({
    configurationName: paymentAppConfigEntryPublicSchema.shape.configurationName,
    configurationId: paymentAppConfigEntryInternalSchema.shape.configurationId,
    publishableKey: paymentAppConfigEntryPublicSchema.shape.publishableKey,
    apiKey: paymentAppConfigEntryEncryptedSchema.shape.apiKey,
    notificationToken: paymentAppConfigEntryPublicSchema.shape.notificationToken,
    webhookSecret: DANGEROUS_paymentAppConfigHiddenSchema.shape.webhookSecret,
    webhookId: paymentAppConfigEntryInternalSchema.shape.webhookId,
  })
  .required();

// Schema used as input validation for saving config entires
export const paymentAppFormConfigEntrySchema = z
  .object({
    configurationName: paymentAppConfigEntryPublicSchema.shape.configurationName,
    publishableKey: paymentAppConfigEntryPublicSchema.shape.publishableKey,
    notificationToken: paymentAppConfigEntryPublicSchema.shape.notificationToken,
    apiKey: paymentAppConfigEntryEncryptedSchema.shape.apiKey,
  })
  .strict()
  .default({
    publishableKey: "",
    notificationToken: "",
    apiKey: "",
    configurationName: "",
  });

/** Schema used in front-end forms
 * Replaces obfuscated values with null */
export const paymentAppEncryptedFormSchema = paymentAppConfigEntryEncryptedSchema.transform(
  (values) => deobfuscateValues(values),
);

// Schema used for front-end forms
export const paymentAppCombinedFormSchema = z.intersection(
  paymentAppEncryptedFormSchema,
  paymentAppConfigEntryPublicSchema,
);

export type PaymentAppInternalConfig = z.infer<typeof paymentAppConfigEntryInternalSchema>;
export type PaymentAppEncryptedConfig = z.infer<typeof paymentAppConfigEntryEncryptedSchema>;
export type PaymentAppPublicConfig = z.infer<typeof paymentAppConfigEntryPublicSchema>;

export type PaymentAppConfigEntry = z.infer<typeof paymentAppConfigEntrySchema>;
export type PaymentAppConfigEntryFullyConfigured = z.infer<
  typeof paymentAppFullyConfiguredEntrySchema
>;
export type PaymentAppUserVisibleConfigEntry = z.infer<
  typeof paymentAppUserVisibleConfigEntrySchema
>;
export type PaymentAppFormConfigEntry = z.infer<typeof paymentAppFormConfigEntrySchema>;
export type PaymentAppConfigEntryUpdate = Partial<PaymentAppConfigEntry> & {
  configurationId: PaymentAppConfigEntry["configurationId"];
};
