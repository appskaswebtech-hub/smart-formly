import { useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import { Select } from "@shopify/polaris";
import { useTranslation } from "react-i18next";

import { localeLabels, supportedLngs } from "../i18n/config";

const options = supportedLngs.map((value) => ({
  value,
  label: localeLabels[value],
}));

export default function LanguagePicker({ locale }: { locale: string }) {
  const fetcher = useFetcher();
  const { t } = useTranslation("common");

  const handleChange = useCallback(
    (value: string) => {
      fetcher.submit(
        { locale: value },
        { method: "post", action: "/api/locale" },
      );
    },
    [fetcher],
  );

  // Show the pending choice immediately rather than waiting for the round trip,
  // so the select doesn't visibly snap back before revalidation lands.
  const pending = fetcher.formData?.get("locale");
  const value = typeof pending === "string" ? pending : locale;

  return (
    <div style={{ minWidth: 150 }}>
      <Select
        label={t("language.label")}
        labelHidden
        options={options}
        value={value}
        onChange={handleChange}
        disabled={fetcher.state !== "idle"}
      />
    </div>
  );
}
