import { eq, and, isNull, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, todoLists, tasks } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ TODO LIST QUERIES ============

/**
 * Get all todo lists for a user
 */
export async function getUserTodoLists(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(todoLists)
    .where(eq(todoLists.userId, userId))
    .orderBy(asc(todoLists.createdAt));
}

/**
 * Create a new todo list
 */
export async function createTodoList(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(todoLists).values({
    userId,
    name,
  });

  // Get the created list
  const created = await db
    .select()
    .from(todoLists)
    .where(and(eq(todoLists.userId, userId), eq(todoLists.name, name)))
    .limit(1);

  return created[0];
}

/**
 * Delete a todo list and all its tasks
 */
export async function deleteTodoList(listId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all tasks in this list
  await db.delete(tasks).where(eq(tasks.listId, listId));

  // Delete the list
  await db
    .delete(todoLists)
    .where(and(eq(todoLists.id, listId), eq(todoLists.userId, userId)));
}

// ============ TASK QUERIES ============

/**
 * Get all top-level tasks for a list (parentTaskId is NULL)
 */
export async function getListTasks(listId: number) {
  const db = await getDb();
  if (!db) return [];

  const topLevelTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.listId, listId), isNull(tasks.parentTaskId)))
    .orderBy(asc(tasks.order));

  const tasksWithSubtasks = await Promise.all(
    topLevelTasks.map(async (task) => ({
      ...task,
      subtasks: await getTaskSubtasksRecursive(task.id),
    }))
  );

  return tasksWithSubtasks;
}

async function getTaskSubtasksRecursive(parentTaskId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const subtasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.parentTaskId, parentTaskId))
    .orderBy(asc(tasks.order));

  const subtasksWithChildren = await Promise.all(
    subtasks.map(async (subtask) => ({
      ...subtask,
      subtasks: await getTaskSubtasksRecursive(subtask.id),
    }))
  );

  return subtasksWithChildren;
}

/**
 * Get all subtasks for a parent task
 */
export async function getSubtasks(parentTaskId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.parentTaskId, parentTaskId))
    .orderBy(asc(tasks.order));
}

/**
 * Create a new task
 */
export async function createTask(
  listId: number,
  userId: number,
  title: string,
  parentTaskId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the next order number
  const maxOrder = await db
    .select({ maxOrder: tasks.order })
    .from(tasks)
    .where(
      parentTaskId
        ? eq(tasks.parentTaskId, parentTaskId)
        : and(eq(tasks.listId, listId), isNull(tasks.parentTaskId))
    );

  const nextOrder = (maxOrder[0]?.maxOrder ?? -1) + 1;

  const result = await db.insert(tasks).values({
    listId,
    userId,
    title,
    parentTaskId: parentTaskId || null,
    order: nextOrder,
    completed: false,
  });

  // Get the created task
  const created = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, result[0].insertId))
    .limit(1);

  return created[0];
}

/**
 * Update task completion status
 */
export async function updateTaskCompletion(taskId: number, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId));

  const updated = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return updated[0];
}

/**
 * Delete a task and all its subtasks recursively
 */
export async function deleteTask(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all subtasks recursively
  const subtasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.parentTaskId, taskId));

  // Delete all subtasks recursively
  for (const subtask of subtasks) {
    await deleteTask(subtask.id);
  }

  // Delete the task itself
  await db.delete(tasks).where(eq(tasks.id, taskId));
}

/**
 * Move a task to a different list (only for top-level tasks)
 */
export async function moveTaskToList(taskId: number, newListId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tasks).set({ listId: newListId }).where(eq(tasks.id, taskId));

  const updated = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return updated[0];
}

/**
 * Get task with all its subtasks recursively
 */
export async function getTaskWithSubtasks(taskId: number): Promise<any> {
  const db = await getDb();
  if (!db) return null;

  const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task[0]) return null;

  const subtasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.parentTaskId, taskId))
    .orderBy(asc(tasks.order));

  // Recursively get subtasks
  const subtasksWithChildren = await Promise.all(
    subtasks.map(async (subtask) => ({
      ...subtask,
      subtasks: await getTaskWithSubtasks(subtask.id),
    }))
  );

  return {
    ...task[0],
    subtasks: subtasksWithChildren,
  };
}

/**
 * Update task title
 */
export async function updateTaskTitle(taskId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tasks).set({ title }).where(eq(tasks.id, taskId));

  const updated = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return updated[0];
}

/**
 * Calculate completion stats for a list
 */
export async function getListStats(listId: number) {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0 };

  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.listId, listId));

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.completed).length;

  return { total, completed };
}
