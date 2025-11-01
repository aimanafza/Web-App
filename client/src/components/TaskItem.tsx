import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Trash2, Plus, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Task {
  id: number;
  title: string;
  completed: boolean;
  subtasks?: Task[];
}

interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onCreateSubtask: (title: string) => Promise<void>;
  onMoveTask: () => void;
  lists: any[];
  refetchTasks: () => void;
}

export default function TaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onCreateSubtask,
  onMoveTask,
  lists,
  refetchTasks,
}: TaskItemProps) {
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const handleCreateSubtask = async () => {
    if (!subtaskTitle.trim()) {
      toast.error("Subtask title cannot be empty");
      return;
    }
    setIsCreatingSubtask(true);
    try {
      await onCreateSubtask(subtaskTitle);
      setSubtaskTitle("");
      setShowSubtaskInput(false);
    } catch (error) {
      toast.error("Failed to create subtask");
    } finally {
      setIsCreatingSubtask(false);
    }
  };

  return (
    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
      <div className="flex items-center gap-3">
        {/* Expand/Collapse Button */}
        {hasSubtasks && (
          <button
            onClick={onToggleExpand}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
        {!hasSubtasks && <div className="w-5" />}

        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Task Title */}
        <span
          className={`flex-1 text-lg ${
            task.completed ? "line-through text-slate-500" : "text-white"
          }`}
        >
          {task.title}
        </span>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Down Arrow (Move) */}
          <button
            onClick={onMoveTask}
            className="p-2 bg-slate-600 hover:bg-slate-500 rounded transition-colors text-slate-300 hover:text-white"
            title="Move to another list"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Add Subtask */}
          <button
            onClick={() => setShowSubtaskInput(!showSubtaskInput)}
            className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors text-white"
            title="Add subtask"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Edit */}
          <button
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors text-white"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtask Input */}
      {showSubtaskInput && (
        <div className="mt-4 ml-8 flex gap-2">
          <Input
            placeholder="New subtask..."
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateSubtask()}
            className="bg-slate-600 border-slate-500 text-white placeholder:text-slate-400"
            autoFocus
          />
          <Button
            onClick={handleCreateSubtask}
            disabled={isCreatingSubtask}
            className="bg-green-600 hover:bg-green-700"
          >
            Add
          </Button>
        </div>
      )}

      {/* Subtasks */}
      {isExpanded && hasSubtasks && (
        <div className="mt-4 ml-8 space-y-3 border-l-2 border-slate-600 pl-4">
          {task.subtasks?.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              task={subtask}
              onToggleComplete={async () => {
                // Toggle subtask completion
                const toggleMutation = trpc.task.toggleCompletion.useMutation({
                  onSuccess: () => refetchTasks(),
                });
                await toggleMutation.mutateAsync({ taskId: subtask.id });
              }}
              onDelete={async () => {
                if (confirm("Delete this subtask?")) {
                  const deleteMutation = trpc.task.delete.useMutation({
                    onSuccess: () => refetchTasks(),
                  });
                  await deleteMutation.mutateAsync({ taskId: subtask.id });
                }
              }}
              onCreateSubtask={onCreateSubtask}
              refetchTasks={refetchTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SubtaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onDelete: () => void;
  onCreateSubtask: (title: string) => Promise<void>;
  refetchTasks: () => void;
}

function SubtaskItem({
  task,
  onToggleComplete,
  onDelete,
  onCreateSubtask,
  refetchTasks,
}: SubtaskItemProps) {
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const handleCreateSubtask = async () => {
    if (!subtaskTitle.trim()) {
      toast.error("Subtask title cannot be empty");
      return;
    }
    try {
      await onCreateSubtask(subtaskTitle);
      setSubtaskTitle("");
      setShowSubtaskInput(false);
    } catch (error) {
      toast.error("Failed to create subtask");
    }
  };

  return (
    <div className="bg-slate-600 rounded-lg p-3 border border-slate-500">
      <div className="flex items-center gap-2">
        {/* Expand/Collapse Button */}
        {hasSubtasks && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-300 hover:text-white transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasSubtasks && <div className="w-4" />}

        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className="text-slate-300 hover:text-white transition-colors flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        {/* Task Title */}
        <span
          className={`flex-1 text-sm ${
            task.completed ? "line-through text-slate-400" : "text-slate-100"
          }`}
        >
          {task.title}
        </span>

        {/* Action Buttons */}
        <div className="flex gap-1 flex-shrink-0">
          {/* Add Subtask */}
          <button
            onClick={() => setShowSubtaskInput(!showSubtaskInput)}
            className="p-1 bg-green-600 hover:bg-green-700 rounded transition-colors text-white text-xs"
            title="Add subtask"
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-1 bg-red-600 hover:bg-red-700 rounded transition-colors text-white text-xs"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Subtask Input */}
      {showSubtaskInput && (
        <div className="mt-2 ml-6 flex gap-2">
          <Input
            placeholder="New subtask..."
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateSubtask()}
            className="bg-slate-500 border-slate-400 text-white placeholder:text-slate-300 text-sm"
            autoFocus
          />
          <Button
            onClick={handleCreateSubtask}
            className="bg-green-600 hover:bg-green-700 text-xs px-2"
          >
            Add
          </Button>
        </div>
      )}

      {/* Nested Subtasks */}
      {isExpanded && hasSubtasks && (
        <div className="mt-2 ml-6 space-y-2 border-l-2 border-slate-500 pl-3">
          {task.subtasks?.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              task={subtask}
              onToggleComplete={async () => {
                const toggleMutation = trpc.task.toggleCompletion.useMutation({
                  onSuccess: () => refetchTasks(),
                });
                await toggleMutation.mutateAsync({ taskId: subtask.id });
              }}
              onDelete={async () => {
                if (confirm("Delete this subtask?")) {
                  const deleteMutation = trpc.task.delete.useMutation({
                    onSuccess: () => refetchTasks(),
                  });
                  await deleteMutation.mutateAsync({ taskId: subtask.id });
                }
              }}
              onCreateSubtask={onCreateSubtask}
              refetchTasks={refetchTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
