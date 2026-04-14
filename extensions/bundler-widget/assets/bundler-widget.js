/**
 * Bundler – Quantity Breaks Widget (Debug version)
 */
(function () {
  'use strict';

  console.log('[Bundler] Widget script loaded');

  /* ─── Helpers ──────────────────────────────── */

  function formatMoney(amount, symbol) {
    return symbol + parseFloat(amount).toFixed(2);
  }

  function calcPrice(basePrice, qty, discountType, discountValue) {
    var total = basePrice * qty;
    if (!discountValue || discountValue === 0) {
      return { final: total, original: null };
    }
    var final = total;
    if (discountType === 'PERCENTAGE') {
      final = total * (1 - discountValue / 100);
    } else if (discountType === 'FIXED_AMOUNT') {
      final = total - discountValue;
    } else if (discountType === 'FIXED_PRICE') {
      final = discountValue * qty;
    }
    return { final: Math.max(0, final), original: total };
  }

  function template(str, qb) {
    if (!str) return '';
    return str
      .replace(/\{\{discount_value\}\}/g, qb.discountValue)
      .replace(/\{\{discount_unit\}\}/g, qb.discountType === 'PERCENTAGE' ? '%' : '$')
      .replace(/\{\{quantity\}\}/g, qb.quantity)
      .replace(/\{\{max_quantity\}\}/g, qb.maxQuantity || '');
  }

  /* ─── Render one widget instance ───────────── */

  function renderWidget(root, bundle, basePrice, currencySymbol) {
    console.log('[Bundler] Rendering widget for bundle:', bundle.title, 'basePrice:', basePrice);

    var colors = {
      primary:    root.dataset.primaryColor   || '#1a1a2e',
      selectedBg: root.dataset.selectedBg     || '#f0f4ff',
      badgeBg:    root.dataset.badgeBg        || '#1a1a2e',
      badgeText:  root.dataset.badgeText      || '#ffffff',
      text:       root.dataset.textColor      || '#333333',
      border:     root.dataset.borderColor    || '#e0e0e0',
      original:   root.dataset.originalColor  || '#999999',
    };

    root.style.setProperty('--bundler-primary',     colors.primary);
    root.style.setProperty('--bundler-selected-bg', colors.selectedBg);
    root.style.setProperty('--bundler-badge-bg',    colors.badgeBg);
    root.style.setProperty('--bundler-badge-text',  colors.badgeText);
    root.style.setProperty('--bundler-text',        colors.text);
    root.style.setProperty('--bundler-border',      colors.border);
    root.style.setProperty('--bundler-original',    colors.original);

    var breaks = bundle.quantityBreaks;
    if (!breaks || breaks.length === 0) {
      console.warn('[Bundler] No quantity breaks found');
      root.classList.add('bundler-qb--hidden');
      return;
    }

    console.log('[Bundler] Quantity breaks:', breaks.length);

    // Build HTML
    var html = '<div class="bundler-qb__title">' + bundle.title + '</div>';
    html += '<div class="bundler-qb__options">';

    breaks.forEach(function (qb, idx) {
      var prices  = calcPrice(basePrice, qb.quantity, qb.discountType, qb.discountValue);
      var savings = qb.discountValue > 0 ? template(qb.savingsText, qb) : '';
      var desc    = template(qb.description, qb);
      var sel     = idx === 0 ? ' bundler-qb__option--selected' : '';

      html += '<div class="bundler-qb__option' + sel + '"'
            + ' data-index="' + idx + '"'
            + ' data-qty="' + qb.quantity + '"'
            + ' data-break-id="' + qb.id + '"'
            + ' data-bundle-id="' + bundle.id + '"'
            + ' role="radio"'
            + ' aria-checked="' + (idx === 0 ? 'true' : 'false') + '"'
            + ' tabindex="0">'
            + '  <span class="bundler-qb__radio"><span class="bundler-qb__radio-inner"></span></span>'
            + '  <span class="bundler-qb__label">' + desc + '</span>'
            + '  <span class="bundler-qb__prices">';

      if (savings) {
        html += '<span class="bundler-qb__badge">' + savings + '</span>';
      }
      html += '<span class="bundler-qb__price">' + formatMoney(prices.final, currencySymbol) + '</span>';
      if (prices.original) {
        html += '<span class="bundler-qb__original">' + formatMoney(prices.original, currencySymbol) + '</span>';
      }
      html += '  </span></div>';
    });

    html += '</div>';
    root.innerHTML = html;
    root.classList.add('bundler-qb--loaded');

    // ── Interaction ──
    var options = root.querySelectorAll('.bundler-qb__option');
    var selectedQty = breaks[0]?.quantity || 1;
    var selectedBreakId = breaks[0]?.id || '';
    var selectedBundleId = bundle.id || '';
    console.log('[Bundler] Initial selectedQty:', selectedQty);

    function selectOption(el) {
      // Deselect all
      options.forEach(function (o) {
        o.classList.remove('bundler-qb__option--selected');
        o.setAttribute('aria-checked', 'false');
      });
      el.classList.add('bundler-qb__option--selected');
      el.setAttribute('aria-checked', 'true');

      selectedQty = parseInt(el.dataset.qty, 10);
      selectedBreakId = el.dataset.breakId || '';
      selectedBundleId = el.dataset.bundleId || '';
      console.log('[Bundler] Option selected → qty:', selectedQty, 'breakId:', selectedBreakId, 'bundleId:', selectedBundleId);

      // Update ALL quantity inputs on the page
      var qtyInputs = document.querySelectorAll('input[name="quantity"]');
      console.log('[Bundler] Found quantity inputs:', qtyInputs.length);

      qtyInputs.forEach(function (qtyInput, i) {
        console.log('[Bundler] Updating input #' + i, 'from', qtyInput.value, 'to', selectedQty);
        qtyInput.value = selectedQty;
        qtyInput.setAttribute('value', selectedQty);
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
        qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      if (qtyInputs.length === 0) {
        console.warn('[Bundler] ⚠️ No quantity inputs found on page!');
      }
    }

    // Helper: add bundler properties to a cart body object
    // Different properties = Shopify creates SEPARATE cart lines
    function injectBundlerProperties(body) {
      var props = {
        '_bundler_break_id': selectedBreakId,
        '_bundler_bundle_id': selectedBundleId,
        '_bundler_qty': String(selectedQty)
      };

      // Single item format: { id, quantity, properties }
      if (body.id || body.quantity !== undefined) {
        body.quantity = selectedQty;
        if (!body.properties) body.properties = {};
        Object.assign(body.properties, props);
        console.log('[Bundler] Injected properties into single item:', JSON.stringify(props));
      }

      // Multi-item format: { items: [{ id, quantity, properties }] }
      if (Array.isArray(body.items)) {
        body.items.forEach(function (item) {
          item.quantity = selectedQty;
          if (!item.properties) item.properties = {};
          Object.assign(item.properties, props);
        });
        console.log('[Bundler] Injected properties into items array');
      }

      return body;
    }

    // Intercept form submit to force correct quantity + add hidden fields
    var forms = document.querySelectorAll(
      'form[action*="/cart/add"], form.product-form, .product-form form, product-form form'
    );
    console.log('[Bundler] Found forms to intercept:', forms.length);

    forms.forEach(function (form, i) {
      console.log('[Bundler] Intercepting form #' + i, form.action || form.className);
      form.addEventListener('submit', function (e) {
        console.log('[Bundler] Form submit intercepted! qty:', selectedQty, 'breakId:', selectedBreakId);
        var qtyInput = form.querySelector('input[name="quantity"]');
        if (qtyInput) {
          qtyInput.value = selectedQty;
        }
        // Add hidden property fields for separate cart lines
        ensureHidden(form, 'properties[_bundler_break_id]', selectedBreakId);
        ensureHidden(form, 'properties[_bundler_bundle_id]', selectedBundleId);
        ensureHidden(form, 'properties[_bundler_qty]', String(selectedQty));
      }, true);
    });

    function ensureHidden(form, name, value) {
      var input = form.querySelector('input[name="' + name + '"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        form.appendChild(input);
      }
      input.value = value;
    }

    // Intercept fetch calls to /cart/add.js — override qty + inject properties
    var originalFetch = window.fetch;
    window.fetch = function (url, opts) {
      if (typeof url === 'string' && url.includes('/cart/add')) {
        console.log('[Bundler] 🔥 Fetch intercepted:', url);
        console.log('[Bundler] Current selectedQty:', selectedQty, 'breakId:', selectedBreakId);
        try {
          if (opts && opts.body) {
            if (typeof opts.body === 'string') {
              var body = JSON.parse(opts.body);
              console.log('[Bundler] Original fetch body:', JSON.stringify(body));
              body = injectBundlerProperties(body);
              opts.body = JSON.stringify(body);
              console.log('[Bundler] Modified fetch body:', opts.body);
            } else if (opts.body instanceof FormData) {
              console.log('[Bundler] FormData body, setting quantity + properties');
              opts.body.set('quantity', selectedQty);
              opts.body.set('properties[_bundler_break_id]', selectedBreakId);
              opts.body.set('properties[_bundler_bundle_id]', selectedBundleId);
              opts.body.set('properties[_bundler_qty]', String(selectedQty));
            }
          }
        } catch (e) {
          console.error('[Bundler] Fetch intercept error:', e);
        }
      }
      return originalFetch.call(this, url, opts);
    };

    // Also intercept XMLHttpRequest for older themes
    var originalXHRSend = XMLHttpRequest.prototype.send;
    var originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      this._bundlerUrl = url;
      return originalXHROpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (body) {
      if (this._bundlerUrl && this._bundlerUrl.includes('/cart/add') && body) {
        console.log('[Bundler] 🔥 XHR intercepted:', this._bundlerUrl);
        try {
          if (typeof body === 'string') {
            var parsed = JSON.parse(body);
            console.log('[Bundler] Original XHR body:', JSON.stringify(parsed));
            parsed = injectBundlerProperties(parsed);
            body = JSON.stringify(parsed);
            console.log('[Bundler] Modified XHR body:', body);
          }
        } catch (e) {
          console.error('[Bundler] XHR intercept error:', e);
        }
      }
      return originalXHRSend.call(this, body);
    };

    // Click handler
    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        selectOption(this);
      });
      opt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectOption(this);
        }
      });
    });

    // Auto-select first option
    if (options.length > 0) {
      selectOption(options[0]);
    }

    console.log('[Bundler] ✅ Widget rendered successfully');
  }

  /* ─── Fetch & Init ─────────────────────────── */

  function initWidget(root) {
    var productId    = root.dataset.productId;
    var rawPrice     = root.dataset.productPrice;
    var currency     = root.dataset.currencySymbol || '$';
    var shop         = root.dataset.shop;
    var proxyPath    = root.dataset.proxyPath || '/apps/bundler';

    console.log('[Bundler] Init widget:', { productId: productId, rawPrice: rawPrice, shop: shop, proxyPath: proxyPath });

    var basePrice = parseFloat(rawPrice);
    if (isNaN(basePrice) || basePrice <= 0) {
      basePrice = parseFloat(rawPrice) / 100;
    }
    if (isNaN(basePrice) || basePrice <= 0) {
      console.error('[Bundler] Invalid base price:', rawPrice);
      root.classList.add('bundler-qb--hidden');
      return;
    }

    console.log('[Bundler] Base price:', basePrice);

    var url = proxyPath + '/api/widget-data'
            + '?shop=' + encodeURIComponent(shop)
            + '&productId=' + encodeURIComponent(productId);

    console.log('[Bundler] Fetching:', url);

    fetch(url)
      .then(function (res) {
        console.log('[Bundler] API response status:', res.status);
        return res.json();
      })
      .then(function (data) {
        console.log('[Bundler] API data:', JSON.stringify(data).substring(0, 200));
        if (data.bundles && data.bundles.length > 0) {
          renderWidget(root, data.bundles[0], basePrice, currency);
        } else {
          console.warn('[Bundler] No bundles found for this product');
          root.classList.add('bundler-qb--hidden');
        }
      })
      .catch(function (err) {
        console.error('[Bundler] Widget load error:', err);
        root.classList.add('bundler-qb--hidden');
      });
  }

  /* ─── Boot ─────────────────────────────────── */

  function boot() {
    var roots = document.querySelectorAll('.bundler-qb');
    console.log('[Bundler] Boot — found widget roots:', roots.length);
    roots.forEach(function (root) {
      if (root.dataset.bundlerInit) return;
      root.dataset.bundlerInit = 'true';
      initWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', boot);
  document.addEventListener('shopify:block:select', boot);

})();


// Price update function for widgets Start
// ═══════════════════════════════════════════════
// BUNDLER — Price Update Section (Clean Version)
// ═══════════════════════════════════════════════

// ── Cache ──────────────────────────────────────
var bundlerDataCache = null;

// ── Step 1 — API se bundle data fetch karo ─────
function fetchBundlerData() {
  var root = document.querySelector('.bundler-qb');
  if (!root) return Promise.resolve(null);

  var shop      = root.dataset.shop;
  var productId = root.dataset.productId;
  var proxyPath = root.dataset.proxyPath || '/apps/bundler';

  if (bundlerDataCache) return Promise.resolve(bundlerDataCache);

  return fetch(
    proxyPath + '/api/widget-data' +
    '?shop='      + encodeURIComponent(shop) +
    '&productId=' + encodeURIComponent(productId)
  )
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.bundles && data.bundles.length > 0) {
        bundlerDataCache = data.bundles[0];
        return bundlerDataCache;
      }
      return null;
    })
    .catch(function (err) {
      console.error('[Bundler] fetchBundlerData error:', err);
      return null;
    });
}

