// // import { useState } from "react";
// // import type { ActionFunctionArgs } from "@remix-run/node";
// // import { json } from "@remix-run/node";
// // import { useFetcher } from "@remix-run/react";
// // import {
// //   Page,
// //   Layout,
// //   Card,
// //   Button,
// //   TextField,
// //   BlockStack,
// //   InlineStack,
// //   Text,
// // } from "@shopify/polaris";

// // import { FieldPalette } from "../components/FormBuilder/FieldPalette";
// // import { FieldEditor } from "../components/FormBuilder/FieldEditor";
// // import { authenticate } from "../shopify.server";
// // import db from "../db.server";

// // // ---------------- ACTION (save form) ----------------
// // export const action = async ({ request }: ActionFunctionArgs) => {
// //   const { session } = await authenticate.admin(request);
// //   const body = await request.json();

// //   const { formName, fields, settings } = body;

// //   const form = await db.formConfig.create({
// //     data: {
// //       formName,
// //       shop: session.shop,
// //       fields: JSON.stringify(fields),
// //       settings: JSON.stringify(settings),
// //     },
// //   });

// //   return json({ success: true, formId: form.id });
// // };

// // // ---------------- COMPONENT ----------------
// // export default function NewForm() {
// //   const fetcher = useFetcher();

// //   const [formName, setFormName] = useState("Untitled Form");
// //   const [fields, setFields] = useState<any[]>([]);
// //   const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);

// //   const [settings, setSettings] = useState({
// //     submitLabel: "Submit",
// //     successMessage: "Form submitted successfully!",
// //     notifyOnSubmit: false,
// //     recipientEmail: "",
// //   });

// //   // Add new field from palette
// //   const handleAddField = (field: any) => {
// //     setFields((prev) => [...prev, field]);
// //   };

// //   // Update field
// //   const handleUpdateField = (updatedField: any) => {
// //     if (selectedFieldIndex === null) return;

// //     const newFields = [...fields];
// //     newFields[selectedFieldIndex] = updatedField;
// //     setFields(newFields);
// //   };

// //   // Delete field
// //   const handleDeleteField = () => {
// //     if (selectedFieldIndex === null) return;

// //     const newFields = fields.filter((_, i) => i !== selectedFieldIndex);
// //     setFields(newFields);
// //     setSelectedFieldIndex(null);
// //   };

// //   // Save form
// //   const handleSave = () => {
// //     fetcher.submit(
// //       {
// //         formName,
// //         fields: JSON.stringify(fields),
// //         settings: JSON.stringify(settings),
// //       },
// //       {
// //         method: "POST",
// //         encType: "application/json",
// //       }
// //     );
// //   };

// //   return (
// //     <Page
// //       title="Create Form"
// //       primaryAction={{
// //         content: "Save Form",
// //         onAction: handleSave,
// //         loading: fetcher.state !== "idle",
// //       }}
// //     >
// //       <Layout>
// //         {/* LEFT: Field Palette */}
// //         <Layout.Section oneThird>
// //           <Card>
// //             <BlockStack gap="300">
// //               <Text variant="headingMd">Add Fields</Text>

// //               <FieldPalette onAddField={handleAddField} />
// //             </BlockStack>
// //           </Card>
// //         </Layout.Section>

// //         {/* CENTER: Form Preview */}
// //         <Layout.Section>
// //           <Card>
// //             <BlockStack gap="300">
// //               <TextField
// //                 label="Form Name"
// //                 value={formName}
// //                 onChange={setFormName}
// //                 autoComplete="off"
// //               />

// //               <Text variant="headingSm">Form Preview</Text>

// //               {fields.length === 0 && (
// //                 <Text tone="subdued">No fields added yet</Text>
// //               )}

// //               <BlockStack gap="200">
// //                 {fields.map((field, index) => (
// //                   <div
// //                     key={index}
// //                     style={{
// //                       padding: "10px",
// //                       border:
// //                         selectedFieldIndex === index
// //                           ? "2px solid #5C6AC4"
// //                           : "1px solid #ddd",
// //                       borderRadius: "8px",
// //                       cursor: "pointer",
// //                     }}
// //                     onClick={() => setSelectedFieldIndex(index)}
// //                   >
// //                     <Text fontWeight="medium">{field.label}</Text>
// //                     <Text tone="subdued">{field.type}</Text>
// //                   </div>
// //                 ))}
// //               </BlockStack>
// //             </BlockStack>
// //           </Card>
// //         </Layout.Section>

// //         {/* RIGHT: Field Editor */}
// //         <Layout.Section oneThird>
// //           <Card>
// //             <BlockStack gap="300">
// //               <Text variant="headingMd">Field Settings</Text>

// //               {selectedFieldIndex !== null ? (
// //                 <FieldEditor
// //                   field={fields[selectedFieldIndex]}
// //                   onChange={handleUpdateField}
// //                   onDelete={handleDeleteField}
// //                 />
// //               ) : (
// //                 <Text tone="subdued">Select a field to edit</Text>
// //               )}
// //             </BlockStack>
// //           </Card>

// //           {/* FORM SETTINGS */}
// //           <Card>
// //             <BlockStack gap="300">
// //               <Text variant="headingMd">Form Settings</Text>

// //               <TextField
// //                 label="Submit Button Label"
// //                 value={settings.submitLabel}
// //                 onChange={(val) =>
// //                   setSettings((prev) => ({ ...prev, submitLabel: val }))
// //                 }
// //                 autoComplete="off"
// //               />

// //               <TextField
// //                 label="Success Message"
// //                 value={settings.successMessage}
// //                 onChange={(val) =>
// //                   setSettings((prev) => ({ ...prev, successMessage: val }))
// //                 }
// //                 autoComplete="off"
// //               />

// //               <TextField
// //                 label="Notification Email"
// //                 value={settings.recipientEmail}
// //                 onChange={(val) =>
// //                   setSettings((prev) => ({ ...prev, recipientEmail: val }))
// //                 }
// //                 autoComplete="off"
// //               />
// //             </BlockStack>
// //           </Card>
// //         </Layout.Section>
// //       </Layout>
// //     </Page>
// //   );
// // }



// // import db from "../db.server";
// import { useAppBridge } from "@shopify/app-bridge-react";
// import { useState, useCallback } from "react";
// import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
// import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
// import { authenticate } from "../shopify.server";
// import { createForm} from "../models/form.server";
// import type { FormField, FormSettings } from "../models/form.server";
// import { v4 as uuidv4 } from "uuid";
// import {
//   Page, Layout, Card, Text, BlockStack, InlineStack,
//   Button, TextField, Select, Checkbox, Badge,
//   Tabs, Divider, Box, Banner,
// } from "@shopify/polaris";
// import { DeleteIcon } from "@shopify/polaris-icons";

// // ── Types ─────────────────────────────────────────────────────────────────────
// type DesignSettings = {
//   bgType: "transparent" | "color";
//   bgColor: string;
//   borderColor: string;
//   borderRadius: string;
//   borderSize: string;
//   formWidth: string;
//   formPadding: string;
//   buttonBg: string;
//   buttonText: string;
//   buttonTextColor: string;
//   buttonAlignment: "full" | "left" | "center" | "right";
//   labelFontSize: string;
//   labelColor: string;
//   inputBg: string;
//   inputBorderColor: string;
//   inputBorderRadius: string;
//   labelStyle: "block" | "inline" | "floating";
// };

// // ── Loader ────────────────────────────────────────────────────────────────────
// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   await authenticate.admin(request);
//   return json({});
// };

// // ── Action ────────────────────────────────────────────────────────────────────
// export const action = async ({ request }: ActionFunctionArgs) => {
//   const { session } = await authenticate.admin(request);
//   const body = await request.formData();

//   const intent = body.get("intent"); // intent to delete

//   const formName = body.get("formName") as string;
//   const fields   = JSON.parse(body.get("fields")   as string) as FormField[];
//   const settings = JSON.parse(body.get("settings") as string) as FormSettings;

//   if (!formName?.trim()) {
//     return json({ error: "Form name is required" }, { status: 422 });
//   }
//   if (fields.length === 0) {
//     return json({ error: "Add at least one field" }, { status: 422 });
//   }

 
//   const form = await createForm(session.shop, formName, fields, settings);
//   return Response.json({ success: true, formId: form.id });
// };

