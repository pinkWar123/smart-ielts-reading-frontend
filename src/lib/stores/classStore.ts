import { create } from 'zustand';
import { sessionsApi, type Class, type CreateClassRequest, type UpdateClassRequest, type User } from '../api/sessions';

interface ClassStore {
  // State
  classes: Class[];
  selectedClass: Class | null;
  availableStudents: User[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchClasses: () => Promise<void>;
  fetchClassById: (classId: string) => Promise<void>;
  createClass: (data: CreateClassRequest) => Promise<Class>;
  updateClass: (classId: string, data: UpdateClassRequest) => Promise<Class>;
  deleteClass: (classId: string) => Promise<void>;
  enrollStudent: (classId: string, studentId: string) => Promise<void>;
  removeStudent: (classId: string, studentId: string) => Promise<void>;
  fetchAvailableStudents: () => Promise<void>;
  setSelectedClass: (class_: Class | null) => void;
  clearError: () => void;
}

export const useClassStore = create<ClassStore>((set, get) => ({
  // Initial state
  classes: [],
  selectedClass: null,
  availableStudents: [],
  loading: false,
  error: null,

  // Fetch all classes
  fetchClasses: async () => {
    set({ loading: true, error: null });
    try {
      const classes = await sessionsApi.getAllClasses();
      set({ classes, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch classes';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Fetch class by ID
  fetchClassById: async (classId: string) => {
    set({ loading: true, error: null });
    try {
      const class_ = await sessionsApi.getClassById(classId);
      set({ selectedClass: class_, loading: false });
      
      // Update in classes list if exists
      const classes = get().classes;
      const index = classes.findIndex((c) => c.id === classId);
      if (index >= 0) {
        classes[index] = class_;
        set({ classes: [...classes] });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch class';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Create class
  createClass: async (data: CreateClassRequest) => {
    set({ loading: true, error: null });
    try {
      const newClass = await sessionsApi.createClass(data);
      set((state) => ({
        classes: [...state.classes, newClass],
        loading: false,
      }));
      return newClass;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create class';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Update class
  updateClass: async (classId: string, data: UpdateClassRequest) => {
    set({ loading: true, error: null });
    try {
      const updatedClass = await sessionsApi.updateClass(classId, data);
      set((state) => {
        const classes = state.classes.map((c) =>
          c.id === classId ? updatedClass : c
        );
        const selectedClass =
          state.selectedClass?.id === classId ? updatedClass : state.selectedClass;
        return { classes, selectedClass, loading: false };
      });
      return updatedClass;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update class';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Delete (archive) class
  deleteClass: async (classId: string) => {
    set({ loading: true, error: null });
    try {
      await sessionsApi.deleteClass(classId);
      set((state) => {
        const classes = state.classes.filter((c) => c.id !== classId);
        const selectedClass =
          state.selectedClass?.id === classId ? null : state.selectedClass;
        return { classes, selectedClass, loading: false };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete class';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Enroll student
  enrollStudent: async (classId: string, studentId: string) => {
    set({ loading: true, error: null });
    try {
      const updatedClass = await sessionsApi.enrollStudent(classId, studentId);
      set((state) => {
        const classes = state.classes.map((c) =>
          c.id === classId ? updatedClass : c
        );
        const selectedClass =
          state.selectedClass?.id === classId ? updatedClass : state.selectedClass;
        return { classes, selectedClass, loading: false };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enroll student';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Remove student
  removeStudent: async (classId: string, studentId: string) => {
    set({ loading: true, error: null });
    try {
      await sessionsApi.removeStudent(classId, studentId);
      // Refresh class to get updated student list
      await get().fetchClassById(classId);
      set({ loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove student';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Fetch available students (for enrollment)
  fetchAvailableStudents: async () => {
    set({ loading: true, error: null });
    try {
      const students = await sessionsApi.getAllStudents();
      set({ availableStudents: students, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch students';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Set selected class
  setSelectedClass: (class_: Class | null) => {
    set({ selectedClass: class_ });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

