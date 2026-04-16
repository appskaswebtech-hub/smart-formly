import {
  Card, BlockStack, InlineStack, TextField, Select,
  Checkbox, Button, Text, Divider, Box, Icon, Badge,
} from "@shopify/polaris";
import { DeleteIcon, DragHandleIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import type { FormField } from "../../models/form.server";

type Props = {
  field: FormField;
  index: number;
  onChange: (updated: FormField) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

const FIELD_TYPE_OPTIONS = [
  { label: "Short text",  value: "text"     },
  { label: "Email",       value: "email"    },
  { label: "Phone",       value: "phone"    },
  { label: "Long text",   value: "textarea" },
  { label: "Dropdown",    value: "select"   },
  { label: "Checkbox",    value: "checkbox" },
  { label: "File upload", value: "file"     },
];

export function FieldEditor({
  field, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [optionInput, setOptionInput] = useState("");

  function update(patch: Partial<FormField>) {
    onChange({ ...field, ...patch });
  }

  // function addOption() {
  //   const val = optionInput.trim();
  //   if (!val) return;
  //   update({ options: [...(field.options ?? []), val] });
  //   setOptionInput("");
  // }

  function addOption() {
  const val = optionInput.trim();
  if (!val) return;

  const currentOptions = Array.isArray(field.options) ? field.options : [];

  update({
    options: [...currentOptions, val],
  });

  setOptionInput("");
}
  function removeOption(i: number) {
    // const next = [...(field.options ?? [])];
    const next = Array.isArray(field.options) ? [...field.options] : [];
    next.splice(i, 1);
    update({ options: next });
  }

  const typeLabel =
    FIELD_TYPE_OPTIONS.find((o) => o.value === field.type)?.label ?? field.type;

  return (
    <Card>
      <BlockStack gap="300">
        {/* Header row */}
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="300" blockAlign="center">
            <div style={{ cursor: "grab", color: "#8C9196" }}>
              <Icon source={DragHandleIcon} />
            </div>
            <Text as="span" fontWeight="semibold">
              Field {index + 1}
            </Text>
            <Badge>{typeLabel}</Badge>
            {field.required && <Badge tone="attention">Required</Badge>}
          </InlineStack>

          <InlineStack gap="200">
            <Button
              size="slim"
              variant="plain"
              disabled={isFirst}
              onClick={onMoveUp}
              accessibilityLabel="Move field up"
            >
              ↑
            </Button>
            <Button
              size="slim"
              variant="plain"
              disabled={isLast}
              onClick={onMoveDown}
              accessibilityLabel="Move field down"
            >
              ↓
            </Button>
            <Button
              size="slim"
              variant="plain"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? "Collapse" : "Expand"}
            </Button>
            <Button
              size="slim"
              variant="plain"
              tone="critical"
              icon={DeleteIcon}
              onClick={onDelete}
              accessibilityLabel="Delete field"
            />
          </InlineStack>
        </InlineStack>

        {expanded && (
          <>
            <Divider />

            {/* Type + Label row */}
            <InlineStack gap="400" align="start">
              <Box minWidth="180px">
                <Select
                  label="Field type"
                  options={FIELD_TYPE_OPTIONS}
                  value={field.type}
                  onChange={(v) =>
                    update({ type: v as FormField["type"], options: [] })
                  }
                />
              </Box>
              <div style={{ flex: 1 }}>
                <TextField
                  label="Label"
                  value={field.label}
                  onChange={(v) => update({ label: v })}
                  autoComplete="off"
                />
              </div>
            </InlineStack>

            {/* Placeholder */}
            {field.type !== "checkbox" && field.type !== "file" && (
              <TextField
                label="Placeholder text"
                value={field.placeholder ?? ""}
                onChange={(v) => update({ placeholder: v })}
                autoComplete="off"
              />
            )}

            {/* Options for select/checkbox */}
            {(field.type === "select" || field.type === "checkbox") && (
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" fontWeight="semibold">
                  Options
                </Text>

                {(Array.isArray(field.options) ? field.options : []).map((opt, i) => (
                  <InlineStack key={i} gap="200" blockAlign="center">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label=""
                        labelHidden
                        value={opt}
                        onChange={(v) => {
                          const next = [...(field.options ?? [])];
                          next[i] = v;
                          update({ options: next });
                        }}
                        autoComplete="off"
                      />
                    </div>
                    <Button
                      size="slim"
                      tone="critical"
                      variant="plain"
                      onClick={() => removeOption(i)}
                    >
                      Remove
                    </Button>
                  </InlineStack>
                ))}

                <InlineStack gap="200" blockAlign="end">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="New option"
                      labelHidden
                      placeholder="Add option…"
                      value={optionInput}
                      onChange={setOptionInput}
                      autoComplete="off"
                    />
                  </div>
                  <Button onClick={addOption} size="slim">
                    Add option
                  </Button>
                </InlineStack>
              </BlockStack>
            )}

            {/* Required toggle */}
            <Checkbox
              label="Required field"
              checked={field.required}
              onChange={(v) => update({ required: v })}
            />
          </>
        )}
      </BlockStack>
    </Card>
  );
}