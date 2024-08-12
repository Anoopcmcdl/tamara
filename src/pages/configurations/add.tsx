import { Box, Button, Text } from "@saleor/macaw-ui/next";
import { withAuthorization } from "@saleor/app-sdk/app-bridge";
import Link from "next/link";
import { AppLayout } from "@/modules/ui/templates/AppLayout";
import { TamaraConfigurationForm } from "@/modules/ui/organisms/AddTamaraConfigurationForm/AddTamaraConfigurationForm";

const AddConfigurationPage = () => {
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
        title="Tamara > Add configuration"
        description={
          <Text as="p" variant="body" size="medium">
            Create new Tamara configuration.
          </Text>
        }
      >
        <TamaraConfigurationForm configurationId={undefined} />
      </AppLayout>
    </>
  );
};

export default withAuthorization()(AddConfigurationPage);
