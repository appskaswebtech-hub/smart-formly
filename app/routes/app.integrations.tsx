import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useActionData } from "@remix-run/react";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  TextField,
  Checkbox,
  Select,
  Badge,
  Tabs,
  DataTable,
  Banner,
  Box,
  Divider,
  Link,
} from "@shopify/polaris";

/* ─── Loader ─── */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  // Load any saved settings from DB here if needed
  return json({ shop: session.shop });
};

/* ─── Action (handle saves) ─── */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Handle different save actions based on intent
  switch (intent) {
    case "save-basic":
      // Save basic settings
      return json({ success: true, message: "Basic settings saved!" });
    case "save-domains":
      // Save blocked domains
      return json({ success: true, message: "Blocked domains saved!" });
    case "save-smtp":
      // Save SMTP settings
      return json({ success: true, message: "Domain setup saved!" });
    case "save-payment":
      // Save payment integration
      return json({ success: true, message: "Payment integration saved!" });
    case "save-email-provider":
      // Save email service provider
      return json({ success: true, message: "Email service provider saved!" });
    case "save-zerobounce":
      // Save zerobounce key
      return json({ success: true, message: "Zerobounce key saved!" });
    case "save-language":
      // Save language messages
      return json({ success: true, message: "Language settings saved!" });
    default:
      return json({});
  }
};

/* ─── Sub-tab components ─── */

function BasicSettings() {
  const [noMonthly, setNoMonthly] = useState(false);
  const [altEmail, setAltEmail] = useState("");
  const [themeNotif, setThemeNotif] = useState(true);
  const [englishDefault, setEnglishDefault] = useState(false);
  const submit = useSubmit();

  const handleSave = () => {
    const fd = new FormData();
    fd.append("intent", "save-basic");
    fd.append("noMonthly", String(noMonthly));
    fd.append("altEmail", altEmail);
    fd.append("themeNotif", String(themeNotif));
    fd.append("englishDefault", String(englishDefault));
    submit(fd, { method: "post" });
  };

  return (
    <BlockStack gap="600">
      {/* Monthly Analysis */}
      <Layout>
        <Layout.Section variant="oneThird">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd" fontWeight="bold">Monthly analysis</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Our monthly analysis emails will keep you up to date on your store's success with our app.
            </Text>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Checkbox
                label="I don't want to receive monthly analysis emails."
                checked={noMonthly}
                onChange={setNoMonthly}
              />
              <TextField
                label="Alternative email address (optional)"
                value={altEmail}
                onChange={setAltEmail}
                placeholder="Email for monthly analysis"
                helpText="By default, it will be sent to your store admin email."
                autoComplete="email"
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Divider />

      {/* Theme change notification */}
      <Layout>
        <Layout.Section variant="oneThird">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd" fontWeight="bold">Theme change/update notification</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              This email is triggered and sent to the store owner every time there is a change to your theme files.
            </Text>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Checkbox
              label="I agree to receive theme change/update email notifications."
              checked={themeNotif}
              onChange={setThemeNotif}
            />
          </Card>
        </Layout.Section>
      </Layout>

      <Divider />

      {/* App Language */}
      <Layout>
        <Layout.Section variant="oneThird">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd" fontWeight="bold">App Language</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Our app by default adapts the translated values based on the account language.
            </Text>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Checkbox
                label="Please enable this option to use English as a default app language."
                checked={englishDefault}
                onChange={setEnglishDefault}
              />
              <InlineStack align="end">
                <Button variant="primary" onClick={handleSave}>Save</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </BlockStack>
  );
}

