import { SaleorApp } from "@saleor/app-sdk/saleor-app";
import { FileAPL, UpstashAPL, SaleorCloudAPL, EnvAPL } from "@saleor/app-sdk/APL";
import { invariant } from "./lib/invariant";
import { env } from "./lib/env.mjs";

/**
 * By default auth data are stored in the `.auth-data.json` (FileAPL).
 * For multi-tenant applications and deployments please use UpstashAPL.
 *
 * To read more about storing auth data, read the
 * [APL documentation](https://github.com/saleor/saleor-app-sdk/blob/main/docs/apl.md)
 */
const getApl = async () => {
  /* c8 ignore start */
  switch (env.APL) {
    case "upstash":
      invariant(env.UPSTASH_URL, "Missing UPSTASH_URL env variable!");
      invariant(env.UPSTASH_TOKEN, "Missing UPSTASH_TOKEN env variable!");
      return new UpstashAPL({
        restURL: env.UPSTASH_URL,
        restToken: env.UPSTASH_TOKEN,
      });
    case "saleor-cloud": {
      invariant(env.REST_APL_ENDPOINT, "Missing REST_APL_ENDPOINT env variable!");
      invariant(env.REST_APL_TOKEN, "Missing REST_APL_TOKEN env variable!");
      return new SaleorCloudAPL({
        resourceUrl: env.REST_APL_ENDPOINT,
        token: env.REST_APL_TOKEN,
      });
    }
    case "env-apl": {
      return new EnvAPL({
        env: {
          /**
           * Map your env variables here. You don't have these values yet
           */
          token: env.SALEOR_APP_TOKEN ?? "",
          appId: env.SALEOR_APP_ID ?? "",
          saleorApiUrl: env.SALEOR_API_URL ?? "",
        },
        /**
         * Set it to "true" - check your app logs during app registration. APL will print the values you need
         */
        printAuthDataOnRegister: true,
      });
    }
    default:
      return new FileAPL();
  }
  /* c8 ignore stop */
};

const apl = await getApl();

export const saleorApp = new SaleorApp({
  apl,
});
