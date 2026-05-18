// import { useState } from "react";

// const Badge = ({ text, variant =   "pro" }) => (
//   <span
//     style={{
//       fontSize: 10,
//       fontWeight: 600,
//       padding: "2px 7px",
//       borderRadius: 4,
//       marginLeft: 6,
//       letterSpacing: 0.3,
//       textTransform: "uppercase",
//       background: variant === "pro+" ? "#e8d5f5" : "#dbeafe",
//       color: variant === "pro+" ? "#7c3aed" : "#2563eb",
//       verticalAlign: "middle",
//     }}
//   >
//     {text}
//   </span>
// );

// const TabBar = ({ tabs, active, onSelect, style }) => (
//   <div
//     style={{
//       display: "flex",
//       gap: 0,
//       borderBottom: "1px solid #e2e5ea",
//       marginBottom: 28,
//       flexWrap: "wrap",
//       ...style,
//     }}
//   >
//     {tabs.map((tab) => (
//       <button
//         key={tab.id}
//         onClick={() => onSelect(tab.id)}
//         style={{
//           padding: "10px 18px",
//           fontSize: 13.5,
//           fontWeight: active === tab.id ? 600 : 400,
//           color: active === tab.id ? "#111827" : "#6b7280",
//           background: active === tab.id ? "#fff" : "transparent",
//           border: active === tab.id ? "1px solid #e2e5ea" : "1px solid transparent",
//           borderBottom: active === tab.id ? "1px solid #fff" : "1px solid transparent",
//           borderRadius: "8px 8px 0 0",
//           cursor: "pointer",
//           marginBottom: -1,
//           transition: "all 0.15s ease",
//           display: "flex",
//           alignItems: "center",
//           whiteSpace: "nowrap",
//           fontFamily: "inherit",
//         }}
//       >
//         {tab.label}
//         {tab.badge && <Badge text={tab.badge} variant={tab.badgeVariant} />}
//       </button>
//     ))}
//   </div>
// );

// const Card = ({ children, style }) => (
//   <div
//     style={{
//       background: "#fff",
//       border: "1px solid #e5e7eb",
//       borderRadius: 12,
//       padding: "24px 28px",
//       ...style,
//     }}
//   >
//     {children}
//   </div>
// );

// const FieldLabel = ({ children }) => (
//   <label
//     style={{
//       display: "block",
//       fontSize: 13,
//       fontWeight: 600,
//       color: "#1f2937",
//       marginBottom: 6,
//     }}
//   >
//     {children}
//   </label>
// );

// const TextInput = ({ placeholder, value, onChange, type = "text" }) => (
//   <input
//     type={type}
//     placeholder={placeholder}
//     value={value}
//     onChange={onChange}
//     style={{
//       width: "100%",
//       padding: "10px 14px",
//       fontSize: 13.5,
//       border: "1px solid #d1d5db",
//       borderRadius: 8,
//       outline: "none",
//       color: "#374151",
//       background: "#fff",
//       boxSizing: "border-box",
//       fontFamily: "inherit",
//       transition: "border-color 0.15s ease",
//     }}
//     onFocus={(e) => (e.target.style.borderColor = "#93c5fd")}
//     onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
//   />
// );

// const SelectInput = ({ options, value, onChange }) => (
//   <select
//     value={value}
//     onChange={onChange}
//     style={{
//       width: "100%",
//       padding: "10px 14px",
//       fontSize: 13.5,
//       border: "1px solid #d1d5db",
//       borderRadius: 8,
//       outline: "none",
//       color: "#374151",
//       background: "#fff",
//       boxSizing: "border-box",
//       fontFamily: "inherit",
//       cursor: "pointer",
//       appearance: "auto",
//     }}
//   >
//     {options.map((o) => (
//       <option key={o.value} value={o.value}>
//         {o.label}
//       </option>
//     ))}
//   </select>
// );

// const Checkbox = ({ label, checked, onChange }) => (
//   <label
//     style={{
//       display: "flex",
//       alignItems: "flex-start",
//       gap: 10,
//       cursor: "pointer",
//       fontSize: 13.5,
//       color: "#374151",
//       lineHeight: 1.5,
//     }}
//   >
//     <input
//       type="checkbox"
//       checked={checked}
//       onChange={onChange}
//       style={{
//         width: 18,
//         height: 18,
//         marginTop: 1,
//         accentColor: "#2563eb",
//         cursor: "pointer",
//         flexShrink: 0,
//       }}
//     />
//     {label}
//   </label>
// );

// const SaveBtn = ({ onClick, label = "Save" }) => (
//   <button
//     onClick={onClick}
//     style={{
//       padding: "9px 24px",
//       fontSize: 13,
//       fontWeight: 600,
//       color: "#fff",
//       background: "#111827",
//       border: "none",
//       borderRadius: 8,
//       cursor: "pointer",
//       fontFamily: "inherit",
//       transition: "background 0.15s ease",
//     }}
//     onMouseEnter={(e) => (e.target.style.background = "#1f2937")}
//     onMouseLeave={(e) => (e.target.style.background = "#111827")}
//   >
//     {label}
//   </button>
// );

// const VerifyBtn = ({ onClick }) => (
//   <button
//     onClick={onClick}
//     style={{
//       padding: "8px 20px",
//       fontSize: 12.5,
//       fontWeight: 500,
//       color: "#374151",
//       background: "#f3f4f6",
//       border: "1px solid #d1d5db",
//       borderRadius: 8,
//       cursor: "pointer",
//       fontFamily: "inherit",
//     }}
//   >
//     Verify
//   </button>
// );

