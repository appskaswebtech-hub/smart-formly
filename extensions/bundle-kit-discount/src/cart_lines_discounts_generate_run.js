// import {
//   DiscountClass,
//   ProductDiscountSelectionStrategy,
// } from '../generated/api';

// /**
//  * @typedef {import("../generated/api").CartInput} RunInput
//  * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
//  */

// /**
//  * Bundler Quantity Breaks – Discount Function
//  *
//  * Reads bundle config from metafield. For each cart line:
//  *   1. Checks if any bundle applies to this product (ALL_PRODUCTS or matching product ID)
//  *   2. Finds the quantity break that matches the line quantity
//  *   3. Applies the discount
//  *
//  * No cart line properties needed — works purely from quantity + metafield config.
//  *
//  * @param {RunInput} input
//  * @returns {CartLinesDiscountsGenerateRunResult}
//  */
// export function cartLinesDiscountsGenerateRun(input) {
//   const hasProductDiscountClass = input.discount.discountClasses.includes(
//     DiscountClass.Product,
//   );

//   if (!hasProductDiscountClass || !input.cart.lines.length) {
//     return { operations: [] };
//   }

//   // Parse bundle config from metafield
//   const configRaw = input.discount.metafield?.value;
//   if (!configRaw) {
//     return { operations: [] };
//   }

//   let config;
//   try {
//     config = JSON.parse(configRaw);
//   } catch {
//     return { operations: [] };
//   }

//   if (!config.bundles || Object.keys(config.bundles).length === 0) {
//     return { operations: [] };
//   }

//   const candidates = [];

//   for (const line of input.cart.lines) {
//     const lineQty = line.quantity;
//     const productId = line.merchandise?.product?.id;

//     // Find the best matching bundle and break for this line
//     let bestDiscount = null;

//     for (const bundleId of Object.keys(config.bundles)) {
//       const bundle = config.bundles[bundleId];

//       // Check if bundle applies to this product
//       if (bundle.productSelectionType === 'SPECIFIC_PRODUCTS') {
//         if (!productId) continue;
//         let selectedIds = [];
//         try {
//           selectedIds = typeof bundle.selectedProductIds === 'string'
//             ? JSON.parse(bundle.selectedProductIds)
//             : (bundle.selectedProductIds || []);
//         } catch {
//           continue;
//         }
//         // Match product ID (could be numeric or gid format)
//         const matches = selectedIds.some(id =>
//           String(id) === String(productId) ||
//           productId.includes(String(id))
//         );
//         if (!matches) continue;
//       }
//       // ALL_PRODUCTS → applies to everything

//       // Find the best matching break for this quantity
//       // "Best" = highest quantity that is <= lineQty
//       const breaks = bundle.breaks || {};
//       let matchedBreak = null;

//       for (const breakId of Object.keys(breaks)) {
//         const brk = breaks[breakId];
//         if (brk.quantity <= lineQty && brk.discountValue > 0) {
//           if (!matchedBreak || brk.quantity > matchedBreak.quantity) {
//             matchedBreak = { ...brk, bundleName: bundle.name };
//           }
//         }
//       }

//       if (matchedBreak && (!bestDiscount || matchedBreak.discountValue > bestDiscount.discountValue)) {
//         bestDiscount = matchedBreak;
//       }
//     }

//     if (!bestDiscount) continue;

//     // Build discount value
//     let value;
//     if (bestDiscount.discountType === 'PERCENTAGE') {
//       value = { percentage: { value: bestDiscount.discountValue } };
//     } else if (bestDiscount.discountType === 'FIXED_AMOUNT') {
//       value = { fixedAmount: { amount: bestDiscount.discountValue } };
//     } else if (bestDiscount.discountType === 'FIXED_PRICE') {
//       // Fixed price per item: discount = (original - fixedPrice) * qty
//       const originalPerItem = parseFloat(line.cost.amountPerQuantity?.amount || '0');
//       const discountPerItem = originalPerItem - bestDiscount.discountValue;
//       if (discountPerItem <= 0) continue;
//       value = { fixedAmount: { amount: discountPerItem * lineQty } };
//     } else {
//       continue;
//     }

