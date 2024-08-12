import { Box } from "@saleor/macaw-ui/next";
import { ChipSuccess, ChipCkoOrange } from "@/modules/ui/atoms/Chip/Chip";
import { type PaymentAppUserVisibleConfigEntry } from "@/modules/payment-app-configuration/config-entry";
import { getEnvironmentFromKey } from "@/modules/tamara/tamara-api";

export const ConfigurationSummary = ({ config }: { config: PaymentAppUserVisibleConfigEntry }) => {
  return (
    <Box
      as="dl"
      display="grid"
      __gridTemplateColumns="max-content 1fr"
      rowGap={2}
      columnGap={2}
      alignItems="center"
      margin={0}
    >
      <Box as="dt" margin={0} fontSize="captionSmall" color="textNeutralSubdued">
        Environment
      </Box>
      <Box as="dd" margin={0} textAlign="right">
        {getEnvironmentFromKey(config.publishableKey) === "live" ? (
          <ChipSuccess>LIVE</ChipSuccess>
        ) : (
          <ChipCkoOrange>TESTING</ChipCkoOrange>
        )}
      </Box>
    </Box>
  );
};