// //  export async function deleteFormm(formId: string) {
// //   return db.formConfig.delete({
// //     where: { id: formId },
// //   });
// // }
// // ── Field type options ────────────────────────────────────────────────────────
// const FIELD_TYPES = [
//   { type: "text",      label: "Single line text", icon: "T"  },
//   { type: "email",     label: "Email address",    icon: "@"  },
//   { type: "phone",     label: "Phone number",     icon: "☎"  },
//   { type: "textarea",  label: "Paragraph text",   icon: "¶"  },
//   { type: "select",    label: "Dropdown",         icon: "▾"  },
//   { type: "checkbox",  label: "Checkbox",         icon: "☑"  },
//   { type: "file",      label: "File upload",      icon: "⬆"  },
// ] as const;

// const defaultSettings: FormSettings = {
//   recipientEmail: "",
//   successMessage: "Thank you! Your form has been submitted.",
//   submitLabel:    "Submit",
//   notifyOnSubmit: true,
// };

// const defaultDesign: DesignSettings = {
//   bgType:          "transparent",
//   bgColor:         "#ffffff",
//   borderColor:     "#000000",
//   borderRadius:    "1",
//   borderSize:      "2",
//   formWidth:       "600px",
//   formPadding:     "30",
//   buttonBg:        "#000000",
//   buttonText:      "Submit",
//   buttonTextColor: "#ffffff",
//   buttonAlignment: "full",
//   labelFontSize:   "14",
//   labelColor:      "#000000",
//   inputBg:         "#ffffff",
//   inputBorderColor:"#000000",
//   inputBorderRadius:"1",
//   labelStyle:      "block",
// };

// // ── Component ─────────────────────────────────────────────────────────────────
// export default function NewForm() {
//   const navigate  = useNavigate();
//   const submit    = useSubmit();
//   const shopify  = useAppBridge();   

//   const [formName,   setFormName]   = useState("My Form");
//   const [fields,     setFields]     = useState<FormField[]>([]);
//   const [settings,   setSettings]   = useState<FormSettings>(defaultSettings);
//   const [design,     setDesign]     = useState<DesignSettings>(defaultDesign);
//   const [activeTab,  setActiveTab]  = useState(0);
//   const [activeDesignTab, setActiveDesignTab] = useState(0);
//   const [error,      setError]      = useState("");
//   const [saving,     setSaving]     = useState(false);
//   const [optionInputs, setOptionInputs] = useState<Record<string, string>>({});
   
//   // ── Field helpers ────────────────────────────────────────────────────────
//   function addField(type: FormField["type"]) {
//     const label = FIELD_TYPES.find(f => f.type === type)?.label ?? type;
//     const newField: FormField = {
//       id:          uuidv4(),
//       type,
//       label:       `${label}`,
//       placeholder: "",
//       required:    false,
//       options:     type === "select" || type === "checkbox" ? ["Option 1", "Option 2"] : undefined,
//     };
//     setFields(prev => [...prev, newField]);
//   }

//   function updateField(id: string, patch: Partial<FormField>) {
//     setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
//   }

//   function deleteField(id: string) {
//     setFields(prev => prev.filter(f => f.id !== id));
//   }

//   function moveField(id: string, dir: "up" | "down") {
//     setFields(prev => {
//       const idx  = prev.findIndex(f => f.id === id);
//       const next = [...prev];
//       const swap = dir === "up" ? idx - 1 : idx + 1;
//       if (swap < 0 || swap >= next.length) return prev;
//       [next[idx], next[swap]] = [next[swap], next[idx]];
//       return next;
//     });
//   }

//   function addOption(fieldId: string) {
//     const val = (optionInputs[fieldId] ?? "").trim();
//     if (!val) return;
//     updateField(fieldId, {
//       options: [...(fields.find(f => f.id === fieldId)?.options ?? []), val],
//     });
//     setOptionInputs(p => ({ ...p, [fieldId]: "" }));
//   }

// //   const handleDelete = async (formId: string) => {
// //   if (!confirm("Are you sure you want to delete this form?")) return;

// //   const fd = new FormData();
// //   fd.append("intent", "delete");
// //   fd.append("formId", formId);

// //   const res = await fetch("/app/formsnew", {
// //     method: "POST",
// //     body: fd,
// //   });

// //   const data = await res.json();

// //   if (data.success) {
// //     // refresh list OR remove item from UI
// //     window.location.reload(); // quick way
// //   } else {
// //     alert("Failed to delete form");
// //   }
// // };
//   const handleDelete = (formId: string) => {
//   if (!confirm("Are you sure you want to delete this form?")) return;

//   const fd = new FormData();
//   fd.append("intent", "delete");
//   fd.append("formId", formId);

//   submit(fd, {
//     method: "post",
//   });
// };
  
//   // ── Save ──────────────────────────────────────────────────────────────────
  

  
  
  
//   async function handleSave(isActive: boolean) {
//     if (!formName.trim()) { setError("Form name is required"); return; }
//     if (fields.length === 0) { setError("Add at least one field"); return; }
//     setError("");
//     setSaving(true);

//     const fd = new FormData();
//     fd.append("formName", formName);
//     fd.append("fields",   JSON.stringify(fields));
//     fd.append("settings", JSON.stringify({ ...settings, isActive }));

//     const res = await fetch("/app/formsnew", { method: "POST", body: fd });
//     const data = await res.json();
//     setSaving(false);

//     if (data.success) {
//       shopify.toast.show("Form saved successfully!");
//       setTimeout(() => navigate("/app"), 1200);
//     } else {
//       setError(data.error ?? "Something went wrong");
//     }
//   }

//   // ── Tabs config ──────────────────────────────────────────────────────────
//   const mainTabs = [
//     { id: "settings",    content: "Form settings"   },
//     { id: "design",      content: "Form design"      },
//     { id: "integration", content: "Form integration" },
//   ];

//   const designTabs = [
//     { id: "heading",  content: "Form heading"  },
//     { id: "elements", content: "Form elements" },
//     { id: "captcha",  content: "Captcha"       },
//     { id: "form",     content: "Form"          },
//     { id: "input",    content: "Input"         },
//     { id: "button",   content: "Submit button" },
//     { id: "layout",   content: "Layout"        },
//   ];

//   const settingsTabs = [
//     { id: "details",  content: "Form details"  },
//   ];

//   // ── Render helpers ───────────────────────────────────────────────────────
//   function renderFieldInput(field: FormField) {
//     switch (field.type) {
//       case "textarea":
//         return <textarea placeholder={field.placeholder} style={inputStyle} rows={3} />;
//       case "select":
//         return (
//           <select style={inputStyle}>
//             <option>Please select</option>
//             {(field.options ?? []).map(o => <option key={o}>{o}</option>)}
//           </select>
//         );
//       case "checkbox":
//         return (
//           <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
//             {(field.options ?? []).map(o => (
//               <label key={o} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
//                 <input type="checkbox" /> {o}
//               </label>
//             ))}
//           </div>
//         );
//       case "file":
//         return <input type="file" style={{ fontSize: 13 }} />;
//       default:
//         return <input type={field.type} placeholder={field.placeholder} style={inputStyle} />;
//     }
//   }

//   const inputStyle: React.CSSProperties = {
//     width: "100%",
//     padding: "8px 10px",
//     border: `${design.inputBorderColor ? 1 : 1}px solid ${design.inputBorderColor}`,
//     borderRadius: `${design.inputBorderRadius}px`,
//     background: design.inputBg,
//     fontSize: 14,
//     fontFamily: "inherit",
//     boxSizing: "border-box",
//   };

//   // ── Left panel content ──────────────────────────────────────────────────
//   function renderSettingsPanel() {
//     return (
//       <BlockStack gap="500">
//         {/* Form name */}
//         <BlockStack gap="200">
//           <Text as="h3" variant="headingSm" fontWeight="semibold">Form details</Text>
//           <TextField
//             label="Form name *"
//             value={formName}
//             onChange={setFormName}
//             autoComplete="off"
//           />
//           <TextField
//             label="Notification email addresses"
//             value={settings.recipientEmail}
//             onChange={v => setSettings(s => ({ ...s, recipientEmail: v }))}
//             placeholder="you@example.com"
//             autoComplete="off"
//           />
//           <TextField
//             label="Success message"
//             value={settings.successMessage}
//             onChange={v => setSettings(s => ({ ...s, successMessage: v }))}
//             autoComplete="off"
//           />
//           <Checkbox
//             label="Notify on submit"
//             checked={settings.notifyOnSubmit}
//             onChange={v => setSettings(s => ({ ...s, notifyOnSubmit: v }))}
//           />
//         </BlockStack>

