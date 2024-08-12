export const getEnvironmentFromKey = (secretKeyOrPublishableKey: string) => {
  return secretKeyOrPublishableKey.startsWith("sk_live_") ||
    secretKeyOrPublishableKey.startsWith("pk_live_") ||
    secretKeyOrPublishableKey.startsWith("rk_live_")
    ? "live"
    : "test";
};

export const getTamaraApiHost = (key: string) => {
  const environment = getEnvironmentFromKey(key);
  if (environment === "test") {
    return "https://api-sandbox.tamara.co";
  } else {
    return "https://api.tamara.co";
  }
};
