"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  GripVertical,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

import { Button } from "@ogm/ui/button";
import { Input } from "@ogm/ui/input";

interface Lesson {
  id: string;
  title: string;
  videoUrl: string | null;
  content: string | null;
  isPreview: boolean | null;
  position: number | null;
}

interface Module {
  id: string;
  title: string;
  position: number | null;
  lessons: Lesson[];
}

interface ModuleManagerProps {
  courseId: string;
  modules: Module[];
}

export function ModuleManager({ courseId, modules }: ModuleManagerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id)),
  );
  const [addingModuleId, setAddingModuleId] = useState<string | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");

  const createModule = useMutation(
    trpc.module.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        setIsAddingModule(false);
        setNewModuleTitle("");
      },
    }),
  );

  const deleteModule = useMutation(
    trpc.module.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  const createLesson = useMutation(
    trpc.lesson.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        setAddingModuleId(null);
        setNewLessonTitle("");
      },
    }),
  );

  const deleteLesson = useMutation(
    trpc.lesson.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    createModule.mutate({
      courseId,
      title: newModuleTitle,
      position: modules.length,
    });
  };

  const handleCreateLesson = (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    const module = modules.find((m) => m.id === moduleId);
    createLesson.mutate({
      moduleId,
      title: newLessonTitle,
      position: module?.lessons.length ?? 0,
    });
  };

  const sortedModules = [...modules].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  return (
    <div className="space-y-4">
      {/* Modules list */}
      <div className="space-y-2">
        {sortedModules.map((module, moduleIndex) => (
          <div key={module.id} className="rounded-lg border">
            {/* Module header */}
            <div className="flex items-center gap-2 p-3 bg-muted/30">
              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                className="p-1 hover:bg-muted rounded"
              >
                {expandedModules.has(module.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <span className="flex-1 font-medium">
                Module {moduleIndex + 1}: {module.title}
              </span>
              <span className="text-sm text-muted-foreground">
                {module.lessons.length} lessons
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this module and all its lessons?")) {
                    deleteModule.mutate({ id: module.id });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {/* Lessons */}
            {expandedModules.has(module.id) && (
              <div className="border-t">
                <div className="p-2 space-y-1">
                  {module.lessons
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                    .map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-2 rounded px-3 py-2 hover:bg-muted/50"
                      >
                        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                        <Play className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">
                          {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                        </span>
                        {lesson.isPreview && (
                          <span className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                            <Eye className="h-3 w-3" />
                            Preview
                          </span>
                        )}
                        {lesson.videoUrl && (
                          <span className="text-xs text-muted-foreground">
                            Video
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this lesson?")) {
                              deleteLesson.mutate({ id: lesson.id });
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}

                  {/* Add lesson form */}
                  {addingModuleId === module.id ? (
                    <form
                      onSubmit={(e) => handleCreateLesson(e, module.id)}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <Input
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder="Lesson title"
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={createLesson.isPending}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setAddingModuleId(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingModuleId(module.id)}
                      className="flex items-center gap-2 w-full rounded px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Lesson
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {modules.length === 0 && !isAddingModule && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No modules yet. Create one to add lessons.
          </p>
        )}
      </div>

      {/* Add module form */}
      {isAddingModule ? (
        <form onSubmit={handleCreateModule} className="flex items-center gap-2">
          <Input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="Module title"
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={createModule.isPending}>
            {createModule.isPending ? "Adding..." : "Add Module"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsAddingModule(false)}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setIsAddingModule(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Module
        </Button>
      )}
    </div>
  );
}
