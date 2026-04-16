import { Card, BlockStack, Text, InlineStack, Icon, Box } from "@shopify/polaris";
import {
  NoteIcon,
  EmailNewsletterIcon,
  PersonIcon,
} from "@shopify/polaris-icons";

type Stat = {
  label: string;
  value: number | string;
  trend?: string;
  trendUp?: boolean;
  icon: "forms" | "submissions" | "customers";
};

const iconMap = {
  forms:       NoteIcon,
  submissions: EmailNewsletterIcon,
  customers:   PersonIcon,
};

type Props = {
  stats: Stat[];
};

export function StatsCard({ stats }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
      }}
    >
      {stats.map((stat) => (
        <Card key={stat.label}>
          <BlockStack gap="300">
            {/* Label + Icon */}
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="bodySm" tone="subdued">
                {stat.label}
              </Text>
              <Box
                background="bg-surface-secondary"
                borderRadius="200"
                padding="100"
              >
                <Icon source={iconMap[stat.icon]} tone="base" />
              </Box>
            </InlineStack>

            {/* Value */}
            <Text as="p" variant="heading2xl" fontWeight="bold">
              {stat.value}
            </Text>

            {/* Trend */}
            {stat.trend && (
              <Text
                as="p"
                variant="bodySm"
                tone={stat.trendUp ? "success" : "subdued"}
              >
                {stat.trendUp ? "↑ " : ""}{stat.trend}
              </Text>
            )}
          </BlockStack>
        </Card>
      ))}
    </div>
  );
}