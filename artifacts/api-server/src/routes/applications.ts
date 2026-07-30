import { Router, type IRouter, type Request, type Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db, applicationsTable } from "@workspace/db";
import {
  SubmitApplicationBody,
  SubmitApplicationResponse,
  ListApplicationsResponse,
  UpdateApplicationParams,
  UpdateApplicationBody,
  UpdateApplicationResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

// ── Public: submit an application ────────────────────────────────────────────

router.post("/applications", async (req: Request, res: Response): Promise<void> => {
  const parsed = SubmitApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { businessName, contactName, email, phone, businessType, monthlyVolume, notes } =
    parsed.data;

  const [application] = await db
    .insert(applicationsTable)
    .values({
      businessName,
      contactName,
      email,
      phone,
      businessType,
      monthlyVolume: monthlyVolume ?? null,
      notes: notes ?? null,
    })
    .returning();

  res.status(201).json(SubmitApplicationResponse.parse(application));
});

// ── Admin: list all applications ─────────────────────────────────────────────

router.get(
  "/admin/applications",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    const applications = await db
      .select()
      .from(applicationsTable)
      .orderBy(desc(applicationsTable.createdAt));

    res.json(ListApplicationsResponse.parse(applications));
  },
);

// ── Admin: update application status ─────────────────────────────────────────

router.patch(
  "/admin/applications/:id",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const params = UpdateApplicationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateApplicationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes ?? null;

    const [application] = await db
      .update(applicationsTable)
      .set(updates)
      .where(eq(applicationsTable.id, params.data.id))
      .returning();

    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    res.json(UpdateApplicationResponse.parse(application));
  },
);

export default router;
