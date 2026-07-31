import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  sku: text("sku"),
  size: text("size"),
  description: text("description"),
  available: boolean("available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Product = typeof productsTable.$inferSelect;

// Additional photos beyond a product's primary `imageUrl`, shown as a gallery.
export const productPhotosTable = pgTable("product_photos", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ProductPhoto = typeof productPhotosTable.$inferSelect;
