import { type ViewData } from "@/components/charting/chartTypes";
import { env } from "@/env";
import CryptoJS from "crypto-js";
import { relations } from "drizzle-orm";
import { customType, integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { type GoogleAnalyticsReportParameters } from "../googleAnalytics/reportParametersSchema";

// /**
//  * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
//  * database instance for multiple projects.
//  *
//  * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
//  */
// export const createTable = pgTableCreator((name) => `werve_${name}`);

const encryptedJson = customType<{ data: GoogleAnalyticsCredentials }>({
  dataType() {
    return "text"
  },
  fromDriver(value: unknown) {
    try {
      if (typeof value !== 'string') {
        throw new Error('Expected string value from database')
      }
      const decrypted = CryptoJS.AES.decrypt(value, env.DB_COLUMN_ENCRYPTION_SECRET).toString(
        CryptoJS.enc.Utf8
      )
      if (!decrypted) {
        throw new Error('Decryption failed')
      }
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Error decrypting/parsing JSON:', error)
      throw error
    }
  },
  toDriver(value: GoogleAnalyticsCredentials) {
    try {
      const jsonString = JSON.stringify(value)
      return CryptoJS.AES.encrypt(jsonString, env.DB_COLUMN_ENCRYPTION_SECRET).toString()
    } catch (error) {
      console.error('Error encrypting JSON:', error)
      throw error
    }
  },
})

const createdAtField = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();

const updatedAtField = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());


// User
export const userTable = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").default(""),
  lastName: text("last_name").default(""),
  email: text("email").default(""),
  supabaseAuthId: text("supabase_auth_id").notNull(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
});

export const userRelations = relations(userTable, ({ many }) => ({
	roles: many(roleTable)
}));


// Workspace
export const workspaceTable = pgTable("workspace", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  name: text("name").notNull(),
});

export const workspaceRelations = relations(workspaceTable, ({ many }) => ({
  roles: many(roleTable)
}));


// Role
export const roleTable = pgTable("role", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  roleType: text("role_type", { enum: ["owner", "viewer"] }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => userTable.id),
  workspaceId: uuid("workspace_id")
    .notNull() 
    .references(() => workspaceTable.id),
});

export const roleRelations = relations(roleTable, ({ one }) => ({
  user: one(userTable, {
    fields: [roleTable.userId],
    references: [userTable.id],
  }),
  workspace: one(workspaceTable, {
    fields: [roleTable.workspaceId],
    references: [workspaceTable.id],
  }),
}));

export const integrationTable = pgTable("integration", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaceTable.id),
  type: text("type", { enum: ["google_analytics"] }).notNull(),
  credentials: encryptedJson("credentials").notNull(),
  metadata: json("metadata").notNull(),
});


// Conversation
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
  googleAnalyticsReportId: uuid("google_analytics_report_id").references(() => googleAnalyticsReportTable.id),
  plotViewId: uuid("plot_view_id").references(() => plotViewTable.id),
});

export const googleAnalyticsReportTable = pgTable("google_analytics_report", {
	id: uuid("id").defaultRandom().primaryKey(),
	createdAt: createdAtField,
	updatedAt: updatedAtField,
	title: text("title").notNull(),
	description: text("description").notNull(),
	reportParameters: json("report_parameters").$type<GoogleAnalyticsReportParameters>().notNull(),
});

export const plotViewTable = pgTable("plot_view", {
	id: uuid("id").defaultRandom().primaryKey(),
	createdAt: createdAtField,
	updatedAt: updatedAtField,
	viewData: json("view_data").$type<ViewData>().notNull(),
});

export const dashboardTable = pgTable("dashboard", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	createdAt: createdAtField,
	updatedAt: updatedAtField,
	title: text("title").notNull(),
	description: text("description"),
});

export const dashboardItemsTable = pgTable("dashboard_item", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	createdAt: createdAtField,
	updatedAt: updatedAtField,
	dashboardId: uuid("dashboard_id")
    .references(() => dashboardTable.id)
    .notNull(),
	gridX: integer("grid_x").notNull(),
	gridY: integer("grid_y").notNull(),
	gridWidth: integer("grid_width").notNull(),
	gridHeight: integer("grid_height").notNull(),
	plotViewId: uuid("plot_view_id")
		.references(() => plotViewTable.id)
		.notNull(),
  googleAnalyticsReportId: uuid("google_analytics_report_id")
    .references(() => googleAnalyticsReportTable.id)
    .notNull(),
});

export type ConversationSelect = typeof conversationTable.$inferSelect;
export type MessageSelect = typeof messageTable.$inferSelect;
export type GoogleAnalyticsReportSelect = typeof googleAnalyticsReportTable.$inferSelect;
export type WorkspaceSelect = typeof workspaceTable.$inferSelect;
export type UserSelect = typeof userTable.$inferSelect;
export type RoleSelect = typeof roleTable.$inferSelect;
export type RoleSelectWithRelations = RoleSelect & {
  user: UserSelect;
  workspace: WorkspaceSelect;
};

export type PlotViewSelect = typeof plotViewTable.$inferSelect;
export type DashboardSelect = typeof dashboardTable.$inferSelect;
export type DashboardItemSelect = typeof dashboardItemsTable.$inferSelect;


// Types
export type GoogleAnalyticsCredentials = {
  scopes: string[];
  accessToken: string;
  refreshToken: string;
};
