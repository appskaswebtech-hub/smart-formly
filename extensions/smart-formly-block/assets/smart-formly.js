/**
 * SmartFormly Theme Extension
 * Handles:
 *  - Popup mode (button / delay / exit_intent triggers)
 *  - Form submission
 *  - All afterSubmissionAction behaviors
 *  - After submit script
 *  - Ticket number display
 */

(function () {
  "use strict";

  const APP_URL = window.smartFormlyAppUrl || "";

  /* ══════════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════════ */
  function init() {
    const wrappers = document.querySelectorAll("[data-smartformly-form]");
    wrappers.forEach(function (wrapper) {
      const popupEnabled = wrapper.dataset.popupEnabled === "true";
      if (popupEnabled) {
        initPopup(wrapper);
      } else {
        initForm(wrapper);
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     POPUP
  ══════════════════════════════════════════════════════════════════ */
  function initPopup(wrapper) {
    const trigger         = wrapper.dataset.popupTrigger       || "button";
    const buttonText      = wrapper.dataset.popupButtonText    || "Open Form";
    const buttonBg        = wrapper.dataset.popupButtonBg      || "#000000";
    const buttonColor     = wrapper.dataset.popupButtonColor   || "#ffffff";
    const overlayBg       = wrapper.dataset.popupOverlayBg     || "#000000";
    const overlayOpacity  = parseFloat(wrapper.dataset.popupOverlayOpacity ?? "0.5");
    const closeOnOverlay  = wrapper.dataset.popupCloseOnOverlay !== "false";
    const popupWidth      = wrapper.dataset.popupWidth         || "600";
    const delaySeconds    = parseInt(wrapper.dataset.popupDelay || "3", 10);

    // ── Build overlay ─────────────────────────────────────────────
    const overlay = document.createElement("div");
    overlay.id = "sf-popup-overlay-" + wrapper.dataset.smartformlyForm;
    overlay.style.cssText = [
      "display:none",
      "position:fixed",
      "top:0", "left:0",
      "width:100%", "height:100%",
      "z-index:999998",
      "background:" + overlayBg,
      "opacity:" + overlayOpacity,
    ].join(";");
    document.body.appendChild(overlay);

    // ── Build modal container ─────────────────────────────────────
    const modal = document.createElement("div");
    modal.id = "sf-popup-modal-" + wrapper.dataset.smartformlyForm;
    modal.style.cssText = [
      "display:none",
      "position:fixed",
      "top:50%", "left:50%",
      "transform:translate(-50%,-50%)",
      "z-index:999999",
      "background:#fff",
      "border-radius:10px",
      "box-shadow:0 20px 60px rgba(0,0,0,0.3)",
      "width:90%",
      "max-width:" + popupWidth + "px",
      "max-height:90vh",
      "overflow-y:auto",
      "padding:32px",
      "box-sizing:border-box",
    ].join(";");

    // Close button inside modal
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&#x2715;";
    closeBtn.style.cssText = [
      "position:absolute",
      "top:12px", "right:16px",
      "background:none",
      "border:none",
      "font-size:20px",
      "cursor:pointer",
      "color:#6B7280",
      "line-height:1",
      "padding:4px 8px",
    ].join(";");
    closeBtn.addEventListener("click", function () { closePopup(overlay, modal); });

    // Move the form wrapper's contents into modal
    modal.style.position = "fixed"; // ensure position for close button
    modal.appendChild(closeBtn);
    modal.appendChild(wrapper);
    document.body.appendChild(modal);

    // Init the form now that it's inside modal
    initForm(wrapper);

    // ── Close on overlay click ────────────────────────────────────
    if (closeOnOverlay) {
      overlay.addEventListener("click", function () { closePopup(overlay, modal); });
    }

    // ── Trigger logic ─────────────────────────────────────────────
    if (trigger === "button") {
      // Insert a trigger button where the wrapper originally was
      const triggerBtn = document.createElement("button");
      triggerBtn.textContent = buttonText;
      triggerBtn.style.cssText = [
        "padding:10px 24px",
        "background:" + buttonBg,
        "color:" + buttonColor,
        "border:none",
        "border-radius:6px",
        "font-size:14px",
        "font-weight:600",
        "cursor:pointer",
        "font-family:inherit",
      ].join(";");
      triggerBtn.addEventListener("click", function () { openPopup(overlay, modal); });

      // Insert button at the original wrapper location
      // wrapper was moved into modal, so insert before modal
      document.body.insertBefore(triggerBtn, modal);

    } else if (trigger === "delay") {
      setTimeout(function () { openPopup(overlay, modal); }, delaySeconds * 1000);

    } else if (trigger === "exit_intent") {
      var exitFired = false;
      document.addEventListener("mouseleave", function (e) {
        if (e.clientY <= 0 && !exitFired) {
          exitFired = true;
          openPopup(overlay, modal);
        }
      });
    }
  }

  function openPopup(overlay, modal) {
    overlay.style.display = "block";
    modal.style.display   = "block";
    document.body.style.overflow = "hidden";
  }

  function closePopup(overlay, modal) {
    overlay.style.display = "none";
    modal.style.display   = "none";
    document.body.style.overflow = "";
  }

  /* ══════════════════════════════════════════════════════════════════
     FORM INIT
  ══════════════════════════════════════════════════════════════════ */
  function initForm(wrapper) {
    const formId = wrapper.dataset.smartformlyForm;
    const formEl = wrapper.querySelector("form");
    if (!formEl || !formId) return;

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      handleSubmit(wrapper, formEl, formId);
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     COLLECT DATA
  ══════════════════════════════════════════════════════════════════ */
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

  /* ══════════════════════════════════════════════════════════════════
     SUBMIT HANDLER
  ══════════════════════════════════════════════════════════════════ */
  async function handleSubmit(wrapper, formEl, formId) {
    const submitBtn = formEl.querySelector("[data-submit-btn]") ||
                      formEl.querySelector("button[type=submit]") ||
                      formEl.querySelector("input[type=submit]");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn._originalText = submitBtn.textContent;
      submitBtn.textContent = "Submitting…";
    }

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
        const msgs = data.errors?.length ? data.errors : [data.error || "Something went wrong."];
        showError(wrapper, msgs.join("<br>"));
        resetButton(submitBtn);
        return;
      }

      // ── Read response values ──────────────────────────────────
      const action      = data.afterSubmissionAction || "clear_and_allow";
      const redirectUrl = data.redirectUrl           || "";
      const tyMessage   = data.thankYouMessage       || data.message || "Thank you for your submission!";
      const timerSec    = Number(data.thankYouTimerSec) || 5;
      const successMsg  = data.message               || "Thank you for your submission!";
      const ticketNumber = data.ticketNumber         || null;

      // ── Run after submit script ───────────────────────────────
      const afterSubmitScript = wrapper.dataset.afterSubmitScript || "";
      if (afterSubmitScript) {
        try {
          const formData = { id: formId, submissionId: data.submissionId, fields: submissionData };
          // eslint-disable-next-line no-new-func
          new Function("formData", afterSubmitScript)(formData);
        } catch (scriptErr) {
          console.warn("[SmartFormly] afterSubmitScript error:", scriptErr);
        }
      }

      // ── Handle afterSubmissionAction ──────────────────────────
      switch (action) {

        case "redirect":
          showSuccess(wrapper, successMsg, ticketNumber);
          setTimeout(function () {
            window.location.href = redirectUrl || window.location.href;
          }, 1200);
          break;

        case "hide_and_show_message":
          formEl.style.display = "none";
          showThankYou(wrapper, tyMessage, timerSec, ticketNumber, function () {
            // timer expired — keep hidden
          });
          resetButton(submitBtn);
          break;

        case "one_entry":
          formEl.style.display = "none";
          showThankYou(wrapper, tyMessage, timerSec, ticketNumber, function () {
            // keep hidden — one entry only
          });
          resetButton(submitBtn);
          break;

        case "show_and_download":
          showSuccess(wrapper, successMsg, ticketNumber);
          formEl.reset();
          resetButton(submitBtn);
          if (data.submissionId) {
            const link = document.createElement("a");
            link.href     = `${APP_URL}/api/submissions/${formId}/export`;
            link.download = "responses.csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
          break;

        case "clear_and_allow":
        default:
          showSuccess(wrapper, successMsg, ticketNumber);
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

  /* ══════════════════════════════════════════════════════════════════
     UI HELPERS
  ══════════════════════════════════════════════════════════════════ */
  function clearMessages(wrapper) {
    wrapper.querySelectorAll(".sf-success, .sf-error, .sf-thankyou").forEach(function (el) {
      el.remove();
    });
  }

  function ticketBadge(ticketNumber) {
    if (!ticketNumber) return "";
    return `<div style="margin-top:10px;padding:8px 14px;background:#EEF0FB;border:1px solid #c3c8f5;border-radius:6px;font-size:13px;color:#3c3f8f;display:inline-block;">
      🎫 <strong>Your ticket number: #${ticketNumber}</strong>
    </div>`;
  }

  function showSuccess(wrapper, message, ticketNumber) {
    clearMessages(wrapper);
    const el = document.createElement("div");
    el.className = "sf-success";
    el.innerHTML = message + ticketBadge(ticketNumber);
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

  function showThankYou(wrapper, message, timerSec, ticketNumber, onDone) {
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
    msgEl.innerHTML = message + ticketBadge(ticketNumber);
    msgEl.style.cssText = "font-size:15px;color:#111827;margin-bottom:12px;";

    const timerEl = document.createElement("div");
    timerEl.style.cssText = "font-size:12px;color:#6B7280;";

    el.appendChild(msgEl);
    if (timerSec > 0) el.appendChild(timerEl);
    wrapper.appendChild(el);

    if (timerSec <= 0) { onDone && onDone(); return; }

    let remaining = timerSec;
    timerEl.textContent = "This message will close in " + remaining + "s";

    const interval = setInterval(function () {
      remaining--;
      timerEl.textContent = "This message will close in " + remaining + "s";
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

  /* ══════════════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════════════ */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();