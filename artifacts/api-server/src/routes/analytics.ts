import { Router, type IRouter, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import { db, pageViewsTable } from "@workspace/db";
import { PageViewInput, AnalyticsSummary } from "@workspace/api-zod";
import { requireAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

/** POST /analytics/pageview — record a single page view (public, unauthenticated) */
router.post("/analytics/pageview", async (req: Request, res: Response): Promise<void> => {
  const parsed = PageViewInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    await db.insert(pageViewsTable).values({ path: parsed.data.path });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to record page view");
    // Traffic logging should never break the page for the visitor.
    res.status(204).end();
  }
});

interface CountRow {
  label: string;
  count: string | number;
}

interface TopPageRow {
  path: string;
  count: string | number;
}

/** GET /admin/analytics/summary — daily/weekly/monthly visit counts + top pages (admin only) */
router.get(
  "/admin/analytics/summary",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const dailyResult = await db.execute<CountRow>(sql`
        SELECT to_char(bucket, 'Mon DD') AS label, COALESCE(pv.count, 0) AS count
        FROM generate_series(
          date_trunc('day', now()) - interval '29 days',
          date_trunc('day', now()),
          interval '1 day'
        ) AS bucket
        LEFT JOIN (
          SELECT date_trunc('day', created_at) AS bucket, count(*) AS count
          FROM page_views
          GROUP BY 1
        ) pv USING (bucket)
        ORDER BY bucket ASC
      `);

      const weeklyResult = await db.execute<CountRow>(sql`
        SELECT 'Wk of ' || to_char(bucket, 'Mon DD') AS label, COALESCE(pv.count, 0) AS count
        FROM generate_series(
          date_trunc('week', now()) - interval '11 weeks',
          date_trunc('week', now()),
          interval '1 week'
        ) AS bucket
        LEFT JOIN (
          SELECT date_trunc('week', created_at) AS bucket, count(*) AS count
          FROM page_views
          GROUP BY 1
        ) pv USING (bucket)
        ORDER BY bucket ASC
      `);

      const monthlyResult = await db.execute<CountRow>(sql`
        SELECT to_char(bucket, 'Mon YYYY') AS label, COALESCE(pv.count, 0) AS count
        FROM generate_series(
          date_trunc('month', now()) - interval '11 months',
          date_trunc('month', now()),
          interval '1 month'
        ) AS bucket
        LEFT JOIN (
          SELECT date_trunc('month', created_at) AS bucket, count(*) AS count
          FROM page_views
          GROUP BY 1
        ) pv USING (bucket)
        ORDER BY bucket ASC
      `);

      const topPagesResult = await db.execute<TopPageRow>(sql`
        SELECT path, count(*) AS count
        FROM page_views
        GROUP BY path
        ORDER BY count DESC, path ASC
        LIMIT 10
      `);

      const summary = AnalyticsSummary.parse({
        daily: dailyResult.rows.map((row) => ({ label: row.label, count: Number(row.count) })),
        weekly: weeklyResult.rows.map((row) => ({ label: row.label, count: Number(row.count) })),
        monthly: monthlyResult.rows.map((row) => ({ label: row.label, count: Number(row.count) })),
        topPages: topPagesResult.rows.map((row) => ({ path: row.path, count: Number(row.count) })),
      });

      res.json(summary);
    } catch (err) {
      _req.log.error({ err }, "Failed to compute analytics summary");
      res.status(500).json({ error: "Failed to compute analytics summary" });
    }
  },
);

export default router;
