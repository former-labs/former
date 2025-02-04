import { type DatabaseMetadata } from "@/types/connections";
import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

const updatedAtField = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());

const workspaceIdField = uuid("workspace_id")
    .references(() => workspaceTable.id, {
      onDelete: "cascade",
    })
    .notNull();

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
export enum RoleType {
  OWNER = "owner",
  VIEWER = "viewer",
}

// Use the enum values as a tuple
export const ROLE_VALUES = [RoleType.OWNER, RoleType.VIEWER] as const;

export const roleTable = pgTable("role", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  workspaceId: workspaceIdField,
  roleType: text("role_type", { enum: ROLE_VALUES }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => userTable.id),
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


// Conversation
/*
  TODO: Make this reference a workspace
*/
export const conversationTable = pgTable("conversation", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  workspaceId: workspaceIdField,
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
  workspaceId: workspaceIdField,
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversationTable.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  text: text("text"),
});

export const messageItemsTable = pgTable("message_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  workspaceId: workspaceIdField,
  messageId: uuid("message_id")
    .notNull()
    .references(() => messageTable.id),
});

export const knowledgeTable = pgTable("knowledge", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  workspaceId: workspaceIdField,
  name: text("name").notNull(),
  description: text("description").notNull(),
  query: text("query").notNull(),
});

export const instructionsTable = pgTable("instructions", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  workspaceId: workspaceIdField.unique(),
  instructions: text("instructions").notNull(),
});

export const databaseMetadataTable = pgTable("database_metadata", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: createdAtField,
  updatedAt: updatedAtField,
  workspaceId: workspaceIdField.unique(),
  databaseMetadata: jsonb("database_metadata").$type<DatabaseMetadata>().notNull(),
});

export type ConversationSelect = typeof conversationTable.$inferSelect;
export type MessageSelect = typeof messageTable.$inferSelect;
export type MessageItemSelect = typeof messageItemsTable.$inferSelect;
export type WorkspaceSelect = typeof workspaceTable.$inferSelect;
export type UserSelect = typeof userTable.$inferSelect;
export type RoleSelect = typeof roleTable.$inferSelect;
export type RoleSelectWithRelations = RoleSelect & {
  user: UserSelect;
  workspace: WorkspaceSelect;
};
export type KnowledgeSelect = typeof knowledgeTable.$inferSelect;
export type InstructionsSelect = typeof instructionsTable.$inferSelect;
