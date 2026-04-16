import { Card, BlockStack, Text, Box } from "@shopify/polaris";
import type { FormField } from "../../models/form.server";
import { v4 as uuidv4 } from "uuid";

type FieldType = FormField["type"];

type PaletteItem = {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
};

const PALETTE_ITEMS: PaletteItem[] = [
  { type: "text",     label: "Short text",   icon: "T",  description: "Single-line text input"  },
  { type: "email",    label: "Email",        icon: "@",  description: "Validates email format"  },
  { type: "phone",    label: "Phone",        icon: "☎",  description: "Phone number input"      },
  { type: "textarea", label: "Long text",    icon: "¶",  description: "Multi-line text area"    },
  { type: "select",   label: "Dropdown",     icon: "▾",  description: "Single choice list"      },
  { type: "checkbox", label: "Checkboxes",   icon: "☑",  description: "Multiple choice options" },
];

type Props = {
  onAdd: (field: FormField) => void;
  disabled?: boolean;
};

export function FieldPalette({ onAdd, disabled = false }: Props) {
  function createField(type: FieldType): FormField {
    const label =
      PALETTE_ITEMS.find((p) => p.type === type)?.label ?? type;

    return {
      id: uuidv4(),
      type,
      label,
      placeholder: `Enter ${label}`,
      required: false,
      options: ["select", "checkbox"].includes(type)
        ? ["Option 1", "Option 2"]
        : [],
    };
  }

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Add fields
        </Text>

        <Text as="p" variant="bodySm" tone="subdued">
          Click any field type to add it to your form
        </Text>

        <BlockStack gap="200">
          {PALETTE_ITEMS.map((item) => (
            <button
              key={item.type}
              disabled={disabled}
              aria-label={`Add ${item.label} field`}
              onClick={() => onAdd(createField(item.type))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "10px 12px",
                background: disabled ? "#F9FAFB" : "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                cursor: disabled ? "not-allowed" : "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                opacity: disabled ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!disabled)
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#5C6AC4";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "8px",
                  background: "#EEF0FB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0,
                  color: "#5C6AC4",
                }}
              >
                {item.icon}
              </div>

              {/* Text */}
              <div>
                <div
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 500,
                    color: "#111827",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    marginTop: 1,
                  }}
                >
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </BlockStack>

        {/* Hint */}
        <Box
          background="bg-surface-secondary"
          borderRadius="200"
          padding="300"
        >
          <Text as="p" variant="bodySm" tone="subdued">
            💡 Tip — drag fields in the editor to reorder them
          </Text>
        </Box>
      </BlockStack>
    </Card>
  );
}