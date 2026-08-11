import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

// Submissions from the public "unsubscribe" page. No email is sent — staff
// review these from an admin page instead.
export const unsubscribeRequestsTable = pgTable("unsubscribe_requests", {
  id: serial("id").primaryKey(),
  businessNameOrAccountNumber: text("business_name_or_account_number").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UnsubscribeRequest = typeof unsubscribeRequestsTable.$inferSelect;
