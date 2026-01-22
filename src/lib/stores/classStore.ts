import { create } from 'zustand';
import { sessionsApi, type Class, type ClassListItem, type CreateClassRequest, type UpdateClassRequest, type User } from '../api/sessions';
import type { PaginationMeta } from '../api/tests';

interface ClassStore {
  // State
  classes: ClassListItem[];
  selectedClass: Class | null;
  availableStudents: User[];
  paginationMeta: PaginationMeta | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchClasses: (teacherId?: string) => Promise<void>;
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
  paginationMeta: null,
  loading: false,
  error: null,

  // Fetch all classes
  fetchClasses: async (teacherId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await sessionsApi.getAllClasses(1, 10, 'created_at', 'desc', teacherId || null);
      set({ 
        classes: response.data, 
        paginationMeta: response.meta,
        loading: false 
      });
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
      // Refresh the list to get the updated paginated data
      await get().fetchClasses();
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
      // Refresh the list to get updated data
      await get().fetchClasses();
      const selectedClass = get().selectedClass?.id === classId ? updatedClass : get().selectedClass;
      set({ selectedClass, loading: false });
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
      // Refresh the list to get updated data
      await get().fetchClasses();
      const selectedClass = get().selectedClass?.id === classId ? null : get().selectedClass;
      set({ selectedClass, loading: false });
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
      // Refresh the list to get updated student counts
      await get().fetchClasses();
      const selectedClass = get().selectedClass?.id === classId ? updatedClass : get().selectedClass;
      set({ selectedClass, loading: false });
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

