import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { getTamaraApiHost } from "../tamara/tamara-api";
import { type TransactionInitializeSessionResponse } from "@/schemas/TransactionInitializeSession/TransactionInitializeSessionResponse.mjs";
import {
  type TransactionInitializeSessionEventFragment,
  TransactionEventTypeEnum,
} from "generated/graphql";
import { invariant } from "@/lib/invariant";
import { createLogger } from "@/lib/logger";
import { type JSONObject } from "@/types";

type Transaction = {
  id: string;
  pspReference: string;
  authorizedAmount: {
    currency: string;
    amount: number;
  };
  chargedAmount: {
    currency: string;
    amount: number;
  };
};

type TamaraConfig = {
  publishableKey: string;
  webhookSecret: string;
  apiKey: string;
  notificationToken: string;
  configurationName: string;
  configurationId: string;
  webhookId: string;
};

interface TamaraConsumer {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

interface TamaraLineItem {
  unit_price: { amount: number | undefined; currency: string };
  total_amount: { amount: number | undefined; currency: string | undefined };
  tax_amount?: { amount: number; currency: string };
  discount_amount?: { amount: number | undefined; currency: string };
  name: string;
  type: string;
  reference_id: string;
  sku: number;
  quantity: number;
}

interface TamaraAddress {
  city: string;
  country_code: string;
  first_name: string;
  last_name: string;
  line1: string;
  phone_number: string;
  region: string;
}

interface TamaraAmount {
  amount: number;
  currency: string;
}

interface TamaraMerchantURL {
  cancel: string;
  failure: string;
  success: string;
  notification: string;
}

interface TamaraOrder {
  merchant_url: TamaraMerchantURL;
  items: TamaraLineItem[];
  order_reference_id: string;
  consumer: TamaraConsumer;
  country_code: string;
  payment_type: string;
  instalments: number;
  description: string;
  billing_address: TamaraAddress;
  shipping_address: TamaraAddress;
  locale: string;
  discount?: { name: string; amount: TamaraAmount };
  tax_amount?: TamaraAmount;
  shipping_amount?: TamaraAmount;
  total_amount: TamaraAmount;
}

export const TransactionInitializeSessionWebhookHandler = async (
  event: TransactionInitializeSessionEventFragment,
  saleorApiUrl: string,
): Promise<TransactionInitializeSessionResponse> => {
  const logger = createLogger(
    { saleorApiUrl },
    { msgPrefix: "[TransactionInitializeSessionWebhookHandler] " },
  );
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

  if (
    !event.sourceObject.billingAddress ||
    !event.sourceObject.deliveryMethod ||
    !event.sourceObject.shippingAddress
  ) {
    logger.debug(
      {
        sourceObjectId: event.sourceObject.id,
        channel: event.sourceObject.channel,
      },
      "Missing some source data ex: billing address or shipping address or delivery method",
    );
    return validateAndGenerateTransactionResponse(event);
  }

  const { privateMetadata } = app;
  const configurator = getWebhookPaymentAppConfigurator({ privateMetadata }, saleorApiUrl);
  const appConfig = await configurator.getConfig();
  const { data } = event;
  const eventData = data as JSONObject;

  const tamaraConfig: TamaraConfig = paymentAppFullyConfiguredEntrySchema.parse(
    getConfigurationForChannel(appConfig, event.sourceObject.channel.id),
  );
  const transaction = (event?.transaction as Transaction) ?? {};

  if (
    (transaction?.authorizedAmount?.amount &&
      transaction?.authorizedAmount?.amount >= event.action.amount) ||
    (transaction?.chargedAmount?.amount &&
      transaction?.chargedAmount?.amount >= event.action.amount)
  ) {
    const transactionInitializeSessionResponse: TransactionInitializeSessionResponse = {
      data: {
        paymentIntent: { ...transaction, isAlreadyPaid: true },
        publishableKey: tamaraConfig?.publishableKey,
      },
      pspReference: transaction?.id,
      result: TransactionEventTypeEnum.AuthorizationFailure,
      amount: 0,
      time: new Date().toISOString(),
      message: "Already Paid",
      externalUrl: undefined,
    };
    logger.debug(
      {
        ...transactionInitializeSessionResponse,
      },
      "Missing some source data ex: billing address or shipping address or delivery method",
    );

    return transactionInitializeSessionResponse;
  }

  logger.info(eventData, "Processing Transaction Initialize request");

  const apiHost = getTamaraApiHost(tamaraConfig?.apiKey ?? "");

  const tamaraOrder = eventData?.order as unknown as TamaraOrder;

  const response = await fetch(`${apiHost}/checkout`, {
    cache: "no-store",
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${tamaraConfig?.apiKey}`,
    },
    body: JSON.stringify({
      ...tamaraOrder,
      ...{
        merchant_url: {
          ...(tamaraOrder?.merchant_url ?? {}),
          failure:
            tamaraOrder?.merchant_url?.failure +
            "/" +
            event.transaction.id +
            "/" +
            event.sourceObject.id,
          success:
            tamaraOrder?.merchant_url?.failure +
            "/" +
            event.transaction.id +
            "/" +
            event.sourceObject.id,
          notification: "https://example-notification.com/payments/tamaranotifications",
        },
      },
    }),
  });
  const tamaraResponse = (await response.json()) as JSONObject;
  console.log("\n\n apiHost", tamaraResponse);
  console.log("tamaraOrder", tamaraOrder);
  logger.debug(
    {
      tamaraResponse: { ...tamaraResponse },
    },
    "Transaction Initialize tamaraResponse",
  );
  const errors = tamaraResponse?.errors as { error_code: string }[];
  const paymentId = tamaraResponse.id as string;

  logger.debug(
    {
      paymentId,
    },
    "Transaction Initialize response",
  );
  const transactionInitializeSessionResponse: TransactionInitializeSessionResponse = {
    data: {
      paymentIntent: tamaraResponse,
      publishableKey: tamaraConfig?.publishableKey,
    },
    pspReference: (tamaraResponse?.order_id as string) ?? event.transaction.id,
    result:
      !errors?.length && tamaraResponse?.checkout_url
        ? TransactionEventTypeEnum.AuthorizationActionRequired
        : TransactionEventTypeEnum.AuthorizationFailure,
    amount: event.action.amount,
    time: new Date().toISOString(),
    message: (tamaraResponse?.error_type as string) ?? "",
    externalUrl: undefined,
  };

  return transactionInitializeSessionResponse;
};

const validateAndGenerateTransactionResponse = (
  event: TransactionInitializeSessionEventFragment,
): TransactionInitializeSessionResponse => {
  let message = "";
  if (!event.sourceObject.billingAddress) {
    message = "Missing billing address";
  } else if (!event.sourceObject.shippingAddress) {
    message = "Missing shipping address";
  } else if (!event.sourceObject.deliveryMethod) {
    message = "Missing delivery method";
  }
  const transactionInitializeSessionResponse: TransactionInitializeSessionResponse = {
    data: {
      paymentIntent: { error: TransactionEventTypeEnum.AuthorizationFailure },
      publishableKey: "",
    },
    pspReference: event.transaction.id,
    result: TransactionEventTypeEnum.AuthorizationFailure,
    amount: event.action.amount,
    time: new Date().toISOString(),
    message: message,
    externalUrl: undefined,
  };

  return transactionInitializeSessionResponse;
};
