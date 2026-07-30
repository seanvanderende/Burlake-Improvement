import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const brochuresTable = pgTable("brochures", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  season: text("season").notNull(),
  objectPath: text("object_path").notNull(),
  fileName: text("file_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Brochure = typeof brochuresTable.$inferSelect;
export type NewBrochure = typeof brochuresTable.$inferInsert;
