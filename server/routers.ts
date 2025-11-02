import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  getUserTodoLists,
  createTodoList,
  deleteTodoList,
  getListTasks,
  getSubtasks,
  createTask,
  updateTaskCompletion,
  updateTaskTitle,
  deleteTask,
  moveTaskToList,
  getTaskWithSubtasks,
  getListStats,
  getDb,
  users,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3, "Username must be at least 3 characters").max(64),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Check if user already exists
        const existing = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
        if (existing.length > 0) throw new Error("Username already taken");
        
        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        // Create user
        await db.insert(users).values({
          username: input.username,
          email: input.email,
          passwordHash,
          name: input.username,
          loginMethod: "custom",
          lastSignedIn: new Date(),
        });
        
        return { success: true };
      }),
    
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Find user
        const userList = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
        if (userList.length === 0) throw new Error("Invalid username or password");
        const user = userList[0];
        
        // Check password
        const passwordValid = await bcrypt.compare(input.password, user.passwordHash || "");
        if (!passwordValid) throw new Error("Invalid username or password");
        
        // Update last signed in
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
        
        // Create session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const sessionToken = Buffer.from(JSON.stringify({ userId: user.id, username: user.username })).toString("base64");
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        
        return { success: true, user: { id: user.id, username: user.username, email: user.email } };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ TODO LIST PROCEDURES ============
  todoList: router({
    /**
     * Get all todo lists for the current user
     */
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const lists = await getUserTodoLists(ctx.user.id);
      
      // Enrich with stats
      const listsWithStats = await Promise.all(
        lists.map(async (list) => {
          const stats = await getListStats(list.id);
          return {
            ...list,
            ...stats,
          };
        })
      );

      return listsWithStats;
    }),

    /**
     * Create a new todo list
     */
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const list = await createTodoList(ctx.user.id, input.name);
        return {
          ...list,
          total: 0,
          completed: 0,
        };
      }),

    /**
     * Delete a todo list
     */
    delete: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTodoList(input.listId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============ TASK PROCEDURES ============
  task: router({
    /**
     * Get all top-level tasks for a list
     */
    getListTasks: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ input }) => {
        // getListTasks already returns tasks with recursive subtasks loaded
        const tasks = await getListTasks(input.listId);
        return tasks;
      }),

    /**
     * Get subtasks for a parent task
     */
    getSubtasks: protectedProcedure
      .input(z.object({ parentTaskId: z.number() }))
      .query(async ({ input }) => {
        const subtasks = await getSubtasks(input.parentTaskId);
        
        // Enrich each subtask with its own subtasks
        const subtasksWithChildren = await Promise.all(
          subtasks.map(async (subtask) => {
            const children = await getSubtasks(subtask.id);
            return {
              ...subtask,
              subtasks: children,
            };
          })
        );

        return subtasksWithChildren;
      }),

    /**
     * Create a new task
     */
    create: protectedProcedure
      .input(
        z.object({
          listId: z.number(),
          title: z.string().min(1).max(255),
          parentTaskId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const task = await createTask(
          input.listId,
          ctx.user.id,
          input.title,
          input.parentTaskId
        );
        return {
          ...task,
          subtasks: [],
        };
      }),

    /**
     * Toggle task completion status
     */
    toggleCompletion: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        // First get the current task to know its current state
        const currentTask = await getTaskWithSubtasks(input.taskId);
        if (!currentTask) throw new Error("Task not found");

        const updated = await updateTaskCompletion(input.taskId, !currentTask.completed);
        return updated;
      }),

    /**
     * Delete a task and all its subtasks
     */
    delete: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTask(input.taskId);
        return { success: true };
      }),

    /**
     * Move a task to a different list (top-level only)
     */
    moveToList: protectedProcedure
      .input(z.object({ taskId: z.number(), newListId: z.number() }))
      .mutation(async ({ input }) => {
        const updated = await moveTaskToList(input.taskId, input.newListId);
        return updated;
      }),

    /**
     * Update task title
     */
    update: protectedProcedure
      .input(z.object({ taskId: z.number(), title: z.string().min(1).max(255) }))
      .mutation(async ({ input }) => {
        const updated = await updateTaskTitle(input.taskId, input.title);
        return updated;
      }),
  }),
});

export type AppRouter = typeof appRouter;