// ── Step 2 — Variant JSON se latest price nikalo ─
function getSelectedVariantPrice() {
  var variantIdEl = document.querySelector('input.product-variant-id');
  if (!variantIdEl) {
    console.warn('[Bundler] Variant ID input not found');
    return null;
  }

  var currentVariantId = parseInt(variantIdEl.getAttribute('value') || variantIdEl.value);
  console.log('[Bundler] Current Variant ID:', currentVariantId);

  // Saare script[type="application/json"] tags check karo
  var variants = null;
  document.querySelectorAll('script[type="application/json"]').forEach(function (script) {
    try {
      var parsed = JSON.parse(script.textContent);
      // Variants array identify karo — price field hona chahiye
      if (Array.isArray(parsed) && parsed[0] && parsed[0].price !== undefined) {
        variants = parsed;
      }
    } catch (e) { /* skip non-JSON scripts */ }
  });

  if (!variants) {
    console.warn('[Bundler] Variants JSON not found');
    return null;
  }

  var matched = variants.find(function (v) { return v.id === currentVariantId; });

  if (!matched) {
    console.warn('[Bundler] No variant matched for ID:', currentVariantId);
    return null;
  }

  console.log('[Bundler] Matched variant:', matched.title, '→ $' + (matched.price / 100).toFixed(2));
  return matched.price / 100; // cents → dollars
}

