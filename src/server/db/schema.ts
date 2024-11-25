// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// /**
//  * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
//  * database instance for multiple projects.
//  *
//  * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
//  */
// export const createTable = pgTableCreator((name) => `werve_${name}`);

const createdAtField = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();

const updatedAtField = timestamp("updated_at", {
  withTimezone: true,
}).$onUpdate(() => new Date());

export const userTable = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
});

/*
  TODO: Make this reference a workspace
*/
export const conversationTable = pgTable("conversation", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  name: text("name").notNull(),
});

export const messageTable = pgTable("message", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversationTable.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  text: text("text"),
});

export type ConversationSelect = typeof conversationTable.$inferSelect;
export type MessageSelect = typeof messageTable.$inferSelect;
