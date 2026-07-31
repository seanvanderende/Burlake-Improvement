import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  date,
} from "drizzle-orm/pg-core";

export const orderFormsTable = pgTable("order_forms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  customerName: text("customer_name").notNull(),
  description: text("description"),
  season: text("season"),
  deadline: date("deadline"),
  status: text("status").notNull().default("draft"), // 'draft' | 'active' | 'closed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderFormItemsTable = pgTable("order_form_items", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull(),
  name: text("name").notNull(),
  itemNum: text("item_num"),
  upc: text("upc"),
  pack: text("pack"),
  casePrice: numeric("case_price", { precision: 10, scale: 2 }),
  category: text("category"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type OrderForm = typeof orderFormsTable.$inferSelect;
export type NewOrderForm = typeof orderFormsTable.$inferInsert;
export type OrderFormItem = typeof orderFormItemsTable.$inferSelect;
export type NewOrderFormItem = typeof orderFormItemsTable.$inferInsert;