// const SectionRow = ({ title, description, children }) => (
//   <div
//     style={{
//       display: "grid",
//       gridTemplateColumns: "280px 1fr",
//       gap: 40,
//       alignItems: "start",
//       paddingBottom: 32,
//       marginBottom: 32,
//       borderBottom: "1px solid #f0f1f3",
//     }}
//   >
//     <div>
//       <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 8 }}>
//         {title}
//       </h3>
//       {description && (
//         <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>{description}</p>
//       )}
//     </div>
//     <Card>{children}</Card>
//   </div>
// );

// /* ── TAB CONTENT COMPONENTS ── */

// const BasicTab = () => {
//   const [noMonthly, setNoMonthly] = useState(false);
//   const [altEmail, setAltEmail] = useState("");
//   const [themeNotif, setThemeNotif] = useState(true);
//   const [englishDefault, setEnglishDefault] = useState(false);

//   return (
//     <div>
//       <SectionRow
//         title="Monthly analysis"
//         description="Our monthly analysis emails will keep you up to date on your store's success with our app."
//       >
//         <Checkbox
//           label="I don't want to receive monthly analysis emails."
//           checked={noMonthly}
//           onChange={() => setNoMonthly(!noMonthly)}
//         />
//         <div style={{ marginTop: 20 }}>
//           <FieldLabel>Alternative email address (optional)</FieldLabel>
//           <TextInput
//             placeholder="Email for monthly analysis"
//             value={altEmail}
//             onChange={(e) => setAltEmail(e.target.value)}
//           />
//           <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
//             By default, it will be sent to your store admin email.
//           </p>
//         </div>
//       </SectionRow>

//       <SectionRow
//         title="Theme change/update notification"
//         description="This email is triggered and sent to the store owner every time there is a change to your theme files."
//       >
//         <Checkbox
//           label="I agree to receive theme change/update email notifications."
//           checked={themeNotif}
//           onChange={() => setThemeNotif(!themeNotif)}
//         />
//       </SectionRow>

//       <SectionRow
//         title="App Language"
//         description="Our app by default adapts the translated values based on the account language."
//       >
//         <Checkbox
//           label="Please enable this option to use English as a default app language."
//           checked={englishDefault}
//           onChange={() => setEnglishDefault(!englishDefault)}
//         />
//       </SectionRow>
//     </div>
//   );
// };

// const LanguageTab = () => {
//   const [subTab, setSubTab] = useState("informative");
//   const [formMsg, setFormMsg] = useState("");
//   const [processingMsg, setProcessingMsg] = useState("");

//   const subTabs = [
//     { id: "informative", label: "Informative messages" },
//     { id: "validation", label: "Validation messages" },
//     { id: "other", label: "Other messages" },
//     { id: "common", label: "Common messages" },
//   ];

//   return (
//     <div>
//       <TabBar tabs={subTabs} active={subTab} onSelect={setSubTab} style={{ marginBottom: 24 }} />

//       {subTab === "informative" && (
//         <SectionRow
//           title="Informative messages"
//           description="Use these settings to customize messages that your customers see when they are filling out response on the forms."
//         >
//           <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
//             Informative messages
//           </h4>
//           <FieldLabel>Form submission message</FieldLabel>
//           <TextInput
//             placeholder="Form submission message"
//             value={formMsg}
//             onChange={(e) => setFormMsg(e.target.value)}
//           />
//           <div style={{ marginTop: 18 }}>
//             <FieldLabel>Processing...</FieldLabel>
//             <TextInput
//               placeholder="Processing..."
//               value={processingMsg}
//               onChange={(e) => setProcessingMsg(e.target.value)}
//             />
//           </div>
//           <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
//             <SaveBtn />
//           </div>
//         </SectionRow>
//       )}

//       {subTab === "validation" && (
//         <SectionRow
//           title="Validation messages"
//           description="Customize the error messages shown when form validation fails."
//         >
//           <FieldLabel>Required field message</FieldLabel>
//           <TextInput placeholder="This field is required" />
//           <div style={{ marginTop: 18 }}>
//             <FieldLabel>Invalid email message</FieldLabel>
//             <TextInput placeholder="Please enter a valid email address" />
//           </div>
//           <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
//             <SaveBtn />
//           </div>
//         </SectionRow>
//       )}

//       {subTab === "other" && (
//         <SectionRow title="Other messages" description="Additional messages used throughout the forms.">
//           <FieldLabel>Loading message</FieldLabel>
//           <TextInput placeholder="Loading..." />
//           <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
//             <SaveBtn />
//           </div>
//         </SectionRow>
//       )}

//       {subTab === "common" && (
//         <SectionRow
//           title="Common messages"
//           description="Messages shared across all form types."
//         >
//           <FieldLabel>Submit button text</FieldLabel>
//           <TextInput placeholder="Submit" />
//           <div style={{ marginTop: 18 }}>
//             <FieldLabel>Cancel button text</FieldLabel>
//             <TextInput placeholder="Cancel" />
//           </div>
//           <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
//             <SaveBtn />
//           </div>
//         </SectionRow>
//       )}
//     </div>
//   );
// };

