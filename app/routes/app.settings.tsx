import { useState } from "react";
import { useFetcher, useRouteLoaderData } from "@remix-run/react";
import { Trans, useTranslation } from "react-i18next";

import { localeLabels, supportedLngs } from "../i18n/config";
import type { loader as rootLoader } from "../root";

export const handle = { i18n: ["settings", "common"] };

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

const SaveBtn = ({ onClick, label }: { onClick?: () => void; label?: string }) => {
  const { t } = useTranslation("common");
  return (
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
    {label ?? t("actions.save")}
  </button>
  );
};

const VerifyBtn = ({ onClick }: { onClick?: () => void }) => {
  const { t } = useTranslation("settings");
  return (
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
    {t("verify")}
  </button>
  );
};

// ✅ Reusable link-styled anchor — enforces real href, no href="#"
// `children` is optional because <Trans> supplies it by cloning the element,
// so call sites inside a `components` map pass href only.
const DocLink = ({ href, children }: { href: string; children?: React.ReactNode }) => (
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
  const { t } = useTranslation("settings");
  const [noMonthly, setNoMonthly] = useState(false);
  const [altEmail, setAltEmail] = useState("");
  const [themeNotif, setThemeNotif] = useState(true);

  return (
    <div>
      <SectionRow
        title={t("basic.monthlyTitle")}
        description={t("basic.monthlyDesc")}
      >
        <Checkbox
          label={t("basic.monthlyOptOut")}
          checked={noMonthly}
          onChange={() => setNoMonthly(!noMonthly)}
        />
        <div style={{ marginTop: 20 }}>
          <FieldLabel>{t("basic.altEmailLabel")}</FieldLabel>
          <TextInput
            placeholder={t("basic.altEmailPlaceholder")}
            value={altEmail}
            onChange={(e) => setAltEmail(e.target.value)}
          />
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
            {t("basic.altEmailHelp")}
          </p>
        </div>
      </SectionRow>

      <SectionRow
        title={t("basic.themeTitle")}
        description={t("basic.themeDesc")}
      >
        <Checkbox
          label={t("basic.themeOptIn")}
          checked={themeNotif}
          onChange={() => setThemeNotif(!themeNotif)}
        />
      </SectionRow>
    </div>
  );
};

const LanguageTab = () => {
  const { t } = useTranslation("settings");
  const fetcher = useFetcher();

  // Read the locale from root rather than re-resolving it here: root is the
  // single source of truth that entry.server rendered with.
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const locale = rootData?.locale ?? "en";

  // Show the pending choice immediately rather than waiting for the round trip,
  // so the select doesn't visibly snap back before revalidation lands.
  const pending = fetcher.formData?.get("locale");
  const value = typeof pending === "string" ? pending : locale;

  return (
    <SectionRow title={t("language.title")} description={t("language.desc")}>
      <FieldLabel>{t("language.label")}</FieldLabel>
      <SelectInput
        options={supportedLngs.map((v) => ({ value: v, label: localeLabels[v] }))}
        value={value}
        onChange={(e) =>
          fetcher.submit(
            { locale: e.target.value },
            { method: "post", action: "/api/locale" },
          )
        }
      />
      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
        {t("language.help")}
      </p>
    </SectionRow>
  );
};

