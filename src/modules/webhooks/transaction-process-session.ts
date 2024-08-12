import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import { getTamaraApiHost } from "../tamara/tamara-api";
import {
  TransactionEventTypeEnum,
  type TransactionProcessSessionEventFragment,
} from "generated/graphql";
import { type TransactionProcessSessionResponse } from "@/schemas/TransactionProcessSession/TransactionProcessSessionResponse.mjs";
import { createLogger } from "@/lib/logger";
import { invariant } from "@/lib/invariant";
import { type JSONObject } from "@/types";

export const TransactionProcessSessionWebhookHandler = async (
  event: TransactionProcessSessionEventFragment,
  saleorApiUrl: string,
): Promise<TransactionProcessSessionResponse> => {
  const logger = createLogger({}, { msgPrefix: "[TransactionProcessSessionWebhookHandler] " });
  logger.debug(
    {
      transaction: event.transaction,
      action: event.action,
      sourceObject: {
        id: event.sourceObject.id,
        channel: event.sourceObject.channel,
        __typename: event.sourceObject.__typename,
      },
      merchantReference: event.merchantReference,
    },
    "Received event",
  );

  const app = event.recipient;
  invariant(app, "Missing event.recipient!");

  const { privateMetadata } = app;
  const configurator = getWebhookPaymentAppConfigurator({ privateMetadata }, saleorApiUrl);
  const appConfig = await configurator.getConfig();

  const tamaraConfig = paymentAppFullyConfiguredEntrySchema.parse(
    getConfigurationForChannel(appConfig, event.sourceObject.channel.id),
  );

  logger.info({}, "Processing Transaction request");

  const { data } = event;

  const eventData = data as JSONObject;
  const orderId = eventData?.orderId as string;
  const apiHost = getTamaraApiHost(tamaraConfig?.apiKey ?? "");

  logger.info({ apiHost }, "API HOST");

  const response = await fetch(`${apiHost}/orders/${orderId}/authorise`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tamaraConfig.apiKey}`,
    },
  });
  const tamaraResponse = (await response.json()) as JSONObject;

  const status = tamaraResponse?.status as string;

  const getTransactionResult = () => {
    if (status === "authorised") {
      return TransactionEventTypeEnum.AuthorizationSuccess;
    } else if (status == "captured") {
      return TransactionEventTypeEnum.ChargeSuccess;
    } else {
      return TransactionEventTypeEnum.AuthorizationFailure;
    }
  };

  const paymentIntent = {
    paymentType: "tamara",
    gateway: "TAMARA",
    psp_reference: tamaraResponse?.order_id,
    source_data: {
      ...(tamaraResponse ?? {}),
    },
  };
  const transactionProcessSessionResponse: TransactionProcessSessionResponse = {
    data: { paymentIntent, publishableKey: tamaraConfig.publishableKey },
    pspReference: orderId,
    result: getTransactionResult(),
    amount: event.sourceObject.total.gross.amount,
    message: "",
    externalUrl: undefined,
  };
  return transactionProcessSessionResponse;
};