//         <Divider />

//         {/* Field palette */}
//         <BlockStack gap="300">
//           <Text as="h3" variant="headingSm" fontWeight="semibold">Form elements</Text>
//           <Text as="p" variant="bodySm" tone="subdued">Click to add fields to your form</Text>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
//             {FIELD_TYPES.map(ft => (
//               <button
//                 key={ft.type}
//                 onClick={() => addField(ft.type as FormField["type"])}
//                 style={{
//                   display: "flex", alignItems: "center", gap: 8,
//                   padding: "10px 12px", background: "#fff",
//                   border: "1px solid #E5E7EB", borderRadius: 8,
//                   cursor: "pointer", textAlign: "left", transition: "all .15s",
//                   fontFamily: "inherit",
//                 }}
//                 onMouseEnter={e => (e.currentTarget.style.borderColor = "#5C6AC4")}
//                 onMouseLeave={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
//               >
//                 <span style={{ width: 28, height: 28, borderRadius: 6, background: "#EEF0FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#5C6AC4", flexShrink: 0 }}>
//                   {ft.icon}
//                 </span>
//                 <span style={{ fontSize: 12.5, fontWeight: 500, color: "#111827" }}>{ft.label}</span>
//               </button>
//             ))}
//           </div>
//         </BlockStack>

//         {/* Fields list */}
//         {fields.length > 0 && (
//           <>
//             <Divider />
//             <BlockStack gap="300">
//               <Text as="h3" variant="headingSm" fontWeight="semibold">
//                 Form fields ({fields.length})
//               </Text>
//               {fields.map((field, idx) => (
//                 <div key={field.id} style={{ border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
//                   {/* Field header */}
//                   <div style={{ background: "#F9FAFB", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//                     <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                       <span style={{ fontSize: 12, color: "#6B7280" }}>⠿</span>
//                       <Text as="span" variant="bodySm" fontWeight="semibold">{field.label}</Text>
//                       <Badge>{field.type}</Badge>
//                       {field.required && <Badge tone="attention">Required</Badge>}
//                     </div>
//                     <div style={{ display: "flex", gap: 4 }}>
//                       <button onClick={() => moveField(field.id, "up")} disabled={idx === 0} style={iconBtnStyle}>↑</button>
//                       <button onClick={() => moveField(field.id, "down")} disabled={idx === fields.length - 1} style={iconBtnStyle}>↓</button>
//                       <button onClick={() => deleteField(field.id)} style={{ ...iconBtnStyle, color: "#C0392B" }}>✕</button>
//                     </div>
//                   </div>

//                   {/* Field editor */}
//                   <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
//                     <TextField
//                       label="Label"
//                       value={field.label}
//                       onChange={v => updateField(field.id, { label: v })}
//                       autoComplete="off"
//                     />
//                     {field.type !== "checkbox" && field.type !== "file" && (
//                       <TextField
//                         label="Placeholder"
//                         value={field.placeholder ?? ""}
//                         onChange={v => updateField(field.id, { placeholder: v })}
//                         autoComplete="off"
//                       />
//                     )}
//                     {(field.type === "select" || field.type === "checkbox") && (
//                       <BlockStack gap="200">
//                         <Text as="p" variant="bodySm" fontWeight="semibold">Options</Text>
//                         {(field.options ?? []).map((opt, oi) => (
//                           <InlineStack key={oi} gap="200" blockAlign="center">
//                             <div style={{ flex: 1 }}>
//                               <TextField
//                                 label="" labelHidden value={opt}
//                                 onChange={v => {
//                                   const next = [...(field.options ?? [])];
//                                   next[oi] = v;
//                                   updateField(field.id, { options: next });
//                                 }}
//                                 autoComplete="off"
//                               />
//                             </div>
//                             <Button size="slim" tone="critical" variant="plain"
//                               onClick={() => {
//                                 const next = [...(field.options ?? [])];
//                                 next.splice(oi, 1);
//                                 updateField(field.id, { options: next });
//                               }}
//                             >✕</Button>
//                           </InlineStack>
//                         ))}
//                         <InlineStack gap="200" blockAlign="end">
//                           <div style={{ flex: 1 }}>
//                             <TextField
//                               label="" labelHidden
//                               placeholder="New option…"
//                               value={optionInputs[field.id] ?? ""}
//                               onChange={v => setOptionInputs(p => ({ ...p, [field.id]: v }))}
//                               autoComplete="off"
//                             />
//                           </div>
//                           <Button size="slim" onClick={() => addOption(field.id)}>Add</Button>
//                         </InlineStack>
//                       </BlockStack>
//                     )}
//                     <Checkbox
//                       label="Required"
//                       checked={field.required}
//                       onChange={v => updateField(field.id, { required: v })}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </BlockStack>
//           </>
//         )}
//       </BlockStack>
//     );
//   }

//   function renderDesignPanel() {
//     return (
//       <BlockStack gap="400">
//         <Tabs tabs={designTabs} selected={activeDesignTab} onSelect={setActiveDesignTab} fitted />

//         {activeDesignTab === 0 && (
//           <BlockStack gap="300">
//             <Text as="h3" variant="headingSm">Form heading</Text>
//             <TextField label="Form title" value={formName} onChange={setFormName} autoComplete="off" />
//           </BlockStack>
//         )}

//         {activeDesignTab === 3 && (
//           <BlockStack gap="300">
//             <Text as="h3" variant="headingSm">Background</Text>
//             <Select
//               label="Background type"
//               options={[
//                 { label: "Transparent", value: "transparent" },
//                 { label: "Color",       value: "color"       },
//               ]}
//               value={design.bgType}
//               onChange={v => setDesign(d => ({ ...d, bgType: v as "transparent" | "color" }))}
//             />
//             <TextField label="Form width"   value={design.formWidth}   onChange={v => setDesign(d => ({ ...d, formWidth: v }))}   autoComplete="off" />
//             <TextField label="Form padding" value={design.formPadding} onChange={v => setDesign(d => ({ ...d, formPadding: v }))} autoComplete="off" />
//             <Text as="h3" variant="headingSm">Border</Text>
//             <TextField label="Border radius" value={design.borderRadius} onChange={v => setDesign(d => ({ ...d, borderRadius: v }))} autoComplete="off" />
//             <TextField label="Border size"   value={design.borderSize}   onChange={v => setDesign(d => ({ ...d, borderSize: v }))}   autoComplete="off" />
//           </BlockStack>
//         )}

//         {activeDesignTab === 4 && (
//           <BlockStack gap="300">
//             <Text as="h3" variant="headingSm">Input field</Text>
//             <TextField label="Input border radius" value={design.inputBorderRadius} onChange={v => setDesign(d => ({ ...d, inputBorderRadius: v }))} autoComplete="off" />
//             <Text as="h3" variant="headingSm">Label</Text>
//             <TextField label="Label font size" value={design.labelFontSize} onChange={v => setDesign(d => ({ ...d, labelFontSize: v }))} autoComplete="off" />
//           </BlockStack>
//         )}

//         {activeDesignTab === 5 && (
//           <BlockStack gap="300">
//             <Text as="h3" variant="headingSm">Button position and style</Text>
//             <Select
//               label="Button alignment"
//               options={[
//                 { label: "Full width", value: "full"   },
//                 { label: "Left",       value: "left"   },
//                 { label: "Center",     value: "center" },
//                 { label: "Right",      value: "right"  },
//               ]}
//               value={design.buttonAlignment}
//               onChange={v => setDesign(d => ({ ...d, buttonAlignment: v as DesignSettings["buttonAlignment"] }))}
//             />
//             <TextField label="Submit button text" value={design.buttonText} onChange={v => setDesign(d => ({ ...d, buttonText: v }))} autoComplete="off" />
//           </BlockStack>
//         )}

