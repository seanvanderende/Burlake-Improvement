import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Generic key-value settings table for server-managed configuration.
 * Currently used to store the Customer Portal access code and its version
 * (so existing portal sessions can be invalidated on code rotation).
 */
export const settingsTable = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Setting = typeof settingsTable.$inferSelect;