// const BlockedDomainsTab = () => {
//   const [domains, setDomains] = useState("");
//   return (
//     <SectionRow
//       title="Blocked domains"
//       description="If you wish to block certain email domains use this settings page to do so."
//     >
//       <FieldLabel>Email domains to block</FieldLabel>
//       <TextInput
//         placeholder="example.com, another-example.com"
//         value={domains}
//         onChange={(e) => setDomains(e.target.value)}
//       />
//       <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, lineHeight: 1.6 }}>
//         Enter the domain (e.g., "gmail.com") to block all emails from it, or enter a full email
//         (e.g., "user@gmail.com") to block only that address. Don't include "www" or "@".
//       </p>
//       <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
//         <SaveBtn />
//       </div>
//     </SectionRow>
//   );
// };

// const ApiTokensTab = () => (
//   <div>
//     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//       <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//         <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>API Tokens</h3>
//         <span
//           style={{
//             display: "inline-flex",
//             alignItems: "center",
//             justifyContent: "center",
//             width: 18,
//             height: 18,
//             borderRadius: "50%",
//             border: "1px solid #d1d5db",
//             fontSize: 11,
//             color: "#9ca3af",
//             cursor: "help",
//           }}
//         >
//           ?
//         </span>
//       </div>
//       <button
//         style={{
//           padding: "8px 16px",
//           fontSize: 13,
//           fontWeight: 500,
//           color: "#374151",
//           background: "#fff",
//           border: "1px solid #d1d5db",
//           borderRadius: 8,
//           cursor: "pointer",
//           fontFamily: "inherit",
//         }}
//       >
//         New API Key
//       </button>
//     </div>
//     <Card>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
//             {["Name", "Support email", "Token", "Copy", "Last updated", "Actions"].map((h) => (
//               <th
//                 key={h}
//                 style={{
//                   padding: "10px 12px",
//                   fontSize: 12,
//                   fontWeight: 600,
//                   color: "#6b7280",
//                   textAlign: "left",
//                   textTransform: "uppercase",
//                   letterSpacing: 0.5,
//                 }}
//               >
//                 {h}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           <tr>
//             <td
//               colSpan={6}
//               style={{
//                 textAlign: "center",
//                 padding: "36px 12px",
//                 fontSize: 13.5,
//                 color: "#9ca3af",
//               }}
//             >
//               No records available
//             </td>
//           </tr>
//         </tbody>
//       </table>
//     </Card>
//   </div>
// );

// const DomainSetupTab = () => {
//   const [method, setMethod] = useState("smtp");
//   const [server, setServer] = useState("");
//   const [port, setPort] = useState("587");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [auth, setAuth] = useState("plain");
//   const [ssl, setSsl] = useState("true");

//   return (
//     <SectionRow title="Sending domain" description="">
//       <FieldLabel>Sending domain settings method you want to use</FieldLabel>
//       <SelectInput
//         options={[
//           { value: "smtp", label: "SMTP" },
//           { value: "api", label: "API" },
//         ]}
//         value={method}
//         onChange={(e) => setMethod(e.target.value)}
//       />
//       <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
//         You can follow the custom domain setup instruction from{" "}
//         <a href="#" style={{ color: "#2563eb", textDecoration: "none" }}>
//           here
//         </a>
//         .
//       </p>

//       <div
//         style={{
//           marginTop: 24,
//           padding: 20,
//           background: "#fafbfc",
//           borderRadius: 8,
//           border: "1px solid #f0f1f3",
//         }}
//       >
//         <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
//           Domain details
//         </h4>
//         <FieldLabel>Server address</FieldLabel>
//         <TextInput placeholder="smtp.gmail.com" value={server} onChange={(e) => setServer(e.target.value)} />
//         <div style={{ marginTop: 14 }}>
//           <FieldLabel>Port</FieldLabel>
//           <TextInput placeholder="587" value={port} onChange={(e) => setPort(e.target.value)} />
//         </div>
//         <div style={{ marginTop: 14 }}>
//           <FieldLabel>Email</FieldLabel>
//           <TextInput placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
//         </div>

//         <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "24px 0 16px" }}>
//           Domain authentication
//         </h4>
//         <FieldLabel>Password</FieldLabel>
//         <TextInput type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
//         <div style={{ marginTop: 14 }}>
//           <FieldLabel>Authentication</FieldLabel>
//           <TextInput placeholder="plain" value={auth} onChange={(e) => setAuth(e.target.value)} />
//         </div>
//         <div style={{ marginTop: 14 }}>
//           <FieldLabel>Enable SSL</FieldLabel>
//           <SelectInput
//             options={[
//               { value: "true", label: "True" },
//               { value: "false", label: "False" },
//             ]}
//             value={ssl}
//             onChange={(e) => setSsl(e.target.value)}
//           />
//         </div>
//       </div>

//       <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 20 }}>
//         <VerifyBtn />
//         <SaveBtn label="Submit" />
//       </div>
//       <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 8 }}>
//         Note: Please verify SMTP details before submitting.
//       </p>
//     </SectionRow>
//   );
// };

// const PaymentIntegrationTab = () => {
//   const [paymentType, setPaymentType] = useState("stripe");
//   const [pubKey, setPubKey] = useState("");
//   const [secKey, setSecKey] = useState("");

//   return (
//     <SectionRow title="Payment integration" description="">
//       <FieldLabel>Select Payment type</FieldLabel>
//       <SelectInput
//         options={[
//           { value: "stripe", label: "Stripe" },
//           { value: "paypal", label: "PayPal" },
//         ]}
//         value={paymentType}
//         onChange={(e) => setPaymentType(e.target.value)}
//       />