//         {activeDesignTab === 6 && (
//           <BlockStack gap="300">
//             <Text as="h3" variant="headingSm">Layout settings</Text>
//             <Select
//               label="Select label style"
//               options={[
//                 { label: "Block labels",    value: "block"    },
//                 { label: "Inline labels",   value: "inline"   },
//                 { label: "Floating labels", value: "floating" },
//               ]}
//               value={design.labelStyle}
//               onChange={v => setDesign(d => ({ ...d, labelStyle: v as DesignSettings["labelStyle"] }))}
//             />
//           </BlockStack>
//         )}
//       </BlockStack>
//     );
//   }

//   function renderIntegrationPanel() {
//     return (
//       <BlockStack gap="400">
//         <Banner tone="info">
//           <p>Integrations coming soon — connect your form to email, CRM, and third-party tools.</p>
//         </Banner>
//         <Text as="p" tone="subdued">Available integrations: Email notifications, Google Sheets, Slack, Zapier.</Text>
//       </BlockStack>
//     );
//   }

//   const iconBtnStyle: React.CSSProperties = {
//     background: "none", border: "1px solid #E5E7EB",
//     borderRadius: 6, padding: "3px 7px", cursor: "pointer",
//     fontSize: 12, color: "#6B7280",
//   };

//   const btnWidth = design.buttonAlignment === "full" ? "100%" :
//                    design.buttonAlignment === "center" ? "auto" : "auto";

//   // ── Render ───────────────────────────────────────────────────────────────
//   return (
//     <Page
//       title="Create Form"
//       backAction={{ content: "Dashboard", url: "/app" }}
//       primaryAction={{
//         content: saving ? "Saving…" : "Save & publish",
//         onAction: () => handleSave(true),
//         loading: saving,
//       }}
//       // secondaryActions={[
//       //   { content: "Save as draft", onAction: () => handleSave(false) },
//       // ]}

//       secondaryActions={[
//   {
//     content: "Delete form",
//     destructive: true,
//     onAction: handleDelete,
//   },
//   {
//     content: "Save as draft",
//     onAction: () => handleSave(false),
//   },
// ]}

//     >
//       {error && (
//         <Box paddingBlockEnd="400">
//           <Banner tone="critical"><p>{error}</p></Banner>
//         </Box>
//       )}

//       <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>

//         {/* ── Left: Builder ── */}
//         <Card>
//           <BlockStack gap="400">
//             <Tabs tabs={mainTabs} selected={activeTab} onSelect={setActiveTab} />
//             <Box paddingBlockStart="300">
//               {activeTab === 0 && renderSettingsPanel()}
//               {activeTab === 1 && renderDesignPanel()}
//               {activeTab === 2 && renderIntegrationPanel()}
//             </Box>
//           </BlockStack>
//         </Card>

//         {/* ── Right: Preview ── */}
//         <div style={{ position: "sticky", top: 20 }}>
//           <Card>
//             <BlockStack gap="300">
//               <InlineStack align="space-between">
//                 <Text as="h2" variant="headingMd">Form preview</Text>
//                 <Text as="p" variant="bodySm" tone="subdued">Note: This view is for preview purposes only.</Text>
//               </InlineStack>
//               <Divider />

//               {/* Preview box */}
//               <div style={{
//                 background: design.bgType === "color" ? design.bgColor : "transparent",
//                 border: `${design.borderSize}px solid ${design.borderColor}`,
//                 borderRadius: `${design.borderRadius}px`,
//                 padding: `${design.formPadding}px`,
//                 maxWidth: design.formWidth,
//                 margin: "0 auto",
//                 fontFamily: "sans-serif",
//               }}>
//                 <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>
//                   {formName || "Form Title"}
//                 </h2>

//                 {fields.length === 0 ? (
//                   <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: 13 }}>
//                     Add fields from the left panel to preview your form
//                   </div>
//                 ) : (
//                   <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//                     {fields.map(field => (
//                       <div key={field.id}>
//                         {design.labelStyle !== "floating" && (
//                           <label style={{
//                             display: "block", marginBottom: 6,
//                             fontSize: `${design.labelFontSize}px`,
//                             fontWeight: 500, color: design.labelColor,
//                           }}>
//                             {field.label}
//                             {field.required && <span style={{ color: "red", marginLeft: 2 }}>*</span>}
//                           </label>
//                         )}
//                         {renderFieldInput(field)}
//                       </div>
//                     ))}

//                     {/* Submit button */}
//                     <div style={{
//                       display: "flex",
//                       justifyContent: design.buttonAlignment === "full" ? "stretch" :
//                                       design.buttonAlignment === "center" ? "center" :
//                                       design.buttonAlignment === "right" ? "flex-end" : "flex-start",
//                     }}>
//                       <button style={{
//                         width: design.buttonAlignment === "full" ? "100%" : "auto",
//                         padding: "10px 24px",
//                         background: design.buttonBg,
//                         color: design.buttonTextColor,
//                         border: "none",
//                         borderRadius: `${design.borderRadius}px`,
//                         fontSize: 15,
//                         fontWeight: 600,
//                         cursor: "pointer",
//                         fontFamily: "inherit",
//                       }}>
//                         {design.buttonText || settings.submitLabel || "Submit"}
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </BlockStack>
//           </Card>
//         </div>
//       </div>
//     </Page>
//   );
// }

import { useAppBridge } from "@shopify/app-bridge-react";
import { useState, useEffect, useRef } from "react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useSubmit, useActionData, useNavigation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { createForm } from "../models/form.server";
import type { FormField, FormSettings } from "../models/form.server";
import { v4 as uuidv4 } from "uuid";
import {
  Page, Card, Text, BlockStack, InlineStack,
  Button, TextField, Select, Checkbox, Badge,
  Tabs, Divider, Box, Banner,
} from "@shopify/polaris";