// ── Step 3 — Discount calculation ──────────────
function calcDiscountedPrice(basePrice, qty, discountType, discountValue) {
  var total = basePrice * qty;

  if (!discountValue || discountValue === 0) {
    return { final: total, original: null };
  }

  var final;
  if (discountType === 'PERCENTAGE') {
    final = total * (1 - discountValue / 100);      // 10% off
  } else if (discountType === 'FIXED_AMOUNT') {
    final = total - discountValue;                   // $5 off total
  } else if (discountType === 'FIXED_PRICE') {
    final = discountValue * qty;                     // $100 per item
  } else {
    final = total;
  }

  return { final: Math.max(0, final), original: total };
}

// ── Step 4 — Widget prices update karo ─────────
function updateBundlerPrices() {
  var bundlerOptions = document.querySelectorAll('.bundler-qb__option');
  if (bundlerOptions.length === 0) {
    console.log('[Bundler] No widget options found');
    return;
  }

  // Latest variant price lo
  var basePrice = getSelectedVariantPrice();
  if (!basePrice || isNaN(basePrice)) {
    console.error('[Bundler] Invalid base price — aborting update');
    return;
  }

  // Bundle data fetch karo (cached hoga mostly)
  fetchBundlerData().then(function (bundle) {
    if (!bundle) {
      console.warn('[Bundler] No bundle data available');
      return;
    }

    bundlerOptions.forEach(function (option) {
      var idx = parseInt(option.getAttribute('data-index'), 10);
      var qb  = bundle.quantityBreaks[idx];

      if (!qb) {
        console.warn('[Bundler] No quantity break for index:', idx);
        return;
      }

      console.log('[Bundler] Updating option', idx,
        '| qty:', qb.quantity,
        '| type:', qb.discountType,
        '| value:', qb.discountValue
      );

      var prices = calcDiscountedPrice(basePrice, qb.quantity, qb.discountType, qb.discountValue);

      // Original (strikethrough) price
      option.querySelectorAll('.bundler-qb__original').forEach(function (el) {
        if (prices.original) {
          el.innerText      = '$' + prices.original.toFixed(2);
          el.style.display  = '';
        } else {
          el.style.display  = 'none';
        }
      });

      // Final discounted price
      var finalEl = option.querySelector('.bundler-qb__price');
      if (finalEl) {
        finalEl.innerText = '$' + prices.final.toFixed(2);
      }
    });
  });
}

// ── Step 5 — Variant ID change watch karo ──────
function watchVariantChange() {
  var variantIdEl = document.querySelector('input.product-variant-id');
  if (!variantIdEl) {
    console.warn('[Bundler] Cannot watch — variant input not found');
    return;
  }

  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === 'value') {
        var newId = variantIdEl.getAttribute('value');
        console.log('[Bundler] ✅ Variant ID changed to:', newId);
        bundlerDataCache = null;      // cache clear karo
        updateBundlerPrices();        // turant update karo — no delay needed
      }
    });
  });

  observer.observe(variantIdEl, { attributes: true });
  console.log('[Bundler] 👀 Watching variant ID changes');
}

// ── Step 6 — Radio change listener (backup) ────
document.querySelectorAll('.product-form__input input[type="radio"]').forEach(function (input) {
  input.addEventListener('change', function () {
    console.log('[Bundler] Radio changed:', this.name, '=', this.value);
    // MutationObserver handle karega — no extra action needed
  });
});

// ── Boot ────────────────────────────────────────
watchVariantChange();

// ═══════════════════════════════════════════════
// Price update function for widgets End


