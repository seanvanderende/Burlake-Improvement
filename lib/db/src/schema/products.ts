import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const PRODUCT_CATEGORIES = [
  "tropicals",
  "flowering",
  "planters",
  "easter",
  "mothers_day",
  "cut_flowers",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().$type<ProductCategory>(),
  imageUrl: text("image_url"),
  sku: text("sku"),
  size: text("size"),
  description: text("description"),
  available: boolean("available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
