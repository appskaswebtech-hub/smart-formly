import {useState} from "react";
import {
  InlineGrid,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Icon,
  Page
} from "@shopify/polaris";
import { SettingsIcon, ReceiptDollarIcon,ChartHistogramFullIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {useNavigate} from "@remix-run/react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [activeSection, setActiveSection] = useState(null);
  const [hovered, setHovered] = useState(null);

 
const navigate = useNavigate();
  return (
    <Page title="Settings">
     <InlineGrid columns={3} gap="400">

  {/* Card 1 */}

    <Box 
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
   onClick={() => alert("clicked")}
  
  style={{
    cursor: "pointer",
    background: hovered ? "#f5faff" : "white",
  }}
>
      <InlineStack blockAlign="center">

        <Icon source={SettingsIcon} />

        <BlockStack>
          <Text as="h3" variant="headingSm">
            <span style={{ color: "#006fbb" }}>
              General settings
            </span>
          </Text>

          <Text as="p" tone="subdued">
            Branding & app embed
          </Text>
        </BlockStack>

      </InlineStack>
    </Box>


  {/* Card 2 */}

   <Box
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  onClick={() => navigate('/app/settings/vol?widget=volume-widget')}
  style={{
    cursor: "pointer",
    background: hovered ? "#f5faff" : "white",
  }}
>
      <InlineStack blockAlign="center">

        <Icon source={ReceiptDollarIcon} />

        <BlockStack>
          <Text as="h3" variant="headingSm">
            <span style={{ color: "#006fbb" }}>
              Volume discount colors
            </span>
          </Text>

          <Text as="p" tone="subdued">
            Colors used for volume discounts
          </Text>
        </BlockStack>

      </InlineStack>
    </Box>


  {/* Card 3 */}

   <Box
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
 onClick={() => navigate('/app/settings/qty?widget=bundler-widget')}
  style={{
    cursor: "pointer",
    background: hovered ? "#f5faff" : "white",
  }}
>
      <InlineStack blockAlign="center">

        <Icon source={ChartHistogramFullIcon} />

        <BlockStack >
          <Text as="h3" variant="headingSm">
            <span style={{ color: "#006fbb" }}>
              Quantity break colors
            </span>
          </Text>

          <Text as="p" tone="subdued">
            Colors used for quantity breaks
          </Text>
        </BlockStack>

      </InlineStack>
    </Box>


</InlineGrid>
    </Page>
  );
}