//       <div
//         style={{
//           marginTop: 24,
//           padding: 20,
//           background: "#fafbfc",
//           borderRadius: 8,
//           border: "1px solid #f0f1f3",
//         }}
//       >
//         <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
//           Connect to {paymentType}
//         </h4>
//         <FieldLabel>Publishable Key</FieldLabel>
//         <TextInput placeholder="Publishable Key" value={pubKey} onChange={(e) => setPubKey(e.target.value)} />
//         <div style={{ marginTop: 14 }}>
//           <FieldLabel>Secret Key</FieldLabel>
//           <TextInput placeholder="Secret Key" value={secKey} onChange={(e) => setSecKey(e.target.value)} />
//         </div>
//         <p style={{ fontSize: 12, color: "#2563eb", marginTop: 12, cursor: "pointer" }}>
//           You can get your {paymentType} Key from{" "}
//           <a href="#" style={{ color: "#2563eb", textDecoration: "underline" }}>
//             here
//           </a>
//           .
//         </p>
//       </div>

//       <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
//         <SaveBtn />
//       </div>
//     </SectionRow>
//   );
// };

// const EmailServiceTab = () => {
//   const [integrationType, setIntegrationType] = useState("mailchimp");
//   const [apiKey, setApiKey] = useState("");

//   return (
//     <SectionRow title="Mail integration" description="">
//       <FieldLabel>Select integration type</FieldLabel>
//       <SelectInput
//         options={[
//           { value: "mailchimp", label: "Mailchimp" },
//           { value: "klaviyo", label: "Klaviyo" },
//           { value: "sendinblue", label: "Sendinblue" },
//         ]}
//         value={integrationType}
//         onChange={(e) => setIntegrationType(e.target.value)}
//       />

//       <div
//         style={{
//           marginTop: 24,
//           padding: 20,
//           background: "#fafbfc",
//           borderRadius: 8,
//           border: "1px solid #f0f1f3",
//         }}
//       >
//         <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
//           Connect {integrationType.charAt(0).toUpperCase() + integrationType.slice(1)}
//         </h4>
//         <FieldLabel>{integrationType.charAt(0).toUpperCase() + integrationType.slice(1)} Key</FieldLabel>
//         <TextInput
//           placeholder={`${integrationType.charAt(0).toUpperCase() + integrationType.slice(1)} Key`}
//           value={apiKey}
//           onChange={(e) => setApiKey(e.target.value)}
//         />
//         <p style={{ fontSize: 12, color: "#2563eb", marginTop: 12 }}>
//           You can get your {integrationType} key from{" "}
//           <a href="#" style={{ color: "#2563eb", textDecoration: "underline" }}>
//             here
//           </a>
//           .
//         </p>
//       </div>

//       <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
//         <SaveBtn />
//       </div>
//     </SectionRow>
//   );
// };

// const ZerobounceTab = () => {
//   const [zbKey, setZbKey] = useState("");

//   return (
//     <SectionRow title="Zerobounce integration" description="">
//       <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
//         Connect to zerobounce
//       </h4>
//       <FieldLabel>Zerobounce Key</FieldLabel>
//       <TextInput placeholder="Zerobounce Key" value={zbKey} onChange={(e) => setZbKey(e.target.value)} />
//       <p style={{ fontSize: 12, color: "#2563eb", marginTop: 12 }}>
//         You can get your zerobounce Key from{" "}
//         <a href="#" style={{ color: "#2563eb", textDecoration: "underline" }}>
//           here
//         </a>
//         .
//       </p>
//       <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
//         <SaveBtn />
//       </div>
//     </SectionRow>
//   );
// };

// /* ── INTEGRATIONS WRAPPER ── */
// const IntegrationsTab = () => {
//   const [subTab, setSubTab] = useState("api-tokens");

//   const subTabs = [
//     { id: "api-tokens", label: "API Tokens", badge: "Pro" },
//     { id: "domain-setup", label: "Domain setup", badge: "Pro" },
//     { id: "payment", label: "Payment integration", badge: "Pro" },
//     { id: "email-service", label: "Email service provider", badge: "Pro" },
//     { id: "zerobounce", label: "Zerobounce Email Validation", badge: "Pro+", badgeVariant: "pro+" },
//   ];

//   return (
//     <div>
//       <TabBar tabs={subTabs} active={subTab} onSelect={setSubTab} />
//       {subTab === "api-tokens" && <ApiTokensTab />}
//       {subTab === "domain-setup" && <DomainSetupTab />}
//       {subTab === "payment" && <PaymentIntegrationTab />}
//       {subTab === "email-service" && <EmailServiceTab />}
//       {subTab === "zerobounce" && <ZerobounceTab />}
//     </div>
//   );
// };

// /* ── MAIN APP ── */
// export default function SettingsPanel() {
//   const [activeTab, setActiveTab] = useState("basic");

//   const mainTabs = [
//     { id: "basic", label: "Basic" },
//     { id: "language", label: "Language", badge: "Pro" },
//     { id: "blocked-domains", label: "Blocked domains", badge: "Pro" },
//     { id: "integrations", label: "Integrations", badge: "Pro" },
//   ];

