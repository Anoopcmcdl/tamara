import { Text } from "@saleor/macaw-ui/next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useForm, FormProvider } from "react-hook-form";
import { AppLayoutRow } from "../../templates/AppLayout";
import { FullPageError } from "../../molecules/FullPageError/FullPageError";
import { AddTamaraCredentialsForm } from "./AddTamaraCredentialsForm";
import { DeleteTamaraConfigurationForm } from "./DeleteTamaraConfigurationForm";
import { checkTokenPermissions } from "@/modules/jwt/check-token-offline";
import { REQUIRED_SALEOR_PERMISSIONS } from "@/modules/jwt/consts";
import { trpcClient } from "@/modules/trpc/trpc-client";
import {
  type PaymentAppFormConfigEntry,
  paymentAppFormConfigEntrySchema,
} from "@/modules/payment-app-configuration/config-entry";

export const TamaraConfigurationForm = ({
  configurationId,
}: {
  configurationId: string | undefined | null;
}) => {
  const { appBridgeState } = useAppBridge();
  const { token } = appBridgeState ?? {};

  const hasPermissions = true || checkTokenPermissions(token, REQUIRED_SALEOR_PERMISSIONS);

  const formMethods = useForm<PaymentAppFormConfigEntry>({
    resolver: zodResolver(paymentAppFormConfigEntrySchema),
    defaultValues: {
      configurationName: "",
      publishableKey: "",
      apiKey: "",
      notificationToken: "",
    },
  });

  const { data } = trpcClient.paymentAppConfigurationRouter.paymentConfig.get.useQuery(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- query is not enabled if configurationId is missing
    { configurationId: configurationId! },
    { enabled: !!configurationId },
  );

  if (!hasPermissions) {
    return (
      <FullPageError>
        <Text variant="hero">{"You don't have permissions to configure this app."}</Text>
      </FullPageError>
    );
  }

  return (
    <FormProvider {...formMethods}>
      <AppLayoutRow title="Tamara Credentials">
        <AddTamaraCredentialsForm configurationId={configurationId} />
      </AppLayoutRow>
      {data && configurationId && (
        <AppLayoutRow error={true} title="Danger zone">
          <DeleteTamaraConfigurationForm
            configurationName={data.configurationName}
            configurationId={configurationId}
          />
        </AppLayoutRow>
      )}
    </FormProvider>
  );
};
