import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const priceListsTable = pgTable("price_lists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  period: text("period").notNull(),
  objectPath: text("object_path").notNull(),
  fileName: text("file_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PriceList = typeof priceListsTable.$inferSelect;
export type NewPriceList = typeof priceListsTable.$inferInsert;
