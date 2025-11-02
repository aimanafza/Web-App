import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Username for custom authentication */
  username: varchar("username", { length: 64 }).notNull().unique(),
  /** Email address */
  email: varchar("email", { length: 320 }),
  /** Hashed password for custom authentication */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * TodoList table - represents a list owned by a user
 * Each user can have multiple lists (e.g., Groceries, Shopping, etc.)
 */
export const todoLists = mysqlTable("todoLists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TodoList = typeof todoLists.$inferSelect;
export type InsertTodoList = typeof todoLists.$inferInsert;

/**
 * Task table - represents a task/item in a todo list
 * Supports hierarchical structure with parentTaskId for subtasks
 * Can be nested up to 3 levels deep
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  listId: int("listId").notNull(), // Foreign key to todoLists table
  userId: int("userId").notNull(), // Denormalized for easier queries
  title: varchar("title", { length: 255 }).notNull(),
  completed: boolean("completed").default(false).notNull(),
  parentTaskId: int("parentTaskId"), // NULL for top-level tasks, points to parent task for subtasks
  order: int("order").default(0).notNull(), // For ordering tasks within a list/parent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
