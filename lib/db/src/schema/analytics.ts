import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// One row per page view on the public site. Kept intentionally minimal
// (no visitor identifiers) since this only needs to power aggregate traffic
// counts and a "most visited pages" list for staff, not per-user tracking.
export const pageViewsTable = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PageView = typeof pageViewsTable.$inferSelect;