//     candidates.push({
//       message: bestDiscount.bundleName || 'Bundle discount',
//       targets: [{ cartLine: { id: line.id } }],
//       value: value,
//     });
//   }

//   if (candidates.length === 0) {
//     return { operations: [] };
//   }

//   return {
//     operations: [
//       {
//         productDiscountsAdd: {
//           candidates: candidates,
//           selectionStrategy: ProductDiscountSelectionStrategy.All,
//         },
//       },
//     ],
//   };
// }


import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasProductDiscountClass || !input.cart.lines.length) {
    return { operations: [] };
  }

  // Parse rules array from metafield
  const configRaw = input.discount.metafield?.value;
  if (!configRaw) return { operations: [] };

  let rules;
  try {
    rules = JSON.parse(configRaw);
  } catch {
    return { operations: [] };
  }

  // Support both array format (new) and object format (legacy)
  const bundleList = Array.isArray(rules)
    ? rules
    : Object.values(rules.bundles || {});

  if (!bundleList.length) return { operations: [] };

  const candidates = [];

  for (const line of input.cart.lines) {
    const lineQty = line.quantity;
    const productId = line.merchandise?.product?.id; // GID format

    let bestDiscount = null;

    for (const bundle of bundleList) {
      // ── Product matching ──
      if (bundle.productSelectionType === 'SPECIFIC_PRODUCTS') {
        if (!productId) continue;

        // Support both new format (productIds) and old format (selectedProductIds)
        let ids = bundle.productIds || [];
        if (!ids.length && bundle.selectedProductIds) {
          try {
            ids = typeof bundle.selectedProductIds === 'string'
              ? JSON.parse(bundle.selectedProductIds)
              : bundle.selectedProductIds;
          } catch {
            ids = [];
          }
        }

        const matches = ids.some(id =>
          String(id) === String(productId) ||
          productId.includes(String(id))
        );
        if (!matches) continue;
      }
      // ALL_PRODUCTS → applies to everything

      // ── Find best matching break for this quantity ──
      // Support both new format (quantityBreaks array) and old format (breaks object)
      const breaksArray = bundle.quantityBreaks
        || Object.values(bundle.breaks || {});

      let matchedBreak = null;

      for (const brk of breaksArray) {
        if (
          brk.quantity <= lineQty &&
          brk.discountValue > 0
        ) {
          if (!matchedBreak || brk.quantity > matchedBreak.quantity) {
            matchedBreak = brk;
          }
        }
      }

      if (
        matchedBreak &&
        (!bestDiscount || matchedBreak.discountValue > bestDiscount.discountValue)
      ) {
        bestDiscount = {
          ...matchedBreak,
          bundleName: bundle.name || bundle.bundleId || 'Bundle discount',
        };
      }
    }

    if (!bestDiscount) continue;

    // ── Build discount value ──
    let value;

    if (bestDiscount.discountType === 'PERCENTAGE') {
      value = { percentage: { value: bestDiscount.discountValue } };

    } else if (bestDiscount.discountType === 'FIXED_AMOUNT') {
      value = { fixedAmount: { amount: bestDiscount.discountValue } };

    } else if (bestDiscount.discountType === 'FIXED_PRICE') {
      const originalPerItem = parseFloat(
        line.cost.amountPerQuantity?.amount || '0'
      );
      const discountPerItem = originalPerItem - bestDiscount.discountValue;
      if (discountPerItem <= 0) continue;
      value = { fixedAmount: { amount: discountPerItem * lineQty } };

    } else {
      continue;
    }

    candidates.push({
      message: bestDiscount.bundleName,
      targets: [{ cartLine: { id: line.id } }],
      value,
    });
  }

  if (!candidates.length) return { operations: [] };

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates,
          selectionStrategy: ProductDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}