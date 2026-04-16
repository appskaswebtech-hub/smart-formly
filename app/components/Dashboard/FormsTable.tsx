import {
  IndexTable,
  Badge,
  Button,
  InlineStack,
  Text,
  EmptyState,
  Thumbnail,
  useIndexResourceState,
} from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";

type Form = {
  id: string;
  formName: string;
  isActive: boolean;
  submissionsCount: number;
  createdAt: string;
  slug: string;
};

type Props = {
  forms: Form[];
  onDelete?: (id: string) => void;
};

export function FormsTable({ forms, onDelete }: Props) {
  const resourceName = { singular: "form", plural: "forms" };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(forms);

  if (forms.length === 0) {
    return (
      <EmptyState
        heading="No forms yet"
        action={{ content: "Create your first form", url: "/app/forms/new" }}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Create a form to start collecting submissions from your store.</p>
      </EmptyState>
    );
  }

  const rowMarkup = forms.map((form, index) => (
    <IndexTable.Row
      id={form.id}
      key={form.id}
      selected={selectedResources.includes(form.id)}
      position={index}
    >
      <IndexTable.Cell>
        <InlineStack gap="300" align="start" blockAlign="center">
          <Thumbnail source={NoteIcon} size="small" alt={form.formName} />
          <div>
            <Text variant="bodyMd" fontWeight="semibold" as="span">
              {form.formName}
            </Text>
            {form.slug && (
              <div>
                <Text variant="bodySm" tone="subdued" as="span">
                  /{form.slug}
                </Text>
              </div>
            )}
          </div>
        </InlineStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Badge tone={form.isActive ? "success" : "info"}>
          {form.isActive ? "Active" : "Draft"}
        </Badge>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text as="span" numeric>
          {form.submissionsCount}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text as="span" tone="subdued">
          {new Date(form.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <InlineStack gap="200">
          <Button size="slim" url={`/app/forms/${form.id}`}>
            Edit
          </Button>
          <Button size="slim" url={`/app/forms/${form.id}/submissions`}>
            Submissions
          </Button>
          <Button
            size="slim"
            tone="critical"
            onClick={() => onDelete?.(form.id)}
          >
            Delete
          </Button>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={forms.length}
      selectedItemsCount={
        allResourcesSelected ? "All" : selectedResources.length
      }
      onSelectionChange={handleSelectionChange}
      headings={[
        { title: "Form name" },
        { title: "Status" },
        { title: "Submissions" },
        { title: "Created" },
        { title: "Actions" },
      ]}
    >
      {rowMarkup}
    </IndexTable>
  );
}