import prisma from "../db.server";

export async function loader() {
  const forms = await prisma.formConfig.findMany();
  return Response.json(forms);
}