//   return (
//     <div
//       style={{
//         fontFamily:
//           '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
//         background: "#f4f5f7",
//         minHeight: "100vh",
//         color: "#111827",
//       }}
//     >
//       {/* Header */}
//       <div
//         style={{
//           padding: "24px 40px 0",
//           background: "#fff",
//           borderBottom: "1px solid #e2e5ea",
//         }}
//       >
//         <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px", color: "#111827" }}>
//           Settings
//         </h1>
//         <div style={{ display: "flex", gap: 0 }}>
//           {mainTabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               style={{
//                 padding: "11px 20px",
//                 fontSize: 14,
//                 fontWeight: activeTab === tab.id ? 600 : 400,
//                 color: activeTab === tab.id ? "#111827" : "#6b7280",
//                 background: activeTab === tab.id ? "#f4f5f7" : "transparent",
//                 border: activeTab === tab.id ? "1px solid #e2e5ea" : "1px solid transparent",
//                 borderBottom: activeTab === tab.id ? "1px solid #f4f5f7" : "1px solid transparent",
//                 borderRadius: "8px 8px 0 0",
//                 cursor: "pointer",
//                 marginBottom: -1,
//                 display: "flex",
//                 alignItems: "center",
//                 fontFamily: "inherit",
//                 transition: "all 0.15s ease",
//               }}
//             >
//               {tab.label}
//               {tab.badge && <Badge text={tab.badge} />}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Content */}
//       <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 40px 60px" }}>
//         {activeTab === "basic" && <BasicTab />}
//         {activeTab === "language" && <LanguageTab />}
//         {activeTab === "blocked-domains" && <BlockedDomainsTab />}
//         {activeTab === "integrations" && <IntegrationsTab />}
//       </div>

//       {/* Footer */}
//       <div
//         style={{
//           textAlign: "center",
//           padding: "20px 0 28px",
//           borderTop: "1px solid #e5e7eb",
//           background: "#f4f5f7",
//         }}
//       >
//         <p style={{ fontSize: 12.5, color: "#9ca3af", margin: 0 }}>
//           The Form Builder app.{" "}
//           <a href="#" style={{ color: "#2563eb", textDecoration: "none" }}>
//             Privacy policy
//           </a>{" "}
//           |{" "}
//           <a href="#" style={{ color: "#2563eb", textDecoration: "none" }}>
//             Terms and conditions
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// }


import { useState } from "react";

const Badge = ({ text, variant = "pro" }: { text: string; variant?: string }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 7px",
      borderRadius: 4,
      marginLeft: 6,
      letterSpacing: 0.3,
      textTransform: "uppercase",
      background: variant === "pro+" ? "#e8d5f5" : "#dbeafe",
      color: variant === "pro+" ? "#7c3aed" : "#2563eb",
      verticalAlign: "middle",
    }}
  >
    {text}
  </span>
);

const TabBar = ({
  tabs,
  active,
  onSelect,
  style,
}: {
  tabs: { id: string; label: string; badge?: string; badgeVariant?: string }[];
  active: string;
  onSelect: (id: string) => void;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      display: "flex",
      gap: 0,
      borderBottom: "1px solid #e2e5ea",
      marginBottom: 28,
      flexWrap: "wrap",
      ...style,
    }}
  >
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onSelect(tab.id)}
        style={{
          padding: "10px 18px",
          fontSize: 13.5,
          fontWeight: active === tab.id ? 600 : 400,
          color: active === tab.id ? "#111827" : "#6b7280",
          background: active === tab.id ? "#fff" : "transparent",
          border: active === tab.id ? "1px solid #e2e5ea" : "1px solid transparent",
          borderBottom: active === tab.id ? "1px solid #fff" : "1px solid transparent",
          borderRadius: "8px 8px 0 0",
          cursor: "pointer",
          marginBottom: -1,
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          fontFamily: "inherit",
        }}
      >
        {tab.label}
        {tab.badge && <Badge text={tab.badge} variant={tab.badgeVariant} />}
      </button>
    ))}
  </div>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "24px 28px",
      ...style,
    }}
  >
    {children}
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label
    style={{
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      color: "#1f2937",
      marginBottom: 6,
    }}
  >
    {children}
  </label>
);

const TextInput = ({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    style={{
      width: "100%",
      padding: "10px 14px",
      fontSize: 13.5,
      border: "1px solid #d1d5db",
      borderRadius: 8,
      outline: "none",
      color: "#374151",
      background: "#fff",
      boxSizing: "border-box",
      fontFamily: "inherit",
      transition: "border-color 0.15s ease",
    }}
    onFocus={(e) => (e.target.style.borderColor = "#93c5fd")}
    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
  />
);

const SelectInput = ({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <select
    value={value}
    onChange={onChange}
    style={{
      width: "100%",
      padding: "10px 14px",
      fontSize: 13.5,
      border: "1px solid #d1d5db",
      borderRadius: 8,
      outline: "none",
      color: "#374151",
      background: "#fff",
      boxSizing: "border-box",
      fontFamily: "inherit",
      cursor: "pointer",
      appearance: "auto",
    }}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const Checkbox = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <label
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      cursor: "pointer",
      fontSize: 13.5,
      color: "#374151",
      lineHeight: 1.5,
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={{
        width: 18,
        height: 18,
        marginTop: 1,
        accentColor: "#2563eb",
        cursor: "pointer",
        flexShrink: 0,
      }}
    />
    {label}
  </label>
);

const SaveBtn = ({ onClick, label = "Save" }: { onClick?: () => void; label?: string }) => (
  <button
    onClick={onClick}
    style={{
      padding: "9px 24px",
      fontSize: 13,
      fontWeight: 600,
      color: "#fff",
      background: "#111827",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "background 0.15s ease",
    }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1f2937")}
    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#111827")}
  >
    {label}
  </button>
);

const VerifyBtn = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 20px",
      fontSize: 12.5,
      fontWeight: 500,
      color: "#374151",
      background: "#f3f4f6",
      border: "1px solid #d1d5db",
      borderRadius: 8,
      cursor: "pointer",
      fontFamily: "inherit",
    }}
  >
    Verify
  </button>
);