/* ═══════════════════════════════════════════════════════════════════════════
   COLOR PICKER + RADIO GROUP helpers
   ═══════════════════════════════════════════════════════════════════════ */
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Text as="p" variant="bodySm" fontWeight="semibold">{label}</Text>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 36, height: 36, border: "1px solid #D1D5DB", borderRadius: 6, padding: 2, cursor: "pointer", background: "#fff" }} />
        <div style={{ flex: 1 }}>
          <TextField label="" labelHidden value={value} onChange={onChange} autoComplete="off" />
        </div>
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange }: {
  label: string; options: { label: string; value: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <Text as="p" variant="bodySm" fontWeight="semibold">{label}</Text>
      <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
        {options.map(o => (
          <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
            <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)} style={{ accentColor: "#5C6AC4" }} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */
type DesignSettings = {
  bgType: "transparent" | "color" | "gradient" | "image";
  bgColor: string; bgColor2: string; bgShadow: string;
  formWidth: string; formPadding: string;
  borderColor: string; borderRadius: string; borderSize: string;
  inputBg: string; inputBorderColor: string; inputBorderFocusColor: string;
  inputBorderRadius: string; inputFontSize: string; inputFontColor: string;
  inputPlaceholderColor: string;
  labelFontSize: string; labelColor: string;
  labelStyle: "block" | "inline" | "floating";
  buttonBg: string; buttonText: string; buttonTextColor: string;
  buttonAlignment: "full" | "left" | "center" | "right";
  buttonFontSize: string; buttonBorderColor: string;
  buttonBorderRadius: string; buttonBorderWidth: string;
  formBannerUrl: string; formBannerHeight: string;
  formBannerWidth: string; formBannerAlignment: "left" | "center" | "right";
  formDescription: string;
};

/* ═══════════════════════════════════════════════════════════════════════════
   LOADER / ACTION
   ═══════════════════════════════════════════════════════════════════════ */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

// export const action = async ({ request }: ActionFunctionArgs) => {
//   const { session } = await authenticate.admin(request);
//   try {
//     const body      = await request.formData();
//     const formName  = body.get("formName") as string;
//     const fields    = JSON.parse(body.get("fields") as string) as FormField[];
//     const rawSettings = JSON.parse(body.get("settings") as string);
//     const { isActive, ...settings } = rawSettings;

//     if (!formName?.trim()) return json({ error: "Form name is required" }, { status: 422 });
//     if (!fields || fields.length === 0) return json({ error: "Add at least one field" }, { status: 422 });

//     await createForm(session.shop, formName, fields, settings, isActive ?? false);

//     // ✅ Server-side redirect with ?created=1 so My Forms page can show the toast
//     return redirect("/app/formsly?created=1");
//   } catch (error) {
//     console.error("🔥 FORM SAVE ERROR:", error);
//     return json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
//   }
// };


export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  try {
    const body     = await request.formData();
    const formName = body.get("formName") as string;
    const fields   = JSON.parse(body.get("fields") as string) as FormField[];
    const rawSettings = JSON.parse(body.get("settings") as string);

    // ✅ Extract all three — design was being left behind before
    const { isActive, design, ...settings } = rawSettings;

    if (!formName?.trim()) return json({ error: "Form name is required" }, { status: 422 });
    if (!fields || fields.length === 0) return json({ error: "Add at least one field" }, { status: 422 });

    // ✅ Call with the object shape that createForm actually expects
    await createForm(session.shop, formName, fields, {
      settings,
      design,
      isActive: isActive === true, // strict boolean — "Save & publish" passes true
    });

    return redirect("/app/formsly?created=1");
  } catch (error) {
    console.error("🔥 FORM SAVE ERROR:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */
const FIELD_TYPES = [
  { type: "text",     label: "Single line text", icon: "T" },
  { type: "email",    label: "Email address",    icon: "@" },
  { type: "phone",    label: "Phone number",     icon: "☎" },
  { type: "textarea", label: "Paragraph text",   icon: "¶" },
  { type: "select",   label: "Dropdown",         icon: "▾" },
  { type: "checkbox", label: "Checkbox",         icon: "☑" },
  { type: "file",     label: "File upload",      icon: "⬆" },
] as const;



const defaultSettings: FormSettings = {
  recipientEmail: "", successMessage: "Thank you! Your form has been submitted.",
  submitLabel: "Submit", notifyOnSubmit: true,
};

const defaultDesign: DesignSettings = {
  bgType: "transparent", bgColor: "#ffffff", bgColor2: "#f0f0f0",
  bgShadow: "none", formWidth: "600px", formPadding: "30",
  borderColor: "#000000", borderRadius: "1", borderSize: "2",
  inputBg: "#ffffff", inputBorderColor: "#000000", inputBorderFocusColor: "#5C6AC4",
  inputBorderRadius: "1", inputFontSize: "14", inputFontColor: "#000000",
  inputPlaceholderColor: "#9CA3AF",
  labelFontSize: "14", labelColor: "#000000", labelStyle: "block",
  buttonBg: "#000000", buttonText: "Submit", buttonTextColor: "#ffffff",
  buttonAlignment: "full", buttonFontSize: "16",
  buttonBorderColor: "#000000", buttonBorderRadius: "2", buttonBorderWidth: "1",
  formBannerUrl: "", formBannerHeight: "200", formBannerWidth: "100%",
  formBannerAlignment: "center", formDescription: "",
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function NewForm() {
 
  const [bannerFile, setBannerFile] = useState<File | null>(null);
const [bannerPreview, setBannerPreview] = useState<string>("");
 
  const submit     = useSubmit();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const shopify    = useAppBridge();

  const saving = navigation.state === "submitting";

  const [formName, setFormName] = useState("My Form");
  const [fields, setFields]     = useState<FormField[]>([]);
  const [settings, setSettings] = useState<FormSettings>(defaultSettings);
  const [design, setDesign]     = useState<DesignSettings>(defaultDesign);
  const [activeTab, setActiveTab] = useState(0);
  const [activeDesignTab, setActiveDesignTab] = useState(0);
  const [error, setError]       = useState("");
  const [optionInputs, setOptionInputs] = useState<Record<string, string>>({});
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [showAddElement, setShowAddElement]   = useState(false);

  // Add this ref near your other state declarations
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const d = design;
  const setD = (patch: Partial<DesignSettings>) => setDesign(prev => ({ ...prev, ...patch }));

  // ── Only handle errors here — success is handled by server redirect ──
  useEffect(() => {
    if (!actionData) return;
    if ((actionData as any).error) {
      setError((actionData as any).error);
    }
  }, [actionData]);

  // ── Field helpers ────────────────────────────────────────────────────
  function addField(type: FormField["type"]) {
    const label = FIELD_TYPES.find(f => f.type === type)?.label ?? type;
    const nf: FormField = {
      id: uuidv4(), type, label, placeholder: "", required: false,
      halfWidth: false, fieldInCenter: false,
      sendSubmissionEmail: false, emailValidation: false,
      options: type === "select" || type === "checkbox" ? ["Option 1", "Option 2"] : undefined,
    };
    setFields(prev => [...prev, nf]);
    setExpandedFieldId(nf.id);
    setShowAddElement(false);
  }
  function updateField(id: string, patch: Partial<FormField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }
  function deleteField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id));
    if (expandedFieldId === id) setExpandedFieldId(null);
  }
  function moveField(id: string, dir: "up" | "down") {
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id);
      const next = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }
  function addOption(fid: string) {
    const val = (optionInputs[fid] ?? "").trim();
    if (!val) return;
    updateField(fid, { options: [...(fields.find(f => f.id === fid)?.options ?? []), val] });
    setOptionInputs(p => ({ ...p, [fid]: "" }));
  }

  // ── Save ─────────────────────────────────────────────────────────────
  function handleSave(isActive: boolean) {
    if (!formName.trim()) { setError("Form name is required"); return; }
    if (fields.length === 0) { setError("Add at least one field"); return; }
    setError("");
    const fd = new FormData();
    fd.append("formName", formName);
    fd.append("fields", JSON.stringify(fields));
    fd.append("settings", JSON.stringify({ ...settings, design, isActive }));
    submit(fd, { method: "POST" });
  }

  // ── Tabs ─────────────────────────────────────────────────────────────
  const mainTabs = [
    { id: "settings",    content: "Form settings" },
    { id: "design",      content: "Form design" },
    { id: "integration", content: "Form integration" },
  ];
  const designTabs = [
    { id: "heading",  content: "Form heading" },
    { id: "elements", content: "Form elements" },
    { id: "captcha",  content: "Captcha" },
    { id: "form",     content: "Form" },
    { id: "input",    content: "Input" },
    { id: "button",   content: "Submit button" },
    { id: "layout",   content: "Layout" },
  ];

  // ── Styles ───────────────────────────────────────────────────────────
  const pInput: React.CSSProperties = {
    width: "100%", padding: "8px 10px",
    border: `1px solid ${d.inputBorderColor}`,
    borderRadius: `${d.inputBorderRadius}px`,
    background: d.inputBg, fontSize: Number(d.inputFontSize),
    fontFamily: "inherit", boxSizing: "border-box", color: d.inputFontColor,
  };
  const iconBtn: React.CSSProperties = {
    background: "none", border: "1px solid #E5E7EB",
    borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontSize: 12, color: "#6B7280",
  };

  // ── Preview field ────────────────────────────────────────────────────
  function renderPreview(field: FormField) {
    switch (field.type) {
      case "textarea":   return <textarea placeholder={field.placeholder} style={pInput} rows={3} />;
      case "select":     return <select style={pInput}><option>Please select</option>{(field.options??[]).map(o=><option key={o}>{o}</option>)}</select>;
      case "checkbox":   return <div style={{display:"flex",flexDirection:"column",gap:4}}>{(field.options??[]).map(o=><label key={o} style={{display:"flex",gap:8,alignItems:"center",fontSize:14,color:d.inputFontColor}}><input type="checkbox"/>{o}</label>)}</div>;
      case "file":       return <input type="file" style={{fontSize:13}} />;
      default:           return <input type={field.type} placeholder={field.placeholder} style={pInput} />;
    }
  }

  /* ═════════════════════════════════════════════════════════════════════
     TAB: FORM SETTINGS
     ═════════════════════════════════════════════════════════════════ */
  function renderSettingsPanel() {
    return (
      <BlockStack gap="500">
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm" fontWeight="semibold">Form details</Text>
          <TextField label="Form name *" value={formName} onChange={setFormName} autoComplete="off" />
          <TextField label="Notification email" value={settings.recipientEmail}
            onChange={v => setSettings(s => ({...s, recipientEmail: v}))} placeholder="you@example.com" autoComplete="off" />
          <TextField label="Success message" value={settings.successMessage}
            onChange={v => setSettings(s => ({...s, successMessage: v}))} autoComplete="off" />
          <Checkbox label="Notify on submit" checked={settings.notifyOnSubmit}
            onChange={v => setSettings(s => ({...s, notifyOnSubmit: v}))} />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="semibold">Form elements</Text>
          <Text as="p" variant="bodySm" tone="subdued">Click to add fields</Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {FIELD_TYPES.map(ft => (
              <button key={ft.type} onClick={() => addField(ft.type as FormField["type"])}
                style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#fff",
                  border:"1px solid #E5E7EB",borderRadius:8,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s" }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="#5C6AC4")}
                onMouseLeave={e=>(e.currentTarget.style.borderColor="#E5E7EB")}>
                <span style={{width:28,height:28,borderRadius:6,background:"#EEF0FB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#5C6AC4",flexShrink:0}}>{ft.icon}</span>
                <span style={{fontSize:12.5,fontWeight:500,color:"#111827"}}>{ft.label}</span>
              </button>
            ))}
          </div>
        </BlockStack>
        {fields.length > 0 && (
          <><Divider /><BlockStack gap="200">
            <Text as="h3" variant="headingSm" fontWeight="semibold">Form fields ({fields.length})</Text>
            {fields.map(f => (
              <div key={f.id} style={{padding:"8px 12px",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <Text as="span" variant="bodySm" fontWeight="semibold">{f.label}</Text>
                  <Badge>{f.type}</Badge>
                  {f.required && <Badge tone="attention">Required</Badge>}
                  {f.halfWidth && <Badge tone="info">½</Badge>}
                </div>
                <button onClick={()=>deleteField(f.id)} style={{...iconBtn,color:"#C0392B"}}>✕</button>
              </div>
            ))}
          </BlockStack></>
        )}
      </BlockStack>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════
     TAB: FORM HEADING
     ═════════════════════════════════════════════════════════════════ */
  // function renderHeadingTab() {
  //   return (
  //     <BlockStack gap="500">
  //       <BlockStack gap="300">
  //         <Text as="h3" variant="headingSm" fontWeight="semibold">Form banner</Text>
  //         <TextField label="Banner image URL" value={d.formBannerUrl} onChange={v=>setD({formBannerUrl:v})} placeholder="https://..." autoComplete="off" />
  //         <Button variant="secondary" onClick={()=>{}}>Add Image</Button>
  //       </BlockStack>
  //       <Divider />
  //       <BlockStack gap="300">
  //         <Text as="h3" variant="headingSm" fontWeight="semibold">Form title</Text>
  //         <TextField label="Title" value={formName} onChange={setFormName} autoComplete="off" multiline={2} />
  //       </BlockStack>
  //       <Divider />
  //       <BlockStack gap="300">
  //         <Text as="h3" variant="headingSm" fontWeight="semibold">Description</Text>
  //         <TextField label="Description" value={d.formDescription} onChange={v=>setD({formDescription:v})} placeholder="Add a description..." autoComplete="off" multiline={4} />
  //       </BlockStack>
  //       <Divider />
  //       <BlockStack gap="300">
  //         <Text as="h3" variant="headingSm" fontWeight="semibold">Position and size</Text>
  //         <TextField label="Image height" value={d.formBannerHeight} onChange={v=>setD({formBannerHeight:v})} autoComplete="off" suffix="px" />
  //         <TextField label="Image width" value={d.formBannerWidth} onChange={v=>setD({formBannerWidth:v})} autoComplete="off" />
  //         <RadioGroup label="Image alignment" value={d.formBannerAlignment}
  //           options={[{label:"Left",value:"left"},{label:"Center",value:"center"},{label:"Right",value:"right"}]}
  //           onChange={v=>setD({formBannerAlignment:v as any})} />
  //       </BlockStack>
  //     </BlockStack>
  //   );
  // }

function renderHeadingTab() {
  function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setBannerPreview(dataUrl);
      setD({ formBannerUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveBanner() {
    setBannerFile(null);
    setBannerPreview("");
    setD({ formBannerUrl: "" });
    // Reset input so same file can be re-selected
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }

  return (
    <BlockStack gap="500">
      <BlockStack gap="300">
        <Text as="h3" variant="headingSm" fontWeight="semibold">Form banner</Text>

        {/* ── Hidden real file input ── */}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          style={{ display: "none" }}
        />

        {/* ── Preview or upload area ── */}
        {bannerPreview ? (
          <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB" }}>
            <div style={{ position: "relative" }}>
              <img
                src={bannerPreview}
                alt="Banner preview"
                style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
              />
              <button
                type="button"
                onClick={handleRemoveBanner}
                style={{
                  position: "absolute", top: 8, right: 8,
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  border: "none", borderRadius: 6, padding: "4px 10px",
                  cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                }}
              >
                ✕ Remove
              </button>
            </div>
            <div style={{ padding: "8px 12px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB" }}>
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#5C6AC4", fontSize: 13, fontFamily: "inherit",
                  fontWeight: 500, padding: 0,
                }}
              >
                🔄 Replace image
              </button>
              {bannerFile && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {bannerFile.name} ({(bannerFile.size / 1024).toFixed(1)} KB)
                </Text>
              )}
            </div>
          </div>
        ) : (
          <div
            onClick={() => bannerInputRef.current?.click()}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 8, padding: "32px 16px",
              border: "2px dashed #D1D5DB", borderRadius: 8,
              cursor: "pointer", background: "#F9FAFB",
              transition: "border-color .15s, background .15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#5C6AC4";
              e.currentTarget.style.background = "#EEF0FB";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#D1D5DB";
              e.currentTarget.style.background = "#F9FAFB";
            }}
          >
            <span style={{ fontSize: 32 }}>🖼️</span>
            <Text as="p" variant="bodySm" fontWeight="semibold">Click to upload banner image</Text>
            <Text as="p" variant="bodySm" tone="subdued">PNG, JPG, GIF, WebP supported</Text>
            <div style={{
              marginTop: 4, padding: "6px 16px",
              background: "#5C6AC4", color: "#fff",
              borderRadius: 6, fontSize: 13, fontWeight: 500,
            }}>
              Browse files
            </div>
          </div>
        )}
      </BlockStack>

      <Divider />
      <BlockStack gap="300">
        <Text as="h3" variant="headingSm" fontWeight="semibold">Form title</Text>
        <TextField label="Title" value={formName} onChange={setFormName} autoComplete="off" multiline={2} />
      </BlockStack>
      <Divider />
      <BlockStack gap="300">
        <Text as="h3" variant="headingSm" fontWeight="semibold">Description</Text>
        <TextField label="Description" value={d.formDescription} onChange={v=>setD({formDescription:v})} placeholder="Add a description..." autoComplete="off" multiline={4} />
      </BlockStack>
      <Divider />
      <BlockStack gap="300">
        <Text as="h3" variant="headingSm" fontWeight="semibold">Position and size</Text>
        <TextField label="Image height" value={d.formBannerHeight} onChange={v=>setD({formBannerHeight:v})} autoComplete="off" suffix="px" />
        <TextField label="Image width" value={d.formBannerWidth} onChange={v=>setD({formBannerWidth:v})} autoComplete="off" />
        <RadioGroup label="Image alignment" value={d.formBannerAlignment}
          options={[{label:"Left",value:"left"},{label:"Center",value:"center"},{label:"Right",value:"right"}]}
          onChange={v=>setD({formBannerAlignment:v as any})} />
      </BlockStack>
    </BlockStack>
  );
}

  /* ═════════════════════════════════════════════════════════════════════
     TAB: FORM ELEMENTS
     ═════════════════════════════════════════════════════════════════ */
  function renderElementsTab() {
    return (
      <BlockStack gap="400">
        {fields.length===0 && (
          <div style={{padding:"40px 20px",textAlign:"center",color:"#9CA3AF",fontSize:13,border:"2px dashed #E5E7EB",borderRadius:8}}>
            No fields yet. Click "Add element" below.
          </div>
        )}
        {fields.map((field, idx) => {
          const isExp = expandedFieldId === field.id;
          const ft = FIELD_TYPES.find(f=>f.type===field.type);
          return (
            <div key={field.id} style={{border:"1px solid #D1D5DB",borderRadius:8,overflow:"hidden",background:"#fff"}}>
              <div onClick={()=>setExpandedFieldId(isExp?null:field.id)}
                style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:isExp?"#F9FAFB":"#fff",borderBottom:isExp?"1px solid #E5E7EB":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    <button onClick={e=>{e.stopPropagation();moveField(field.id,"up")}} disabled={idx===0} style={{...iconBtn,padding:"1px 5px",fontSize:10,border:"none"}}>▲</button>
                    <button onClick={e=>{e.stopPropagation();moveField(field.id,"down")}} disabled={idx===fields.length-1} style={{...iconBtn,padding:"1px 5px",fontSize:10,border:"none"}}>▼</button>
                  </div>
                  <span style={{width:24,height:24,borderRadius:4,background:"#EEF0FB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#5C6AC4"}}>{ft?.icon??"?"}</span>
                  <Text as="span" variant="bodyMd" fontWeight="semibold">{ft?.label??field.type} ({field.label})</Text>
                </div>
                <button onClick={e=>{e.stopPropagation();deleteField(field.id)}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#9CA3AF",padding:"4px 8px"}}>🗑</button>
              </div>
              {isExp && (
                <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:20}}>
                  <BlockStack gap="300">
                    <Text as="h4" variant="headingSm" fontWeight="semibold">Details</Text>
                    <TextField label="Field label" value={field.label} onChange={v=>updateField(field.id,{label:v})} autoComplete="off" />
                    {field.type!=="checkbox"&&field.type!=="file"&&(
                      <TextField label="Placeholder" value={field.placeholder??""} onChange={v=>updateField(field.id,{placeholder:v})} autoComplete="off" />
                    )}
                  </BlockStack>
                  {(field.type==="select"||field.type==="checkbox")&&(
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" fontWeight="semibold">Options</Text>
                      {(field.options??[]).map((opt,oi)=>(
                        <InlineStack key={oi} gap="200" blockAlign="center">
                          <div style={{flex:1}}><TextField label="" labelHidden value={opt} onChange={v=>{const n=[...(field.options??[])];n[oi]=v;updateField(field.id,{options:n})}} autoComplete="off" /></div>
                          <Button size="slim" tone="critical" variant="plain" onClick={()=>{const n=[...(field.options??[])];n.splice(oi,1);updateField(field.id,{options:n})}}>✕</Button>
                        </InlineStack>
                      ))}
                      <InlineStack gap="200" blockAlign="end">
                        <div style={{flex:1}}><TextField label="" labelHidden placeholder="New option…" value={optionInputs[field.id]??""} onChange={v=>setOptionInputs(p=>({...p,[field.id]:v}))} autoComplete="off" /></div>
                        <Button size="slim" onClick={()=>addOption(field.id)}>Add</Button>
                      </InlineStack>
                    </BlockStack>
                  )}
                  {field.type==="email"&&(
                    <><Divider /><Checkbox label="Send submission email to user" checked={field.sendSubmissionEmail??false} onChange={v=>updateField(field.id,{sendSubmissionEmail:v})} helpText="Send a copy to this email" /></>
                  )}
                  <Divider />
                  <BlockStack gap="300">
                    <Text as="h4" variant="headingSm" fontWeight="semibold">Field layout settings</Text>
                    <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                      <Checkbox label="Half width" checked={field.halfWidth??false} onChange={v=>updateField(field.id,{halfWidth:v})} />
                      <Checkbox label="Required" checked={field.required} onChange={v=>updateField(field.id,{required:v})} />
                    </div>
                    <Checkbox label="Field in center" checked={field.fieldInCenter??false} onChange={v=>updateField(field.id,{fieldInCenter:v})} />
                  </BlockStack>
                  {field.type==="email"&&(
                    <><Divider /><BlockStack gap="200"><Text as="h4" variant="headingSm" fontWeight="semibold">Validation</Text><Checkbox label="Add email validation field" checked={field.emailValidation??false} onChange={v=>updateField(field.id,{emailValidation:v})} /></BlockStack></>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div style={{position:"relative"}}>
          <Button variant="plain" onClick={()=>setShowAddElement(!showAddElement)}>+ Add element</Button>
          {showAddElement && (
            <div style={{position:"absolute",top:"100%",left:0,zIndex:10,marginTop:4,background:"#fff",border:"1px solid #D1D5DB",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,0.1)",padding:8,minWidth:220}}>
              {FIELD_TYPES.map(ft=>(
                <button key={ft.type} onClick={()=>addField(ft.type as FormField["type"])}
                  style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 10px",background:"none",border:"none",borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"inherit",textAlign:"left"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="#F3F4F6")}
                  onMouseLeave={e=>(e.currentTarget.style.background="none")}>
                  <span style={{width:24,height:24,borderRadius:4,background:"#EEF0FB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#5C6AC4"}}>{ft.icon}</span>
                  {ft.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </BlockStack>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════
     TAB: FORM
     ═════════════════════════════════════════════════════════════════ */
  function renderFormTab() {
    return (
      <BlockStack gap="500">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Background</Text>
          <RadioGroup label="Background type" value={d.bgType}
            options={[{label:"Transparent",value:"transparent"},{label:"Color",value:"color"},{label:"Gradient",value:"gradient"}
              // ,{label:"Image",value:"image"}
            ]}
            onChange={v=>setD({bgType:v as any})} />
          {(d.bgType==="color"||d.bgType==="gradient")&&<ColorInput label="Background color" value={d.bgColor} onChange={v=>setD({bgColor:v})} />}
          {d.bgType==="gradient"&&<ColorInput label="Gradient end color" value={d.bgColor2} onChange={v=>setD({bgColor2:v})} />}
          <Select label="Background shadow" options={[
            {label:"None",value:"none"},{label:"Small",value:"0 1px 3px rgba(0,0,0,0.12)"},
            {label:"Medium",value:"0 4px 12px rgba(0,0,0,0.15)"},{label:"Large",value:"0 8px 24px rgba(0,0,0,0.2)"},
          ]} value={d.bgShadow} onChange={v=>setD({bgShadow:v})} />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Position</Text>
          <TextField label="Form width" value={d.formWidth} onChange={v=>setD({formWidth:v})} autoComplete="off"
            helpText="Provide width in % (e.g. 100%) or fixed width (e.g. 600px)." />
          <TextField label="Form padding" value={d.formPadding} onChange={v=>setD({formPadding:v})} autoComplete="off" />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Border</Text>
          <ColorInput label="Form border color" value={d.borderColor} onChange={v=>setD({borderColor:v})} />
          <TextField label="Form border radius" value={d.borderRadius} onChange={v=>setD({borderRadius:v})} autoComplete="off" prefix="↺" />
          <TextField label="Form border size" value={d.borderSize} onChange={v=>setD({borderSize:v})} autoComplete="off" prefix="↺" />
        </BlockStack>
      </BlockStack>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════
     TAB: INPUT
     ═════════════════════════════════════════════════════════════════ */
  function renderInputTab() {
    return (
      <BlockStack gap="500">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Input field</Text>
          <ColorInput label="Input background color" value={d.inputBg} onChange={v=>setD({inputBg:v})} />
          <ColorInput label="Input border color" value={d.inputBorderColor} onChange={v=>setD({inputBorderColor:v})} />
          <ColorInput label="Input border color on focus" value={d.inputBorderFocusColor} onChange={v=>setD({inputBorderFocusColor:v})} />
          <TextField label="Input border radius" value={d.inputBorderRadius} onChange={v=>setD({inputBorderRadius:v})} autoComplete="off" />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Input field font</Text>
          <TextField label="Input font size" value={d.inputFontSize} onChange={v=>setD({inputFontSize:v})} autoComplete="off" prefix="A" />
          <ColorInput label="Input font color" value={d.inputFontColor} onChange={v=>setD({inputFontColor:v})} />
          <ColorInput label="Input placeholder color" value={d.inputPlaceholderColor} onChange={v=>setD({inputPlaceholderColor:v})} />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Label</Text>
          <TextField label="Label font size" value={d.labelFontSize} onChange={v=>setD({labelFontSize:v})} autoComplete="off" prefix="A" />
          <ColorInput label="Label font color" value={d.labelColor} onChange={v=>setD({labelColor:v})} />
        </BlockStack>
      </BlockStack>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════
     TAB: SUBMIT BUTTON
     ═════════════════════════════════════════════════════════════════ */
  function renderButtonTab() {
    return (
      <BlockStack gap="500">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Button position and style</Text>
          <RadioGroup label="Button alignment" value={d.buttonAlignment}
            options={[{label:"Full width",value:"full"},{label:"Left",value:"left"},{label:"Center",value:"center"},{label:"Right",value:"right"}]}
            onChange={v=>setD({buttonAlignment:v as any})} />
          <ColorInput label="Button background color" value={d.buttonBg} onChange={v=>setD({buttonBg:v})} />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Button text</Text>
          <TextField label="Submit button text" value={d.buttonText} onChange={v=>setD({buttonText:v})} autoComplete="off" />
          <ColorInput label="Button text color" value={d.buttonTextColor} onChange={v=>setD({buttonTextColor:v})} />
          <TextField label="Button font size" value={d.buttonFontSize} onChange={v=>setD({buttonFontSize:v})} autoComplete="off" prefix="A" />
        </BlockStack>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Border style</Text>
          <ColorInput label="Button border color" value={d.buttonBorderColor} onChange={v=>setD({buttonBorderColor:v})} />
          <TextField label="Border radius" value={d.buttonBorderRadius} onChange={v=>setD({buttonBorderRadius:v})} autoComplete="off" prefix="↺" />
          <TextField label="Border width" value={d.buttonBorderWidth} onChange={v=>setD({buttonBorderWidth:v})} autoComplete="off" prefix="↺" />
        </BlockStack>
      </BlockStack>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════
     TAB: LAYOUT
     ═════════════════════════════════════════════════════════════════ */
  function renderLayoutTab() {
    return (
      <BlockStack gap="400">
        <Text as="h3" variant="headingSm" fontWeight="bold">Layout settings</Text>
        <Select label="Select label style" options={[
          {label:"Block labels",value:"block"},{label:"Inline labels",value:"inline"},{label:"Floating labels",value:"floating"},
        ]} value={d.labelStyle} onChange={v=>setD({labelStyle:v as any})} />
      </BlockStack>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════
     DESIGN PANEL ROUTER
     ═════════════════════════════════════════════════════════════════ */
  function renderDesignPanel() {
    return (
      <BlockStack gap="400">
        <Tabs tabs={designTabs} selected={activeDesignTab} onSelect={setActiveDesignTab} fitted />
        <Box paddingBlockStart="200">
          {activeDesignTab===0 && renderHeadingTab()}
          {activeDesignTab===1 && renderElementsTab()}
          {activeDesignTab===2 && <Banner tone="info"><p>Captcha integration coming soon.</p></Banner>}
          {activeDesignTab===3 && renderFormTab()}
          {activeDesignTab===4 && renderInputTab()}
          {activeDesignTab===5 && renderButtonTab()}
          {activeDesignTab===6 && renderLayoutTab()}
        </Box>
      </BlockStack>
    );
  }

  function getFormBg(): string {
    if (d.bgType==="transparent") return "transparent";
    if (d.bgType==="color") return d.bgColor;
    if (d.bgType==="gradient") return `linear-gradient(135deg, ${d.bgColor}, ${d.bgColor2})`;
    return "transparent";
  }

  /* ═════════════════════════════════════════════════════════════════════
     MAIN RENDER
     ═════════════════════════════════════════════════════════════════ */
  return (
    <Page
      title="Create Form"
      backAction={{ content: "Forms", url: "/app/formsly" }}
      primaryAction={{
        content: saving ? "Saving…" : "Save & publish",
        onAction: () => handleSave(true),
        loading: saving,
      }}
      secondaryActions={[{ content: "Save as draft", onAction: () => handleSave(false) }]}
    >
      {error && <Box paddingBlockEnd="400"><Banner tone="critical"><p>{error}</p></Banner></Box>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 420px",gap:20,alignItems:"start"}}>
        <Card>
          <BlockStack gap="400">
            <Tabs tabs={mainTabs} selected={activeTab} onSelect={setActiveTab} />
            <Box paddingBlockStart="300">
              {activeTab===0 && renderSettingsPanel()}
              {activeTab===1 && renderDesignPanel()}
              {activeTab===2 && <BlockStack gap="400"><Banner tone="info"><p>Integrations coming soon.</p></Banner></BlockStack>}
            </Box>
          </BlockStack>
        </Card>

        <div style={{position:"sticky",top:20}}>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">Form preview</Text>
                <Text as="p" variant="bodySm" tone="subdued">Preview purposes only.</Text>
              </InlineStack>
              <Divider />
              <div style={{
                background: getFormBg(),
                border: `${d.borderSize}px solid ${d.borderColor}`,
                borderRadius: `${d.borderRadius}px`,
                padding: `${d.formPadding}px`,
                maxWidth: d.formWidth, margin: "0 auto", fontFamily: "sans-serif",
                boxShadow: d.bgShadow !== "none" ? d.bgShadow : undefined,
              }}>
                {d.formBannerUrl && (
                  <div style={{marginBottom:16,textAlign:d.formBannerAlignment}}>
                    <img src={d.formBannerUrl} alt="Banner" style={{maxWidth:d.formBannerWidth,height:`${d.formBannerHeight}px`,objectFit:"cover",borderRadius:4}} />
                  </div>
                )}
                <h2 style={{fontSize:20,fontWeight:600,marginBottom:4,marginTop:0}}>{formName||"Form Title"}</h2>
                {d.formDescription && <p style={{fontSize:13,color:"#6B7280",marginTop:0,marginBottom:16}}>{d.formDescription}</p>}
                {fields.length===0 ? (
                  <div style={{textAlign:"center",padding:"40px 0",color:"#9CA3AF",fontSize:13}}>Add fields from the left panel</div>
                ) : (
                  <div style={{display:"flex",flexWrap:"wrap",gap:16}}>
                    {fields.map(f => (
                      <div key={f.id} style={{width:f.halfWidth?"calc(50% - 8px)":"100%",textAlign:f.fieldInCenter?"center":"left"}}>
                        {d.labelStyle==="block" && (<><label style={{display:"block",marginBottom:6,fontSize:`${d.labelFontSize}px`,fontWeight:500,color:d.labelColor}}>{f.label}{f.required&&<span style={{color:"red",marginLeft:2}}>*</span>}</label>{renderPreview(f)}</>)}
                        {d.labelStyle==="inline" && (<div style={{display:"flex",alignItems:"center",gap:8}}><label style={{fontSize:`${d.labelFontSize}px`,fontWeight:500,color:d.labelColor,whiteSpace:"nowrap",minWidth:"30%"}}>{f.label}{f.required&&<span style={{color:"red",marginLeft:2}}>*</span>}</label><div style={{flex:1}}>{renderPreview(f)}</div></div>)}
                        {d.labelStyle==="floating" && (<div style={{position:"relative"}}>{renderPreview(f)}<label style={{position:"absolute",top:4,left:10,fontSize:10,color:d.labelColor,opacity:0.6,pointerEvents:"none"}}>{f.label}{f.required&&<span style={{color:"red",marginLeft:2}}>*</span>}</label></div>)}
                      </div>
                    ))}
                    <div style={{width:"100%",display:"flex",justifyContent:d.buttonAlignment==="full"?"stretch":d.buttonAlignment==="center"?"center":d.buttonAlignment==="right"?"flex-end":"flex-start"}}>
                      <button style={{width:d.buttonAlignment==="full"?"100%":"auto",padding:"10px 24px",background:d.buttonBg,color:d.buttonTextColor,border:`${d.buttonBorderWidth}px solid ${d.buttonBorderColor}`,borderRadius:`${d.buttonBorderRadius}px`,fontSize:Number(d.buttonFontSize),fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{d.buttonText||settings.submitLabel||"Submit"}</button>
                    </div>
                  </div>
                )}
              </div>
            </BlockStack>
          </Card>
        </div>
      </div>
    </Page>
  );
}