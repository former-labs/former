// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { type GoogleAnalyticsReportParameters } from "../googleAnalytics/reportParametersSchema";

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

/*
  TODO: Add a "type" to this instead of "user" or "assistant" probably.
  For now we store "user-message" and "assistant-google-analytics-report".
*/
export const messageTable = pgTable("message", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversationTable.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  text: text("text"),
  googleAnalyticsReportId: uuid("google_analytics_report_id").references(() => googleAnalyticsReportTable.id)
});

export const googleAnalyticsReportTable = pgTable("google_analytics_report", {
	id: uuid("id").defaultRandom().primaryKey(),
	createdAt: createdAtField,
	updatedAt: updatedAtField,
	title: text("title").notNull(),
	description: text("description").notNull(),
	reportParameters: json("report_parameters").$type<GoogleAnalyticsReportParameters>().notNull(),
});


export type ConversationSelect = typeof conversationTable.$inferSelect;
export type MessageSelect = typeof messageTable.$inferSelect;
export type GoogleAnalyticsReportSelect = typeof googleAnalyticsReportTable.$inferSelect;
