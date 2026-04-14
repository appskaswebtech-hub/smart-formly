import  prisma  from "../db.server";
import type { Bundle, QuantityBreak } from "@prisma/client";

// CREATE
export async function createBundle(
  shop: string,
  data: {
    name: string;
    title: string;
    bundleType: string;
    prioritySequence?: number;
    status?: string;
    showWidget?: boolean;
    productSelectionType?: string;
    selectedProductIds?: string[];
    quantityBreaks: Array<{
      quantity: number;
      discountType: string;
      discountValue: number;
      description: string;
      savingsText?: string;
      freeShipping?: boolean;
    }>;
  }
) {
  return await prisma.bundle.create({
    data: {
      shop,
      name: data.name,
      title: data.title,
      bundleType: data.bundleType as any,
      prioritySequence: data.prioritySequence || 100,
      status: (data.status as any) || "ACTIVE",
      showWidget: data.showWidget ?? true,
      productSelectionType: (data.productSelectionType as any) || "ALL_PRODUCTS",
      selectedProductIds: data.selectedProductIds
        ? JSON.stringify(data.selectedProductIds)
        : null,
      quantityBreaks: {
        create: data.quantityBreaks.map((qb, index) => ({
          shop,
          type: "FIXED_QUANTITY",
          quantity: qb.quantity,
          discountType: qb.discountType as any,
          discountValue: qb.discountValue,
          description: qb.description,
          savingsText: qb.savingsText || "Save {{discount_value}}{{discount_unit}}",
          freeShipping: qb.freeShipping || false,
          sortOrder: index,
        })),
      },
      discountCombination: {
        create: {
          shop,
          productDiscounts: true,
          orderDiscounts: true,
          shippingDiscounts: true,
        },
      },
      widgetSettings: {
        create: {
          shop,
        },
      },
    },
    include: {
      quantityBreaks: {
        orderBy: { sortOrder: "asc" },
      },
      discountCombination: true,
      widgetSettings: true,
    },
  });
}

// READ ALL
export async function getBundles(shop: string) {
  return await prisma.bundle.findMany({
    where: { shop },
    include: {
      quantityBreaks: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { quantityBreaks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// READ ONE
export async function getBundle(shop: string, bundleId: string) {
  return await prisma.bundle.findFirst({
    where: { id: bundleId, shop },
    include: {
      quantityBreaks: {
        orderBy: { sortOrder: "asc" },
      },
      discountCombination: true,
      widgetSettings: true,
    },
  });
}

// UPDATE
export async function updateBundle(
  shop: string,
  bundleId: string,
  data: {
    name?: string;
    title?: string;
    status?: string;
    showWidget?: boolean;
    prioritySequence?: number;
    productSelectionType?: string;
    selectedProductIds?: string[];
    quantityBreaks?: Array<{
      id?: string;
      quantity: number;
      discountType: string;
      discountValue: number;
      description: string;
      savingsText?: string;
      freeShipping?: boolean;
    }>;
  }
) {
  // Verify ownership
  const bundle = await prisma.bundle.findFirst({
    where: { id: bundleId, shop },
  });

  if (!bundle) {
    throw new Error("Bundle not found");
  }

  // If quantity breaks are provided, replace them
  if (data.quantityBreaks) {
    // Delete old breaks
    await prisma.quantityBreak.deleteMany({
      where: { bundleId, shop },
    });
  }

  return await prisma.bundle.update({
    where: { id: bundleId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.title && { title: data.title }),
      ...(data.status && { status: data.status as any }),
      ...(data.showWidget !== undefined && { showWidget: data.showWidget }),
      ...(data.prioritySequence && { prioritySequence: data.prioritySequence }),
      ...(data.productSelectionType && { productSelectionType: data.productSelectionType as any }),
      ...(data.selectedProductIds && {
        selectedProductIds: JSON.stringify(data.selectedProductIds),
      }),
      ...(data.quantityBreaks && {
        quantityBreaks: {
          create: data.quantityBreaks.map((qb, index) => ({
            shop,
            type: "FIXED_QUANTITY",
            quantity: qb.quantity,
            discountType: qb.discountType as any,
            discountValue: qb.discountValue,
            description: qb.description,
            savingsText: qb.savingsText || "Save {{discount_value}}{{discount_unit}}",
            freeShipping: qb.freeShipping || false,
            sortOrder: index,
          })),
        },
      }),
    },
    include: {
      quantityBreaks: {
        orderBy: { sortOrder: "asc" },
      },
      discountCombination: true,
      widgetSettings: true,
    },
  });
}

// DELETE
export async function deleteBundle(shop: string, bundleId: string) {
  const bundle = await prisma.bundle.findFirst({
    where: { id: bundleId, shop },
  });

  if (!bundle) {
    throw new Error("Bundle not found");
  }

  return await prisma.bundle.delete({
    where: { id: bundleId },
  });
}
