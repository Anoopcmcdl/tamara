import { Box, Button, Text } from "@saleor/macaw-ui/next";
import { withAuthorization } from "@saleor/app-sdk/app-bridge";
import { useRouter } from "next/router";
import Link from "next/link";
import { AppLayout } from "@/modules/ui/templates/AppLayout";
import { TamaraConfigurationForm } from "@/modules/ui/organisms/AddTamaraConfigurationForm/AddTamaraConfigurationForm";

const EditConfigurationPage = () => {
  const router = useRouter();
  if (typeof router.query.configurationId !== "string" || !router.query.configurationId) {
    // TODO: Add loading
    return <div />;
  }

  return (
    <>
      <Box display="flex" flexDirection="row" columnGap={4}>
        <Link href={"/configurations/list"}>
          <Button variant="tertiary" size="medium">
            Back
          </Button>
        </Link>
      </Box>
      <AppLayout
        title="Tamara > Edit configuration"
        description={
          <Text as="p" variant="body" size="medium">
            Edit Tamara configuration.
          </Text>
        }
      >
        <TamaraConfigurationForm configurationId={router.query.configurationId} />
      </AppLayout>
    </>
  );
};

export default withAuthorization()(EditConfigurationPage);