// ✅ Reusable link-styled anchor — enforces real href, no href="#"
const DocLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#2563eb", textDecoration: "underline" }}
  >
    {children}
  </a>
);

const SectionRow = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      gap: 40,
      alignItems: "start",
      paddingBottom: 32,
      marginBottom: 32,
      borderBottom: "1px solid #f0f1f3",
    }}
  >
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 8 }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>{description}</p>
      )}
    </div>
    <Card>{children}</Card>
  </div>
);

/* ── TAB CONTENT COMPONENTS ── */

const BasicTab = () => {
  const [noMonthly, setNoMonthly] = useState(false);
  const [altEmail, setAltEmail] = useState("");
  const [themeNotif, setThemeNotif] = useState(true);
  const [englishDefault, setEnglishDefault] = useState(false);

  return (
    <div>
      <SectionRow
        title="Monthly analysis"
        description="Our monthly analysis emails will keep you up to date on your store's success with our app."
      >
        <Checkbox
          label="I don't want to receive monthly analysis emails."
          checked={noMonthly}
          onChange={() => setNoMonthly(!noMonthly)}
        />
        <div style={{ marginTop: 20 }}>
          <FieldLabel>Alternative email address (optional)</FieldLabel>
          <TextInput
            placeholder="Email for monthly analysis"
            value={altEmail}
            onChange={(e) => setAltEmail(e.target.value)}
          />
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
            By default, it will be sent to your store admin email.
          </p>
        </div>
      </SectionRow>

      <SectionRow
        title="Theme change/update notification"
        description="This email is triggered and sent to the store owner every time there is a change to your theme files."
      >
        <Checkbox
          label="I agree to receive theme change/update email notifications."
          checked={themeNotif}
          onChange={() => setThemeNotif(!themeNotif)}
        />
      </SectionRow>

      <SectionRow
        title="App Language"
        description="Our app by default adapts the translated values based on the account language."
      >
        <Checkbox
          label="Please enable this option to use English as a default app language."
          checked={englishDefault}
          onChange={() => setEnglishDefault(!englishDefault)}
        />
      </SectionRow>
    </div>
  );
};

const LanguageTab = () => {
  const [subTab, setSubTab] = useState("informative");
  const [formMsg, setFormMsg] = useState("");
  const [processingMsg, setProcessingMsg] = useState("");

  const subTabs = [
    { id: "informative", label: "Informative messages" },
    { id: "validation", label: "Validation messages" },
    { id: "other", label: "Other messages" },
    { id: "common", label: "Common messages" },
  ];

  return (
    <div>
      <TabBar tabs={subTabs} active={subTab} onSelect={setSubTab} style={{ marginBottom: 24 }} />

      {subTab === "informative" && (
        <SectionRow
          title="Informative messages"
          description="Use these settings to customize messages that your customers see when they are filling out response on the forms."
        >
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
            Informative messages
          </h4>
          <FieldLabel>Form submission message</FieldLabel>
          <TextInput
            placeholder="Form submission message"
            value={formMsg}
            onChange={(e) => setFormMsg(e.target.value)}
          />
          <div style={{ marginTop: 18 }}>
            <FieldLabel>Processing...</FieldLabel>
            <TextInput
              placeholder="Processing..."
              value={processingMsg}
              onChange={(e) => setProcessingMsg(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <SaveBtn />
          </div>
        </SectionRow>
      )}

      {subTab === "validation" && (
        <SectionRow
          title="Validation messages"
          description="Customize the error messages shown when form validation fails."
        >
          <FieldLabel>Required field message</FieldLabel>
          <TextInput placeholder="This field is required" />
          <div style={{ marginTop: 18 }}>
            <FieldLabel>Invalid email message</FieldLabel>
            <TextInput placeholder="Please enter a valid email address" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <SaveBtn />
          </div>
        </SectionRow>
      )}

      {subTab === "other" && (
        <SectionRow title="Other messages" description="Additional messages used throughout the forms.">
          <FieldLabel>Loading message</FieldLabel>
          <TextInput placeholder="Loading..." />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <SaveBtn />
          </div>
        </SectionRow>
      )}

      {subTab === "common" && (
        <SectionRow title="Common messages" description="Messages shared across all form types.">
          <FieldLabel>Submit button text</FieldLabel>
          <TextInput placeholder="Submit" />
          <div style={{ marginTop: 18 }}>
            <FieldLabel>Cancel button text</FieldLabel>
            <TextInput placeholder="Cancel" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <SaveBtn />
          </div>
        </SectionRow>
      )}
    </div>
  );
};

const BlockedDomainsTab = () => {
  const [domains, setDomains] = useState("");
  return (
    <SectionRow
      title="Blocked domains"
      description="If you wish to block certain email domains use this settings page to do so."
    >
      <FieldLabel>Email domains to block</FieldLabel>
      <TextInput
        placeholder="example.com, another-example.com"
        value={domains}
        onChange={(e) => setDomains(e.target.value)}
      />
      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, lineHeight: 1.6 }}>
        Enter the domain (e.g., "gmail.com") to block all emails from it, or enter a full email
        (e.g., "user@gmail.com") to block only that address. Don't include "www" or "@".
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <SaveBtn />
      </div>
    </SectionRow>
  );
};

