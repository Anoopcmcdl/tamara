import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { type AppManifest } from "@saleor/app-sdk/types";

import packageJson from "../../../package.json";
import { paymentGatewayInitializeSessionSyncWebhook } from "./webhooks/saleor/payment-gateway-initialize-session";
import { transactionInitializeSessionSyncWebhook } from "./webhooks/saleor/transaction-initialize-session";
import { transactionProcessSessionSyncWebhook } from "./webhooks/saleor/transaction-process-session";

export default createManifestHandler({
  async manifestFactory(context) {
    const manifest: AppManifest = {
      id: "app.saleor.tamara",
      name: "Tamara",
      about: packageJson.description,
      tokenTargetUrl: `${context.appBaseUrl}/api/register`,
      appUrl: `${context.appBaseUrl}`,
      permissions: ["HANDLE_PAYMENTS"],
      version: packageJson.version,
      requiredSaleorVersion: ">=3.14.0",
      homepageUrl: "https://www.valoriz.com",
      supportUrl: "https://www.valoriz.com/contact-us",
      brand: {
        logo: {
          default: `${context.appBaseUrl}/logo.png`,
        },
      },
      webhooks: [
        paymentGatewayInitializeSessionSyncWebhook.getWebhookManifest(context.appBaseUrl),
        transactionInitializeSessionSyncWebhook.getWebhookManifest(context.appBaseUrl),
        transactionProcessSessionSyncWebhook.getWebhookManifest(context.appBaseUrl),
      ],
      extensions: [],
    };

    return manifest;
  },
});
