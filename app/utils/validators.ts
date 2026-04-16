import type { FormField } from "../models/form.server";

export type ValidationError = Record<string, string>;

export function validateFormSubmission(
  fields: FormField[],
  data: Record<string, string>
): ValidationError {
  const errors: ValidationError = {};

  for (const field of fields) {
    const value = data[field.id]?.trim() ?? "";

    if (field.required && !value) {
      errors[field.id] = `${field.label} is required`;
      continue;
    }

    if (!value) continue;

    switch (field.type) {
      case "email": {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(value)) {
          errors[field.id] = "Please enter a valid email address";
        }
        break;
      }
      case "phone": {
        const phoneRe = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRe.test(value)) {
          errors[field.id] = "Please enter a valid phone number";
        }
        break;
      }
      case "text":
      case "textarea": {
        if (value.length > 5000) {
          errors[field.id] = `${field.label} must be under 5000 characters`;
        }
        break;
      }
    }
  }

  return errors;
}

export function validateFormConfig(data: {
  formName?: string;
  fields?: unknown;
  settings?: unknown;
}): ValidationError {
  const errors: ValidationError = {};

  if (!data.formName || data.formName.trim().length === 0) {
    errors.formName = "Form name is required";
  } else if (data.formName.trim().length > 100) {
    errors.formName = "Form name must be under 100 characters";
  }

  if (!Array.isArray(data.fields)) {
    errors.fields = "Fields must be an array";
  } else if (data.fields.length === 0) {
    errors.fields = "Add at least one field to your form";
  } else if (data.fields.length > 30) {
    errors.fields = "Forms can have a maximum of 30 fields";
  }

  if (!data.settings || typeof data.settings !== "object") {
    errors.settings = "Invalid form settings";
  }

  return errors;
}

export function hasErrors(errors: ValidationError): boolean {
  return Object.keys(errors).length > 0;
}

export function sanitizeString(value: string): string {
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

export function sanitizeSubmission(
  data: Record<string, string>
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = sanitizeString(value);
  }
  return sanitized;
}