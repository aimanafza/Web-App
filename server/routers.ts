import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getUserTodoLists,
  createTodoList,
  deleteTodoList,
  getListTasks,
  getSubtasks,
  createTask,
  updateTaskCompletion,
  deleteTask,
  moveTaskToList,
  getTaskWithSubtasks,
  getListStats,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
        const tasks = await getListTasks(input.listId);
        
        // Enrich each task with its subtasks
        const tasksWithSubtasks = await Promise.all(
          tasks.map(async (task) => {
            const subtasks = await getSubtasks(task.id);
            return {
              ...task,
              subtasks,
            };
          })
        );

        return tasksWithSubtasks;
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
  }),
});

export type AppRouter = typeof appRouter;