function LanguageSettings() {
  const [langSubTab, setLangSubTab] = useState(0);
  const [formSubmissionMsg, setFormSubmissionMsg] = useState("");
  const [processingMsg, setProcessingMsg] = useState("");
  const [requiredMsg, setRequiredMsg] = useState("");
  const [invalidEmailMsg, setInvalidEmailMsg] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [submitBtnText, setSubmitBtnText] = useState("");
  const [cancelBtnText, setCancelBtnText] = useState("");
  const submit = useSubmit();

  const langTabs = [
    { id: "informative", content: "Informative messages" },
    { id: "validation", content: "Validation messages" },
    { id: "other", content: "Other messages" },
    { id: "common", content: "Common messages" },
  ];

  const handleSave = () => {
    const fd = new FormData();
    fd.append("intent", "save-language");
    submit(fd, { method: "post" });
  };

  return (
    <BlockStack gap="400">
      <Tabs tabs={langTabs} selected={langSubTab} onSelect={setLangSubTab} />

      {langSubTab === 0 && (
        <Layout>
          <Layout.Section variant="oneThird">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" fontWeight="bold">Informative messages</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Use these settings to customize messages that your customers see when they are filling out response on the forms.
              </Text>
            </BlockStack>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h4" variant="headingSm" fontWeight="semibold">Informative messages</Text>
                <TextField
                  label="Form submission message"
                  value={formSubmissionMsg}
                  onChange={setFormSubmissionMsg}
                  placeholder="Form submission message"
                  autoComplete="off"
                />
                <TextField
                  label="Processing..."
                  value={processingMsg}
                  onChange={setProcessingMsg}
                  placeholder="Processing..."
                  autoComplete="off"
                />
                <InlineStack align="end">
                  <Button variant="primary" onClick={handleSave}>Save</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      )}

      {langSubTab === 1 && (
        <Layout>
          <Layout.Section variant="oneThird">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" fontWeight="bold">Validation messages</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Customize the error messages shown when form validation fails.
              </Text>
            </BlockStack>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <TextField label="Required field message" value={requiredMsg} onChange={setRequiredMsg} placeholder="This field is required" autoComplete="off" />
                <TextField label="Invalid email message" value={invalidEmailMsg} onChange={setInvalidEmailMsg} placeholder="Please enter a valid email address" autoComplete="off" />
                <InlineStack align="end">
                  <Button variant="primary" onClick={handleSave}>Save</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      )}

      {langSubTab === 2 && (
        <Layout>
          <Layout.Section variant="oneThird">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" fontWeight="bold">Other messages</Text>
              <Text as="p" variant="bodySm" tone="subdued">Additional messages used throughout the forms.</Text>
            </BlockStack>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <TextField label="Loading message" value={loadingMsg} onChange={setLoadingMsg} placeholder="Loading..." autoComplete="off" />
                <InlineStack align="end">
                  <Button variant="primary" onClick={handleSave}>Save</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      )}

      {langSubTab === 3 && (
        <Layout>
          <Layout.Section variant="oneThird">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" fontWeight="bold">Common messages</Text>
              <Text as="p" variant="bodySm" tone="subdued">Messages shared across all form types.</Text>
            </BlockStack>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <TextField label="Submit button text" value={submitBtnText} onChange={setSubmitBtnText} placeholder="Submit" autoComplete="off" />
                <TextField label="Cancel button text" value={cancelBtnText} onChange={setCancelBtnText} placeholder="Cancel" autoComplete="off" />
                <InlineStack align="end">
                  <Button variant="primary" onClick={handleSave}>Save</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      )}
    </BlockStack>
  );
}

