import { getPublicAppUrl } from "@/lib/app-url.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getCurrentUser } from "@/integrations/neon/auth.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildAbandonedCartEmail } from "@/lib/email/templates";

const syncInputSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      slug: z.string(),
      name: z.string(),
      image: z.string().optional().nullable(),
      unitPrice: z.number(),
      quantity: z.number(),
    }),
  ),
});

export const syncCartSnapshotFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => syncInputSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    if (!user) return { success: true };
    return { success: true };
  });

export const sendAbandonedCartRemindersFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    return { sent: 0, total: 0 };
  });