const BlockedDomainsTab = () => {
  const { t } = useTranslation("settings");
  const [domains, setDomains] = useState("");
  return (
    <SectionRow
      title={t("blockedDomains.title")}
      description={t("blockedDomains.desc")}
    >
      <FieldLabel>{t("blockedDomains.label")}</FieldLabel>
      <TextInput
        placeholder={t("blockedDomains.placeholder")}
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

const ApiTokensTab = () => {
  const { t } = useTranslation("settings");
  return (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{t("apiTokens.title")}</h3>
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
        {t("apiTokens.newKey")}
      </button>
    </div>
    <Card>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            {[t("apiTokens.columns.name"), t("apiTokens.columns.supportEmail"), t("apiTokens.columns.token"), t("apiTokens.columns.copy"), t("apiTokens.columns.lastUpdated"), t("apiTokens.columns.actions")].map((h) => (
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
              {t("apiTokens.noRecords")}
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
  );
};

const DomainSetupTab = () => {
  const { t } = useTranslation("settings");
  const [method, setMethod] = useState("smtp");
  const [server, setServer] = useState("");
  const [port, setPort] = useState("587");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState("plain");
  const [ssl, setSsl] = useState("true");

  return (
    <SectionRow title={t("domainSetup.title")} description="">
      <FieldLabel>{t("domainSetup.methodLabel")}</FieldLabel>
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
        <Trans
          i18nKey="settings:domainSetup.docsHint"
          components={{ link: <DocLink href="https://docs.smartformly.kaswebtechsolutions.com/smtp-setup" /> }}
        />
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
          {t("domainSetup.detailsHeading")}
        </h4>
        <FieldLabel>{t("domainSetup.serverLabel")}</FieldLabel>
        <TextInput placeholder="smtp.gmail.com" value={server} onChange={(e) => setServer(e.target.value)} />
        <div style={{ marginTop: 14 }}>
          <FieldLabel>{t("domainSetup.portLabel")}</FieldLabel>
          <TextInput placeholder="587" value={port} onChange={(e) => setPort(e.target.value)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <FieldLabel>{t("domainSetup.emailLabel")}</FieldLabel>
          <TextInput placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "24px 0 16px" }}>
          {t("domainSetup.authHeading")}
        </h4>
        <FieldLabel>{t("domainSetup.passwordLabel")}</FieldLabel>
        <TextInput
          type="password"
          placeholder={t("domainSetup.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div style={{ marginTop: 14 }}>
          <FieldLabel>{t("domainSetup.authLabel")}</FieldLabel>
          <TextInput placeholder="plain" value={auth} onChange={(e) => setAuth(e.target.value)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <FieldLabel>{t("domainSetup.sslLabel")}</FieldLabel>
          <SelectInput
            options={[
              { value: "true", label: t("domainSetup.sslTrue") },
              { value: "false", label: t("domainSetup.sslFalse") },
            ]}
            value={ssl}
            onChange={(e) => setSsl(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 20 }}>
        <VerifyBtn />
        <SaveBtn label={t("submit")} />
      </div>
      <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 8 }}>
        {t("domainSetup.verifyNote")}
      </p>
    </SectionRow>
  );
};

const PaymentIntegrationTab = () => {
  const { t } = useTranslation("settings");
  const [paymentType, setPaymentType] = useState("stripe");
  const [pubKey, setPubKey] = useState("");
  const [secKey, setSecKey] = useState("");

  const paymentDocs: Record<string, string> = {
    stripe: "https://dashboard.stripe.com/apikeys",
    paypal: "https://developer.paypal.com/dashboard/applications",
  };

  return (
    <SectionRow title={t("payment.title")} description="">
      <FieldLabel>{t("payment.typeLabel")}</FieldLabel>
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
          {t("payment.connectHeading", { provider: paymentType })}
        </h4>
        <FieldLabel>{t("payment.publishableKey")}</FieldLabel>
        <TextInput placeholder={t("payment.publishableKey")} value={pubKey} onChange={(e) => setPubKey(e.target.value)} />
        <div style={{ marginTop: 14 }}>
          <FieldLabel>{t("payment.secretKey")}</FieldLabel>
          <TextInput placeholder={t("payment.secretKey")} value={secKey} onChange={(e) => setSecKey(e.target.value)} />
        </div>
        {/* ✅ Fixed: href="#" → real payment provider URL */}
        <p style={{ fontSize: 12, color: "#2563eb", marginTop: 12 }}>
          <Trans
            i18nKey="settings:payment.docsHint"
            values={{ provider: paymentType }}
            components={{ link: <DocLink href={paymentDocs[paymentType]} /> }}
          />
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <SaveBtn />
      </div>
    </SectionRow>
  );
};

const EmailServiceTab = () => {
  const { t } = useTranslation("settings");
  const [integrationType, setIntegrationType] = useState("mailchimp");
  const [apiKey, setApiKey] = useState("");

  const serviceDocs: Record<string, string> = {
    mailchimp: "https://mailchimp.com/help/about-api-keys/",
    klaviyo: "https://help.klaviyo.com/hc/en-us/articles/115005062267",
    sendinblue: "https://help.brevo.com/hc/en-us/articles/209467485",
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <SectionRow title={t("emailService.title")} description="">
      <FieldLabel>{t("emailService.typeLabel")}</FieldLabel>
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
          {t("emailService.connectHeading", { service: capitalize(integrationType) })}
        </h4>
        <FieldLabel>{t("emailService.keyLabel", { service: capitalize(integrationType) })}</FieldLabel>
        <TextInput
          placeholder={t("emailService.keyLabel", { service: capitalize(integrationType) })}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        {/* ✅ Fixed: href="#" → real service docs URL */}
        <p style={{ fontSize: 12, color: "#2563eb", marginTop: 12 }}>
          <Trans
            i18nKey="settings:emailService.docsHint"
            values={{ service: capitalize(integrationType) }}
            components={{ link: <DocLink href={serviceDocs[integrationType]} /> }}
          />
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <SaveBtn />
      </div>
    </SectionRow>
  );
};

const ZerobounceTab = () => {
  const { t } = useTranslation("settings");
  const [zbKey, setZbKey] = useState("");

  return (
    <SectionRow title={t("zerobounce.title")} description="">
      <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
        {t("zerobounce.connectHeading")}
      </h4>
      <FieldLabel>{t("zerobounce.keyLabel")}</FieldLabel>
      <TextInput placeholder={t("zerobounce.keyLabel")} value={zbKey} onChange={(e) => setZbKey(e.target.value)} />
      {/* ✅ Fixed: href="#" → real Zerobounce API key URL */}
      <p style={{ fontSize: 12, color: "#2563eb", marginTop: 12 }}>
        <Trans
          i18nKey="settings:zerobounce.docsHint"
          components={{ link: <DocLink href="https://app.zerobounce.net/members/apikey" /> }}
        />
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <SaveBtn />
      </div>
    </SectionRow>
  );
};

/* ── INTEGRATIONS WRAPPER ── */
const IntegrationsTab = () => {
  const { t } = useTranslation("settings");
  const [subTab, setSubTab] = useState("api-tokens");

  const subTabs = [
    { id: "api-tokens", label: t("integrations.apiTokens"), badge: "Pro" },
    { id: "domain-setup", label: t("integrations.domainSetup"), badge: "Pro" },
    { id: "payment", label: t("integrations.payment"), badge: "Pro" },
    { id: "email-service", label: t("integrations.emailService"), badge: "Pro" },
    { id: "zerobounce", label: t("integrations.zerobounce"), badge: "Pro+", badgeVariant: "pro+" },
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
  const { t } = useTranslation("settings");
  const [activeTab, setActiveTab] = useState("basic");

  const mainTabs = [
    { id: "basic", label: t("tabs.basic") },
    { id: "language", label: t("tabs.language") },
    { id: "blocked-domains", label: t("tabs.blockedDomains"), badge: "Pro" },
    { id: "integrations", label: t("tabs.integrations"), badge: "Pro" },
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
          {t("title")}
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
          {t("footer.tagline")}{" "}
          <DocLink href="https://smartformly.kaswebtechsolutions.com/privacy">
            {t("footer.privacy")}
          </DocLink>{" "}
          |{" "}
          <DocLink href="https://smartformly.kaswebtechsolutions.com/terms">
            {t("footer.terms")}
          </DocLink>
        </p>
      </div>
    </div>
  );
}