function BlockedDomainsSettings() {
  const [domains, setDomains] = useState("");
  const submit = useSubmit();

  const handleSave = () => {
    const fd = new FormData();
    fd.append("intent", "save-domains");
    fd.append("domains", domains);
    submit(fd, { method: "post" });
  };

  return (
    <Layout>
      <Layout.Section variant="oneThird">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd" fontWeight="bold">Blocked domains</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            If you wish to block certain email domains use this settings page to do so.
          </Text>
        </BlockStack>
      </Layout.Section>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <TextField
              label="Email domains to block"
              value={domains}
              onChange={setDomains}
              placeholder="example.com, another-example.com"
              helpText='Enter the domain (e.g., "gmail.com") to block all emails from it, or enter a full email (e.g., "user@gmail.com") to block only that address.'
              autoComplete="off"
              multiline={2}                                                                                                                                                                                                                                                                             
            />
            <InlineStack align="end">
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}

function ApiTokensSettings() {
  return (
    <BlockStack gap="400">
      <InlineStack align="space-between">
        <InlineStack gap="200" blockAlign="center">
          <Text as="h3" variant="headingLg" fontWeight="bold">API Tokens</Text>
          {/* <Badge>Pro</Badge> */}
        </InlineStack>
        <Button>New API Key</Button>
      </InlineStack>
      <Card>
        <DataTable
          columnContentTypes={["text", "text", "text", "text", "text", "text"]}
          headings={["Name", "Support email", "Token", "Copy", "Last updated", "Actions"]}
          rows={[]}
        />
        <Box padding="600">
          <Text as="p" alignment="center" tone="subdued">No records available</Text>
        </Box>
      </Card>
    </BlockStack>
  );
}

function DomainSetupSettings() {
  const [method, setMethod] = useState("smtp");
  const [server, setServer] = useState("");
  const [port, setPort] = useState("587");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState("plain");
  const [ssl, setSsl] = useState("true");
  const submit = useSubmit();

  const handleSave = () => {
    const fd = new FormData();
    fd.append("intent", "save-smtp");
    fd.append("server", server);
    fd.append("port", port);
    fd.append("email", email);
    fd.append("auth", auth);
    fd.append("ssl", ssl);
    submit(fd, { method: "post" });
  };

  return (
    <Layout>
      <Layout.Section variant="oneThird">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd" fontWeight="bold">Sending domain</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Configure your custom sending domain for form notification emails.
          </Text>
        </BlockStack>
      </Layout.Section>
      <Layout.Section>
        <Card>
          <BlockStack gap="500">
            <Select
              label="Sending domain settings method you want to use"
              options={[
                { label: "SMTP", value: "smtp" },
                { label: "API", value: "api" },
              ]}
              value={method}
              onChange={setMethod}
              helpText={<span>You can follow the custom domain setup instruction from <Link url="#">here</Link>.</span>}
            />

            <Card background="bg-surface-secondary">
              <BlockStack gap="400">
                <Text as="h4" variant="headingSm" fontWeight="semibold">Domain details</Text>
                <TextField label="Server address" value={server} onChange={setServer} placeholder="smtp.gmail.com" autoComplete="off" />
                <TextField label="Port" value={port} onChange={setPort} placeholder="587" autoComplete="off" />
                <TextField label="Email" value={email} onChange={setEmail} placeholder="example@gmail.com" autoComplete="email" />

                <Text as="h4" variant="headingSm" fontWeight="semibold">Domain authentication</Text>
                <TextField label="Password" value={password} onChange={setPassword} placeholder="Password" type="password" autoComplete="off" />
                <TextField label="Authentication" value={auth} onChange={setAuth} placeholder="plain" autoComplete="off" />
                <Select
                  label="Enable SSL"
                  options={[
                    { label: "True", value: "true" },
                    { label: "False", value: "false" },
                  ]}
                  value={ssl}
                  onChange={setSsl}
                />
              </BlockStack>
            </Card>

            <InlineStack align="space-between">
              <Button>Verify</Button>
              <Button variant="primary" onClick={handleSave}>Submit</Button>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              Note: Please verify SMTP details before submitting.
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}

function PaymentIntegrationSettings() {
  const [paymentType, setPaymentType] = useState("stripe");
  const [pubKey, setPubKey] = useState("");
  const [secKey, setSecKey] = useState("");
  const submit = useSubmit();

  const handleSave = () => {
    const fd = new FormData();
    fd.append("intent", "save-payment");
    fd.append("paymentType", paymentType);
    fd.append("pubKey", pubKey);
    fd.append("secKey", secKey);
    submit(fd, { method: "post" });
  };

  return (
    <Layout>
      <Layout.Section variant="oneThird">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd" fontWeight="bold">Payment integration</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Connect a payment provider to accept payments through your forms.
          </Text>
        </BlockStack>
      </Layout.Section>
      <Layout.Section>
        <Card>
          <BlockStack gap="500">
            <Select
              label="Select Payment type"
              options={[
                { label: "Stripe", value: "stripe" },
                { label: "PayPal", value: "paypal" },
              ]}
              value={paymentType}
              onChange={setPaymentType}
            />

            <Card background="bg-surface-secondary">
              <BlockStack gap="400">
                <Text as="h4" variant="headingSm" fontWeight="semibold">Connect to {paymentType}</Text>
                <TextField label="Publishable Key" value={pubKey} onChange={setPubKey} placeholder="Publishable Key" autoComplete="off" />
                <TextField label="Secret Key" value={secKey} onChange={setSecKey} placeholder="Secret Key" autoComplete="off" />
                <Text as="p" variant="bodySm">
                  You can get your {paymentType} Key from <Link url="#">here</Link>.
                </Text>
              </BlockStack>
            </Card>

            <InlineStack align="end">
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}

function EmailServiceSettings() {
  const [intType, setIntType] = useState("mailchimp");
  const [apiKey, setApiKey] = useState("");
  const submit = useSubmit();

  const handleSave = () => {
    const fd = new FormData();
    fd.append("intent", "save-email-provider");
    fd.append("intType", intType);
    fd.append("apiKey", apiKey);
    submit(fd, { method: "post" });
  };

  const label = intType.charAt(0).toUpperCase() + intType.slice(1);

  return (
    <Layout>
      <Layout.Section variant="oneThird">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd" fontWeight="bold">Mail integration</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Connect an email service provider to sync form submissions with your mailing lists.
          </Text>
        </BlockStack>
      </Layout.Section>
      <Layout.Section>
        <Card>
          <BlockStack gap="500">
            <Select
              label="Select integration type"
              options={[
                { label: "Mailchimp", value: "mailchimp" },
                { label: "Klaviyo", value: "klaviyo" },
                { label: "Sendinblue", value: "sendinblue" },
              ]}
              value={intType}
              onChange={setIntType}
            />

            <Card background="bg-surface-secondary">
              <BlockStack gap="400">
                <Text as="h4" variant="headingSm" fontWeight="semibold">Connect {label}</Text>
                <TextField label={`${label} Key`} value={apiKey} onChange={setApiKey} placeholder={`${label} Key`} autoComplete="off" />
                <Text as="p" variant="bodySm">
                  You can get your {intType} key from <Link url="#">here</Link>.
                </Text>
              </BlockStack>
            </Card>

            <InlineStack align="end">
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}

function ZerobounceSettings() {
  const [zbKey, setZbKey] = useState("");
  const submit = useSubmit();

  const handleSave = () => {
    const fd = new FormData();
    fd.append("intent", "save-zerobounce");
    fd.append("zbKey", zbKey);
    submit(fd, { method: "post" });
  };

  return (
    <Layout>
      <Layout.Section variant="oneThird">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd" fontWeight="bold">Zerobounce integration</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Validate email addresses in real-time using Zerobounce.
          </Text>
        </BlockStack>
      </Layout.Section>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <Text as="h4" variant="headingSm" fontWeight="semibold">Connect to zerobounce</Text>
            <TextField label="Zerobounce Key" value={zbKey} onChange={setZbKey} placeholder="Zerobounce Key" autoComplete="off" />
            <Text as="p" variant="bodySm">
              You can get your zerobounce Key from <Link url="#">here</Link>.
            </Text>
            <InlineStack align="end">
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}

/* ═══════════════════════════════════════════
   MAIN SETTINGS PAGE
   ═══════════════════════════════════════════ */

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();

  // Main tabs: Basic, Language, Blocked domains, Integrations
  const [mainTab, setMainTab] = useState(3); // Start on Integrations since user clicked "Setup apps"

  // Integration sub-tabs
  const [intTab, setIntTab] = useState(0);

  const mainTabs = [
    { id: "basic", content: "Basic" },
    {
      id: "language",
      content: (
        <InlineStack gap="100" blockAlign="center">
          <span>Language</span>
          {/* <Badge tone="info">Pro</Badge> */}
        </InlineStack>
      ),
    },
    {
      id: "blocked-domains",
      content: (
        <InlineStack gap="100" blockAlign="center">
          <span>Blocked domains</span>
          <Badge tone="info">

          </Badge>
        </InlineStack>
      ),
    },
    {
      id: "integrations",
      content: (
        <InlineStack gap="100" blockAlign="center">
          <span>Integrations</span>
          <Badge tone="info">

          </Badge>
        </InlineStack>
      ),
    },
  ];

  const intTabs = [
    {
      id: "api-tokens",
      content: (
        <InlineStack gap="100" blockAlign="center">
          <span>API Tokens</span>
          <Badge tone="info">

          </Badge>
        </InlineStack>
      ),
    },
    {
      id: "domain-setup",
      content: (
        <InlineStack gap="100" blockAlign="center">
          <span>Domain setup</span>
          <Badge tone="info">

          </Badge>
        </InlineStack>
      ),
    },
    {
      id: "payment",
      content: (
        <InlineStack gap="100" blockAlign="center">
          <span>Payment integration</span>
          <Badge tone="info">
            
          </Badge>
        </InlineStack>
      ),
    },
    {
      id: "email-service",
      content: (
        <InlineStack gap="100" blockAlign="center">
          <span>Email service provider</span>
          <Badge tone="info">

          </Badge>
        </InlineStack>
      ),
    },
    {
      id: "zerobounce",
      content: (
        <InlineStack gap="100" blockAlign="center">
          <span>Zerobounce Email Validation</span>
          <Badge tone="warning">
            {/* Pro+ */}


          </Badge>
        </InlineStack>
      ),
    },
  ];

  return (
    <Page
      title="Settings"
      backAction={{ content: "Dashboard", onAction: () => navigate("/app") }}
      breadcrumbs={[{ content: "Dashboard", onAction: () => navigate("/app") }]}
    >
      {actionData?.success && (
        <Box paddingBlockEnd="400">
          <Banner tone="success" onDismiss={() => {}}>
            <p>{actionData.message}</p>
          </Banner>
        </Box>
      )}

      <BlockStack gap="400">
        {/* Main Tabs */}
        <Tabs tabs={mainTabs} selected={mainTab} onSelect={setMainTab} />

        {/* Basic */}
        {mainTab === 0 && <BasicSettings />}

        {/* Language */}
        {mainTab === 1 && <LanguageSettings />}

        {/* Blocked Domains */}
        {mainTab === 2 && <BlockedDomainsSettings />}

        {/* Integrations */}
        {mainTab === 3 && (
          <BlockStack gap="400">
            <Tabs tabs={intTabs} selected={intTab} onSelect={setIntTab} />
            {intTab === 0 && <ApiTokensSettings />}
            {intTab === 1 && <DomainSetupSettings />}
            {intTab === 2 && <PaymentIntegrationSettings />}
            {intTab === 3 && <EmailServiceSettings />}
            {intTab === 4 && <ZerobounceSettings />}
          </BlockStack>
        )}
      </BlockStack>

      {/* Footer */}
      <Box paddingBlockStart="800">
        <InlineStack align="center">
          <Text as="p" variant="bodySm" tone="subdued">
            The Form Builder app.{" "}
            <Link url="#" removeUnderline>Privacy policy</Link> |{" "}
            <Link url="#" removeUnderline>Terms and conditions</Link>
          </Text>
        </InlineStack>
      </Box>
    </Page>
  );
}