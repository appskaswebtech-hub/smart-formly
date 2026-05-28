/**
 * SmartFormly Theme Extension
 * Handles form submission + all afterSubmissionAction behaviors:
 *   - clear_and_allow       : clear form, show success, allow resubmit
 *   - one_entry             : show thank you message + timer, then hide
 *   - redirect              : redirect to URL after success
 *   - hide_and_show_message : hide form, show thank you message + timer
 *   - show_and_download     : show success + trigger CSV download link
 */

(function () {
  "use strict";

  /* ── Config ──────────────────────────────────────────────────────── */
  // Replace with your actual app URL or inject via Liquid
  const APP_URL = window.smartFormlyAppUrl || "";

  /* ── Init all forms on the page ──────────────────────────────────── */
  function init() {
    const forms = document.querySelectorAll("[data-smartformly-form]");
    forms.forEach(initForm);
  }

  function initForm(wrapper) {
    const formId  = wrapper.dataset.smartformlyForm;
    const formEl  = wrapper.querySelector("form");
    if (!formEl || !formId) return;

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      handleSubmit(wrapper, formEl, formId);
    });
  }

  /* ── Collect form data ───────────────────────────────────────────── */
  function collectData(formEl) {
    const data = {};
    const inputs = formEl.querySelectorAll("[data-field-id]");
    inputs.forEach(function (input) {
      const id = input.dataset.fieldId;
      if (!id) return;
      if (input.type === "checkbox") {
        if (!data[id]) data[id] = [];
        if (input.checked) data[id].push(input.value || input.name);
      } else if (input.type === "radio") {
        if (input.checked) data[id] = input.value;
      } else {
        data[id] = input.value;
      }
    });
    return data;
  }

  /* ── Submit handler ──────────────────────────────────────────────── */
  async function handleSubmit(wrapper, formEl, formId) {
    const submitBtn = formEl.querySelector("[data-submit-btn]") ||
                      formEl.querySelector("button[type=submit]") ||
                      formEl.querySelector("input[type=submit]");

    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn._originalText = submitBtn.textContent;
      submitBtn.textContent = "Submitting…";
    }

    // Clear previous messages
    clearMessages(wrapper);

    const submissionData = collectData(formEl);

    try {
      const res = await fetch(`${APP_URL}/api/submit/${formId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(submissionData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Show validation errors or generic error
        const msgs = data.errors?.length ? data.errors : [data.error || "Something went wrong."];
        showError(wrapper, msgs.join("<br>"));
        resetButton(submitBtn);
        return;
      }

      // ── Handle afterSubmissionAction ─────────────────────────────
      const action       = data.afterSubmissionAction || "clear_and_allow";
      const redirectUrl  = data.redirectUrl           || "";
      const tyMessage    = data.thankYouMessage       || data.message || "Thank you for your submission!";
      const timerSec     = Number(data.thankYouTimerSec) || 5;
      const successMsg   = data.message               || "Thank you for your submission!";

      switch (action) {

        case "redirect":
          showSuccess(wrapper, successMsg);
          setTimeout(function () {
            window.location.href = redirectUrl || window.location.href;
          }, 1200);
          break;

        case "hide_and_show_message":
          formEl.style.display = "none";
          showThankYou(wrapper, tyMessage, timerSec, function () {
            // After timer: optionally hide the whole block
            // wrapper.style.display = "none";
          });
          resetButton(submitBtn);
          break;

        case "one_entry":
          formEl.style.display = "none";
          showThankYou(wrapper, tyMessage, timerSec, function () {
            // Keep hidden — only one entry allowed
          });
          resetButton(submitBtn);
          break;

        case "show_and_download":
          showSuccess(wrapper, successMsg);
          formEl.reset();
          resetButton(submitBtn);
          // Trigger download of submissions (link to submissions page or CSV)
          if (data.submissionId) {
            const link = document.createElement("a");
            link.href     = `${APP_URL}/api/submissions/${formId}/export`;
            link.download = "responses.csv";
            link.click();
          }
          break;

        case "clear_and_allow":
        default:
          showSuccess(wrapper, successMsg);
          formEl.reset();
          resetButton(submitBtn);
          break;
      }

    } catch (err) {
      console.error("[SmartFormly] Submission error:", err);
      showError(wrapper, "Network error. Please try again.");
      resetButton(submitBtn);
    }
  }

  /* ── UI helpers ──────────────────────────────────────────────────── */

  function clearMessages(wrapper) {
    wrapper.querySelectorAll(
      ".sf-success, .sf-error, .sf-thankyou"
    ).forEach(function (el) { el.remove(); });
  }

  function showSuccess(wrapper, message) {
    clearMessages(wrapper);
    const el = document.createElement("div");
    el.className = "sf-success";
    el.innerHTML = message;
    el.style.cssText = [
      "margin-top:16px",
      "padding:12px 16px",
      "background:#d4edda",
      "color:#155724",
      "border:1px solid #c3e6cb",
      "border-radius:6px",
      "font-size:14px",
      "line-height:1.5",
    ].join(";");
    wrapper.appendChild(el);
  }

  function showError(wrapper, message) {
    clearMessages(wrapper);
    const el = document.createElement("div");
    el.className = "sf-error";
    el.innerHTML = message;
    el.style.cssText = [
      "margin-top:16px",
      "padding:12px 16px",
      "background:#f8d7da",
      "color:#721c24",
      "border:1px solid #f5c6cb",
      "border-radius:6px",
      "font-size:14px",
      "line-height:1.5",
    ].join(";");
    wrapper.appendChild(el);
  }

  function showThankYou(wrapper, message, timerSec, onDone) {
    clearMessages(wrapper);
    const el = document.createElement("div");
    el.className = "sf-thankyou";
    el.style.cssText = [
      "margin-top:16px",
      "padding:20px",
      "background:#EEF0FB",
      "border:1px solid #c3c8f5",
      "border-radius:8px",
      "text-align:center",
    ].join(";");

    const msgEl = document.createElement("div");
    msgEl.innerHTML = message;
    msgEl.style.cssText = "font-size:15px;color:#111827;margin-bottom:12px;";

    const timerEl = document.createElement("div");
    timerEl.style.cssText = "font-size:12px;color:#6B7280;";

    el.appendChild(msgEl);
    if (timerSec > 0) el.appendChild(timerEl);
    wrapper.appendChild(el);

    if (timerSec <= 0) { onDone && onDone(); return; }

    let remaining = timerSec;
    timerEl.textContent = `This message will close in ${remaining}s`;

    const interval = setInterval(function () {
      remaining--;
      timerEl.textContent = `This message will close in ${remaining}s`;
      if (remaining <= 0) {
        clearInterval(interval);
        el.remove();
        onDone && onDone();
      }
    }, 1000);
  }

  function resetButton(btn) {
    if (!btn) return;
    btn.disabled    = false;
    btn.textContent = btn._originalText || "Submit";
  }

  /* ── Boot ────────────────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();