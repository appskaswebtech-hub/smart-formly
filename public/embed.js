// if (window.__smartformly_loaded) return;
// window.__smartformly_loaded = true;


// (function () {
//   const scripts = document.querySelectorAll("script[data-smartformly-id]");
//   scripts.forEach(async (script) => {
//     const formId = script.getAttribute("data-smartformly-id");
//     const appUrl = script.getAttribute("data-app-url");
//     const container = document.getElementById(`sf-form-${formId}`);
//     if (!container || !formId) return;

//     // Fetch form config
//     const res = await fetch(`${appUrl}/api/forms/${formId}`);
//     if (!res.ok) return;
//     // const { fields, settings } = await res.json();
//     const data = await res.json();
// if (!data || !data.fields) return;

// const { fields, settings } = data;

//     // Render form
//     container.innerHTML = buildFormHTML(fields, settings);

//     // Handle submit
//     container.querySelector("form").addEventListener("submit", async (e) => {
//       e.preventDefault();
//       const formData = Object.fromEntries(new FormData(e.target));
//       const btn = e.target.querySelector("button[type=submit]");
//       btn.disabled = true;
//       btn.textContent = "Sending...";

//       try {
//         const r = await fetch(`${appUrl}/api/submit/${formId}`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(formData),
//         });
//         const data = await r.json();
//         if (data.success) {
//           container.innerHTML = `<div style="padding:20px;background:#ECFDF5;border-radius:8px;color:#065F46;font-weight:500">
//             ✓ ${data.message}
//           </div>`;
//         } else {
//           // Show field errors
//           Object.entries(data.errors || {}).forEach(([id, msg]) => {
//             const errEl = container.querySelector(`[data-error="${id}"]`);
//             if (errEl) errEl.textContent = msg;
//           });
//           btn.disabled = false;
//           btn.textContent = settings.submitLabel || "Submit";
//         }
//       } catch {
//         btn.disabled = false;
//         btn.textContent = "Error — try again";
//       }
//     });
//   });

//   function buildFormHTML(fields, settings) {
//     const fieldHTML = fields.map((f) => {
//       const base = `name="${f.id}" id="${f.id}" placeholder="${f.placeholder || ""}"
//         style="width:100%;padding:10px 12px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;font-family:inherit;margin-top:4px"`;
//       let input = "";
//       if (f.type === "textarea") input = `<textarea ${base} rows="4"></textarea>`;
//       else if (f.type === "select") input = `<select ${base}>${(f.options||[]).map(o=>`<option>${o}</option>`).join("")}</select>`;
//       else input = `<input type="${f.type}" ${base} ${f.required ? "required" : ""}>`;
//       return `<div style="margin-bottom:16px">
//         <label for="${f.id}" style="font-size:14px;font-weight:500;color:#374151">
//           ${f.label}${f.required ? ' <span style="color:red">*</span>' : ""}
//         </label>
//         ${input}
//         <div data-error="${f.id}" style="color:#C0392B;font-size:12px;margin-top:4px"></div>
//       </div>`;
//     }).join("");

//     return `<form style="max-width:480px;font-family:-apple-system,sans-serif">
//       ${fieldHTML}
//       <button type="submit" style="background:#5C6AC4;color:#fff;border:none;padding:11px 24px;
//         border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;width:100%">
//         ${settings.submitLabel || "Submit"}
//       </button>
//     </form>`;
//   }
// })();


(function () {
  if (window.__smartformly_loaded) return;
  window.__smartformly_loaded = true;

  const scripts = document.querySelectorAll("script[data-smartformly-id]");

  scripts.forEach(async (script) => {
    const formId = script.getAttribute("data-smartformly-id");
    const appUrl = script.getAttribute("data-app-url");
    const container = document.getElementById(`sf-form-${formId}`);
    if (!container || !formId) return;

    container.innerHTML = "Loading form...";

    try {
      const res = await fetch(`${appUrl}/api/forms/${formId}`);
      if (!res.ok) {
        container.innerHTML = "Failed to load form";
        return;
      }

      const data = await res.json();
      if (!data || !data.fields) return;

      const { fields, settings } = data;

      container.innerHTML = buildFormHTML(fields, settings);

      container.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = Object.fromEntries(new FormData(e.target));
        const btn = e.target.querySelector("button[type=submit]");
        btn.disabled = true;
        btn.textContent = "Sending...";

        try {
          const r = await fetch(`${appUrl}/api/submit/${formId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

          const data = await r.json();

          if (data.success) {
            container.innerHTML = `<div style="padding:20px;background:#ECFDF5;border-radius:8px;color:#065F46">
              ✓ ${data.message}
            </div>`;
          } else {
            Object.entries(data.errors || {}).forEach(([id, msg]) => {
              const errEl = container.querySelector(`[data-error="${id}"]`);
              if (errEl) errEl.textContent = msg;
            });

            btn.disabled = false;
            btn.textContent = settings.submitLabel || "Submit";
          }
        } catch {
          btn.disabled = false;
          btn.textContent = "Error — try again";
        }
      });

    } catch {
      container.innerHTML = "Error loading form";
    }
  });

  function buildFormHTML(fields, settings) {
    return `<form style="max-width:480px">
      ${fields.map(f => {
        let input = "";

        if (f.type === "textarea") {
          input = `<textarea name="${f.id}"></textarea>`;
        } else {
          input = `<input type="${f.type}" name="${f.id}" ${f.required ? "required" : ""}>`;
        }

        return `<div style="margin-bottom:10px">
          <label>${f.label}</label>
          ${input}
          <div data-error="${f.id}" style="color:red;font-size:12px"></div>
        </div>`;
      }).join("")}

      <button type="submit">
        ${settings.submitLabel || "Submit"}
      </button>
    </form>`;
  }
})();