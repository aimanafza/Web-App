import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import TaskItem from "@/components/TaskItem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();
  const [newListName, setNewListName] = useState("");
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [moveTaskId, setMoveTaskId] = useState<number | null>(null);
  const [moveTargetListId, setMoveTargetListId] = useState<string>("");

  // Queries
  const { data: lists = [], isLoading: listsLoading, refetch: refetchLists } = trpc.todoList.getAll.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = trpc.task.getListTasks.useQuery(
    { listId: selectedListId || 0 },
    { enabled: isAuthenticated && selectedListId !== null }
  );

  // Mutations
  const createListMutation = trpc.todoList.create.useMutation({
    onSuccess: () => {
      setNewListName("");
      refetchLists();
      toast.success("List created!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteListMutation = trpc.todoList.delete.useMutation({
    onSuccess: () => {
      setSelectedListId(null);
      refetchLists();
      toast.success("List deleted!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createTaskMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      setNewTaskTitle("");
      refetchTasks();
      toast.success("Task added!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleTaskMutation = trpc.task.toggleCompletion.useMutation({
    onSuccess: () => {
      refetchTasks();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTaskMutation = trpc.task.delete.useMutation({
    onSuccess: () => {
      refetchTasks();
      toast.success("Task deleted!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const moveTaskMutation = trpc.task.moveToList.useMutation({
    onSuccess: () => {
      setMoveTaskId(null);
      setMoveTargetListId("");
      refetchTasks();
      refetchLists();
      toast.success("Task moved!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("List name cannot be empty");
      return;
    }
    await createListMutation.mutateAsync({ name: newListName });
  };

  const handleDeleteList = async (listId: number) => {
    if (confirm("Are you sure you want to delete this list?")) {
      await deleteListMutation.mutateAsync({ listId });
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !selectedListId) {
      toast.error("Task title cannot be empty");
      return;
    }
    await createTaskMutation.mutateAsync({
      listId: selectedListId,
      title: newTaskTitle,
    });
  };

  const handleToggleTask = async (taskId: number) => {
    await toggleTaskMutation.mutateAsync({ taskId });
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTaskMutation.mutateAsync({ taskId });
    }
  };

  const handleMoveTask = async () => {
    if (!moveTaskId || !moveTargetListId) {
      toast.error("Please select a target list");
      return;
    }
    await moveTaskMutation.mutateAsync({
      taskId: moveTaskId,
      newListId: parseInt(moveTargetListId),
    });
  };

  const toggleTaskExpanded = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Auto-select first list if available
  if (!selectedListId && lists.length > 0) {
    setSelectedListId(lists[0].id);
  }

  const currentList = lists.find((l) => l.id === selectedListId);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Hierarchical Todo App</CardTitle>
            <CardDescription>Sign in to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Sign In with Manus
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Lists</h1>
          <p className="text-slate-400 text-sm">Hierarchical Todo App</p>
        </div>
        <Button
          variant="destructive"
          onClick={() => logout()}
          className="bg-red-500 hover:bg-red-600"
        >
          Logout
        </Button>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-96 bg-slate-800 border-r border-slate-700 p-6 overflow-y-auto">
          {/* New List Input */}
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="New list name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateList()}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <Button
              onClick={handleCreateList}
              disabled={createListMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 px-3"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Lists */}
          <div className="space-y-3">
            {listsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : lists.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No lists yet</p>
            ) : (
              lists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedListId === list.id
                      ? "bg-blue-600 border-2 border-blue-400"
                      : "bg-slate-700 hover:bg-slate-600 border-2 border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{list.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-slate-300">
                    {list.completed} of {list.total} completed
                  </div>
                  <div className="mt-2 bg-slate-600 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all"
                      style={{
                        width: `${list.total === 0 ? 0 : (list.completed / list.total) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-right text-xs text-slate-400 mt-1">
                    {list.total === 0 ? "0%" : Math.round((list.completed / list.total) * 100)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {selectedListId && currentList ? (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-bold mb-2">{currentList.name}</h2>
              </div>

              {/* Add Task Input */}
              <div className="flex gap-3 mb-8">
                <Input
                  placeholder="Add a new task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateTask()}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 text-lg py-6"
                />
                <Button
                  onClick={handleCreateTask}
                  disabled={createTaskMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 px-8 text-lg"
                >
                  Add Task
                </Button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : tasks.length === 0 ? (
                  <p className="text-slate-400 text-center py-12">No tasks yet</p>
                ) : (
                  tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isExpanded={expandedTasks.has(task.id)}
                      onToggleExpand={() => toggleTaskExpanded(task.id)}
                      onToggleComplete={() => handleToggleTask(task.id)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onCreateSubtask={async (title: string, parentId?: number) => {
                        await createTaskMutation.mutateAsync({
                          listId: selectedListId,
                          title,
                          parentTaskId: parentId || task.id,
                        });
                      }}
                      onMoveTask={() => setMoveTaskId(task.id)}
                      lists={lists}
                      refetchTasks={refetchTasks}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-lg">Select a list to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Move Task Dialog */}
      {moveTaskId && (
        <Dialog open={moveTaskId !== null} onOpenChange={() => setMoveTaskId(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle>Move Task</DialogTitle>
              <DialogDescription>Select a list to move this task to</DialogDescription>
            </DialogHeader>
            <Select value={moveTargetListId} onValueChange={setMoveTargetListId}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select a list" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {lists
                  .filter((l) => l.id !== selectedListId)
                  .map((list) => (
                    <SelectItem key={list.id} value={list.id.toString()}>
                      {list.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Button
                onClick={handleMoveTask}
                disabled={moveTaskMutation.isPending || !moveTargetListId}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Move
              </Button>
              <Button
                variant="outline"
                onClick={() => setMoveTaskId(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
