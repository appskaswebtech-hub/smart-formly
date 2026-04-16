import { useState } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  ProgressBar,
  Icon,
  Box,
} from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";

type Step = {
  id: string;
  label: string;
  done: boolean;
};

type Props = {
  steps?: Step[];
};

const defaultSteps: Step[] = [
  { id: "enable",  label: "Enable the app",          done: true  },
  { id: "create",  label: "Create form",              done: false },
  { id: "publish", label: "Add the form to your store", done: false },
];

export function OnboardingChecklist({ steps = defaultSteps }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [localSteps, setLocalSteps] = useState(steps);

  if (dismissed) return null;

  const doneCount  = localSteps.filter((s) => s.done).length;
  const totalCount = localSteps.length;
  const progress   = Math.round((doneCount / totalCount) * 100);
  const allDone    = doneCount === totalCount;

  function markDone(id: string) {
    setLocalSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: true } : s))
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}
        <InlineStack align="space-between" blockAlign="start">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              Get started
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Follow these steps to set up and add your first form to your store
            </Text>
          </BlockStack>
          <Button
            variant="plain"
            tone="critical"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
        </InlineStack>

        {/* Progress */}
        <BlockStack gap="200">
          <Text as="p" variant="bodySm" tone="subdued">
            {doneCount} / {totalCount} completed
          </Text>
          <ProgressBar progress={progress} size="small" tone="success" />
        </BlockStack>

        {/* Steps */}
        <BlockStack gap="300">
          {localSteps.map((step) => (
            <InlineStack key={step.id} gap="300" blockAlign="center">
              <Box>
                {step.done ? (
                  <Icon source={CheckCircleIcon} tone="success" />
                ) : (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: "2px solid #8C9196",
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>
              <Text
                as="span"
                tone={step.done ? "subdued" : "base"}
                textDecorationLine={step.done ? "line-through" : undefined}
              >
                {step.label}
              </Text>
              {!step.done && (
                <Button
                  variant="plain"
                  size="slim"
                  onClick={() => markDone(step.id)}
                >
                  Mark done
                </Button>
              )}
            </InlineStack>
          ))}
        </BlockStack>

        {allDone && (
          <Text as="p" tone="success" variant="bodySm" fontWeight="semibold">
            🎉 All steps complete! Your store is ready to collect submissions.
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}