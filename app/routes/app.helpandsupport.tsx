import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};


import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
} from "@shopify/polaris";

export default function SupportPage() {
  return (
    <Page title="Help & Support">
      <Layout>

        {/* FAQ Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Frequently Asked Questions</Text>

              <div>
                <Text as="h3" variant="headingSm">How do I create a form?</Text>
                <Text as="p" tone="subdued">
                  Go to Dashboard → Click "Create Form" → Add fields → Save.
                </Text>
              </div>

              <div>
                <Text as="h3" variant="headingSm">How do I use form in my store?</Text>
                <Text as="p" tone="subdued">
                  Copy the Form ID and paste it inside your Shopify theme section.
                </Text>
              </div>

              <div>
                <Text as="h3" variant="headingSm">Where can I see submissions?</Text>
                <Text as="p" tone="subdued">
                  Go to Forms → Click "Submissions".
                </Text>
              </div>

              <div>
                <Text as="h3" variant="headingSm">Why is my form not showing?</Text>
                <Text as="p" tone="subdued">
                  Make sure the form is active and the ID is correct.
                </Text>
              </div>

            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Contact Support */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Contact Support</Text>

              <Text as="p" tone="subdued">
                Need help? Reach out to us anytime.
              </Text>

              <InlineStack gap="300">
                <Button
                  onClick={() =>
                    window.open("mailto:support@smartformly.com")
                  }
                >
                  Email Support
                </Button>

                <Button
                  onClick={() =>
                    window.open("https://docs.smartformly.com", "_blank")
                  }
                >
                  View Documentation
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
  );
}