const ApiTokensTab = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>API Tokens</h3>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "1px solid #d1d5db",
            fontSize: 11,
            color: "#9ca3af",
            cursor: "help",
          }}
        >
          ?
        </span>
      </div>
      <button
        style={{
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          background: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        New API Key
      </button>
    </div>
    <Card>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            {["Name", "Support email", "Token", "Copy", "Last updated", "Actions"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#6b7280",
                  textAlign: "left",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={6}
              style={{
                textAlign: "center",
                padding: "36px 12px",
                fontSize: 13.5,
                color: "#9ca3af",
              }}
            >
              No records available
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
);

const DomainSetupTab = () => {
  const [method, setMethod] = useState("smtp");
  const [server, setServer] = useState("");
  const [port, setPort] = useState("587");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState("plain");
  const [ssl, setSsl] = useState("true");

  return (
    <SectionRow title="Sending domain" description="">
      <FieldLabel>Sending domain settings method you want to use</FieldLabel>
      <SelectInput
        options={[
          { value: "smtp", label: "SMTP" },
          { value: "api", label: "API" },
        ]}
        value={method}
        onChange={(e) => setMethod(e.target.value)}
      />
      {/* ✅ Fixed: href="#" → real docs URL */}
      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
        You can follow the custom domain setup instruction from{" "}
        <DocLink href="https://docs.smartformly.kaswebtechsolutions.com/smtp-setup">here</DocLink>.
      </p>

      <div
        style={{
          marginTop: 24,
          padding: 20,
          background: "#fafbfc",
          borderRadius: 8,
          border: "1px solid #f0f1f3",
        }}
      >
        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
          Domain details
        </h4>
        <FieldLabel>Server address</FieldLabel>
        <TextInput placeholder="smtp.gmail.com" value={server} onChange={(e) => setServer(e.target.value)} />
        <div style={{ marginTop: 14 }}>
          <FieldLabel>Port</FieldLabel>
          <TextInput placeholder="587" value={port} onChange={(e) => setPort(e.target.value)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <FieldLabel>Email</FieldLabel>
          <TextInput placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "24px 0 16px" }}>
          Domain authentication
        </h4>
        <FieldLabel>Password</FieldLabel>
        <TextInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div style={{ marginTop: 14 }}>
          <FieldLabel>Authentication</FieldLabel>
          <TextInput placeholder="plain" value={auth} onChange={(e) => setAuth(e.target.value)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <FieldLabel>Enable SSL</FieldLabel>
          <SelectInput
            options={[
              { value: "true", label: "True" },
              { value: "false", label: "False" },
            ]}
            value={ssl}
            onChange={(e) => setSsl(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 20 }}>
        <VerifyBtn />
        <SaveBtn label="Submit" />
      </div>
      <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 8 }}>
        Note: Please verify SMTP details before submitting.
      </p>
    </SectionRow>
  );
};

const PaymentIntegrationTab = () => {
  const [paymentType, setPaymentType] = useState("stripe");
  const [pubKey, setPubKey] = useState("");
  const [secKey, setSecKey] = useState("");

  const paymentDocs: Record<string, string> = {
    stripe: "https://dashboard.stripe.com/apikeys",
    paypal: "https://developer.paypal.com/dashboard/applications",
  };

  return (
    <SectionRow title="Payment integration" description="">
      <FieldLabel>Select Payment type</FieldLabel>
      <SelectInput
        options={[
          { value: "stripe", label: "Stripe" },
          { value: "paypal", label: "PayPal" },
        ]}
        value={paymentType}
        onChange={(e) => setPaymentType(e.target.value)}
      />

      <div
        style={{
          marginTop: 24,
          padding: 20,
          background: "#fafbfc",
          borderRadius: 8,
          border: "1px solid #f0f1f3",
        }}
      >
        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
          Connect to {paymentType}
        </h4>
        <FieldLabel>Publishable Key</FieldLabel>
        <TextInput placeholder="Publishable Key" value={pubKey} onChange={(e) => setPubKey(e.target.value)} />
        <div style={{ marginTop: 14 }}>
          <FieldLabel>Secret Key</FieldLabel>
          <TextInput placeholder="Secret Key" value={secKey} onChange={(e) => setSecKey(e.target.value)} />
        </div>
        {/* ✅ Fixed: href="#" → real payment provider URL */}
        <p style={{ fontSize: 12, color: "#2563eb", marginTop: 12 }}>
          You can get your {paymentType} Key from{" "}
          <DocLink href={paymentDocs[paymentType]}>here</DocLink>.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <SaveBtn />
      </div>
    </SectionRow>
  );
};

const EmailServiceTab = () => {
  const [integrationType, setIntegrationType] = useState("mailchimp");
  const [apiKey, setApiKey] = useState("");

  const serviceDocs: Record<string, string> = {
    mailchimp: "https://mailchimp.com/help/about-api-keys/",
    klaviyo: "https://help.klaviyo.com/hc/en-us/articles/115005062267",
    sendinblue: "https://help.brevo.com/hc/en-us/articles/209467485",
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <SectionRow title="Mail integration" description="">
      <FieldLabel>Select integration type</FieldLabel>
      <SelectInput
        options={[
          { value: "mailchimp", label: "Mailchimp" },
          { value: "klaviyo", label: "Klaviyo" },
          { value: "sendinblue", label: "Sendinblue" },
        ]}
        value={integrationType}
        onChange={(e) => setIntegrationType(e.target.value)}
      />

      <div
        style={{
          marginTop: 24,
          padding: 20,
          background: "#fafbfc",
          borderRadius: 8,
          border: "1px solid #f0f1f3",
        }}
      >
        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
          Connect {capitalize(integrationType)}
        </h4>
        <FieldLabel>{capitalize(integrationType)} Key</FieldLabel>
        <TextInput
          placeholder={`${capitalize(integrationType)} Key`}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        {/* ✅ Fixed: href="#" → real service docs URL */}
        <p style={{ fontSize: 12, color: "#2563eb", marginTop: 12 }}>
          You can get your {integrationType} key from{" "}
          <DocLink href={serviceDocs[integrationType]}>here</DocLink>.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <SaveBtn />
      </div>
    </SectionRow>
  );
};

const ZerobounceTab = () => {
  const [zbKey, setZbKey] = useState("");

  return (
    <SectionRow title="Zerobounce integration" description="">
      <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
        Connect to zerobounce
      </h4>
      <FieldLabel>Zerobounce Key</FieldLabel>
      <TextInput placeholder="Zerobounce Key" value={zbKey} onChange={(e) => setZbKey(e.target.value)} />
      {/* ✅ Fixed: href="#" → real Zerobounce API key URL */}
      <p style={{ fontSize: 12, color: "#2563eb", marginTop: 12 }}>
        You can get your zerobounce Key from{" "}
        <DocLink href="https://app.zerobounce.net/members/apikey">here</DocLink>.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <SaveBtn />
      </div>
    </SectionRow>
  );
};

/* ── INTEGRATIONS WRAPPER ── */
const IntegrationsTab = () => {
  const [subTab, setSubTab] = useState("api-tokens");

  const subTabs = [
    { id: "api-tokens", label: "API Tokens", badge: "Pro" },
    { id: "domain-setup", label: "Domain setup", badge: "Pro" },
    { id: "payment", label: "Payment integration", badge: "Pro" },
    { id: "email-service", label: "Email service provider", badge: "Pro" },
    { id: "zerobounce", label: "Zerobounce Email Validation", badge: "Pro+", badgeVariant: "pro+" },
  ];

  return (
    <div>
      <TabBar tabs={subTabs} active={subTab} onSelect={setSubTab} />
      {subTab === "api-tokens" && <ApiTokensTab />}
      {subTab === "domain-setup" && <DomainSetupTab />}
      {subTab === "payment" && <PaymentIntegrationTab />}
      {subTab === "email-service" && <EmailServiceTab />}
      {subTab === "zerobounce" && <ZerobounceTab />}
    </div>
  );
};

/* ── MAIN APP ── */
export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState("basic");

  const mainTabs = [
    { id: "basic", label: "Basic" },
    { id: "language", label: "Language", badge: "Pro" },
    { id: "blocked-domains", label: "Blocked domains", badge: "Pro" },
    { id: "integrations", label: "Integrations", badge: "Pro" },
  ];

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: "#f4f5f7",
        minHeight: "100vh",
        color: "#111827",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 40px 0",
          background: "#fff",
          borderBottom: "1px solid #e2e5ea",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px", color: "#111827" }}>
          Settings
        </h1>
        <div style={{ display: "flex", gap: 0 }}>
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "11px 20px",
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "#111827" : "#6b7280",
                background: activeTab === tab.id ? "#f4f5f7" : "transparent",
                border: activeTab === tab.id ? "1px solid #e2e5ea" : "1px solid transparent",
                borderBottom: activeTab === tab.id ? "1px solid #f4f5f7" : "1px solid transparent",
                borderRadius: "8px 8px 0 0",
                cursor: "pointer",
                marginBottom: -1,
                display: "flex",
                alignItems: "center",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
              {tab.badge && <Badge text={tab.badge} />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 40px 60px" }}>
        {activeTab === "basic" && <BasicTab />}
        {activeTab === "language" && <LanguageTab />}
        {activeTab === "blocked-domains" && <BlockedDomainsTab />}
        {activeTab === "integrations" && <IntegrationsTab />}
      </div>

      {/* Footer — ✅ Fixed: href="#" → real policy URLs */}
      <div
        style={{
          textAlign: "center",
          padding: "20px 0 28px",
          borderTop: "1px solid #e5e7eb",
          background: "#f4f5f7",
        }}
      >
        <p style={{ fontSize: 12.5, color: "#9ca3af", margin: 0 }}>
          The Form Builder app.{" "}
          <DocLink href="https://smartformly.kaswebtechsolutions.com/privacy">
            Privacy policy
          </DocLink>{" "}
          |{" "}
          <DocLink href="https://smartformly.kaswebtechsolutions.com/terms">
            Terms and conditions
          </DocLink>
        </p>
      </div>
    </div>
  );
}