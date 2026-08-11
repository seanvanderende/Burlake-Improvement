import { Router, type IRouter, type Request, type Response } from "express";
import { desc } from "drizzle-orm";
import { db, unsubscribeRequestsTable } from "@workspace/db";
import {
  SubmitUnsubscribeRequestBody,
  SubmitUnsubscribeRequestResponse,
  ListUnsubscribeRequestsResponseItem,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

// ── Public: submit an unsubscribe request ───────────────────────────────────

router.post("/unsubscribe", async (req: Request, res: Response): Promise<void> => {
  const parsed = SubmitUnsubscribeRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { businessNameOrAccountNumber, email } = parsed.data;

  const [request] = await db
    .insert(unsubscribeRequestsTable)
    .values({ businessNameOrAccountNumber, email })
    .returning();

  res.status(201).json(SubmitUnsubscribeRequestResponse.parse(request));
});

// ── Admin: list all unsubscribe requests ────────────────────────────────────

router.get(
  "/admin/unsubscribe-requests",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    const requests = await db
      .select()
      .from(unsubscribeRequestsTable)
      .orderBy(desc(unsubscribeRequestsTable.createdAt));

    res.json(requests.map((r) => ListUnsubscribeRequestsResponseItem.parse(r)));
  },
);

export default router;
