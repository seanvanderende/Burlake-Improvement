import { pgTable, text, serial, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { productsTable } from "./products";

export const collectionsTable = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  /** Organises collections into filter-panel sections: 'category' | 'collection' | 'holiday' | null */
  grp: text("grp"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productCollectionsTable = pgTable(
  "product_collections",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collectionsTable.id, { onDelete: "cascade" }),
    /**
     * When this product was tagged with this collection. Used to determine a
     * product's "first assigned" collection for the catalog's default sort,
     * independent of the collections' own display sortOrder.
     */
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.productId, table.collectionId] })],
);
