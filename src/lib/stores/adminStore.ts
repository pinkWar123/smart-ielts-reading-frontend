import { create } from 'zustand';
import type { Test } from '../types/test';
import type { Passage, ExtendedPassage, ExtractionStatus } from '../types/passage';
import {
  getAllTests,
  createTest as apiCreateTest,
  updateTest as apiUpdateTest,
  deleteTest as apiDeleteTest,
  getAllPassages,
  createPassage as apiCreatePassage,
  updatePassage as apiUpdatePassage,
  deletePassage as apiDeletePassage
} from '../api/storage';
import { mockPassageAPI } from '../api/mockPassageApi';

interface AdminStore {
  // Tests
  tests: Test[];
  currentTest: Test | null;

  // Passages (from localStorage)
  passages: Passage[];
  currentPassage: Passage | null;

  // Extended passage workflow (for image extraction)
  currentExtendedPassage: ExtendedPassage | null;
  extractionStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  extractionError: string | null;

  // Loading state
  isLoading: boolean;

  // Original Actions
  loadTests: () => void;
  loadPassages: () => void;
  setCurrentTest: (test: Test | null) => void;
  setCurrentPassage: (passage: Passage | null) => void;
  createTest: (test: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTest: (id: string, updates: Partial<Test>) => void;
  deleteTest: (id: string) => void;
  createPassage: (passage: Omit<Passage, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePassage: (id: string, updates: Partial<Passage>) => void;
  deletePassage: (id: string) => void;

  // New Extraction Workflow Actions
  createEmptyPassage: (title: string) => Promise<ExtendedPassage>;
  uploadPassageImages: (passageId: string, images: File[]) => Promise<void>;
  triggerExtraction: (passageId: string) => Promise<void>;
  pollExtractionStatus: (passageId: string) => Promise<void>;
  loadPassagePreview: (passageId: string) => Promise<void>;
  updatePassageContent: (passageId: string, updates: Partial<ExtendedPassage>) => Promise<void>;
  updateQuestion: (passageId: string, questionId: string, updates: any) => Promise<void>;
  finalizePassageWorkflow: (passageId: string) => Promise<void>;
  resetPassageWorkflow: () => void;
}

const useAdminStore = create<AdminStore>((set, get) => ({
  tests: [],
  currentTest: null,
  passages: [],
  currentPassage: null,
  currentExtendedPassage: null,
  extractionStatus: 'idle',
  extractionError: null,
  isLoading: false,

  loadTests: () => {
    const tests = getAllTests();
    set({ tests });
  },

  loadPassages: () => {
    const passages = getAllPassages();
    set({ passages });
  },

  setCurrentTest: (test) => {
    set({ currentTest: test });
  },

  setCurrentPassage: (passage) => {
    set({ currentPassage: passage });
  },

  createTest: (test) => {
    const newTest = apiCreateTest(test);
    set((state) => ({ tests: [...state.tests, newTest] }));
  },

  updateTest: (id, updates) => {
    const updated = apiUpdateTest(id, updates);
    if (updated) {
      set((state) => ({
        tests: state.tests.map((t) => (t.id === id ? updated : t)),
        currentTest: state.currentTest?.id === id ? updated : state.currentTest,
      }));
    }
  },

  deleteTest: (id) => {
    const success = apiDeleteTest(id);
    if (success) {
      set((state) => ({
        tests: state.tests.filter((t) => t.id !== id),
        currentTest: state.currentTest?.id === id ? null : state.currentTest,
      }));
    }
  },

  createPassage: (passage) => {
    const newPassage = apiCreatePassage(passage);
    set((state) => ({ passages: [...state.passages, newPassage] }));
  },

  updatePassage: (id, updates) => {
    const updated = apiUpdatePassage(id, updates);
    if (updated) {
      set((state) => ({
        passages: state.passages.map((p) => (p.id === id ? updated : p)),
        currentPassage: state.currentPassage?.id === id ? updated : state.currentPassage,
      }));
    }
  },

  deletePassage: (id) => {
    const success = apiDeletePassage(id);
    if (success) {
      set((state) => ({
        passages: state.passages.filter((p) => p.id !== id),
        currentPassage: state.currentPassage?.id === id ? null : state.currentPassage,
      }));
    }
  },

  // New Extraction Workflow Actions

  createEmptyPassage: async (title: string) => {
    set({ isLoading: true, extractionError: null });
    try {
      const response = await mockPassageAPI.createPassage({ title });
      if (response.success && response.data) {
        set({
          currentExtendedPassage: response.data,
          extractionStatus: 'idle',
          isLoading: false
        });
        return response.data;
      }
      throw new Error('Failed to create passage');
    } catch (error: any) {
      set({ extractionError: error.message, isLoading: false });
      throw error;
    }
  },

  uploadPassageImages: async (passageId: string, images: File[]) => {
    set({ isLoading: true, extractionStatus: 'uploading', extractionError: null });
    try {
      const response = await mockPassageAPI.uploadImages(passageId, images);
      if (response.success) {
        // Update current passage with images
        const passage = get().currentExtendedPassage;
        if (passage && passage.id === passageId) {
          set({
            currentExtendedPassage: { ...passage, images: response.data.uploadedImages },
            extractionStatus: 'idle',
            isLoading: false
          });
        }
      } else {
        throw new Error('Failed to upload images');
      }
    } catch (error: any) {
      set({ extractionError: error.message, isLoading: false, extractionStatus: 'failed' });
      throw error;
    }
  },

  triggerExtraction: async (passageId: string) => {
    set({ extractionStatus: 'processing', extractionError: null });
    try {
      const response = await mockPassageAPI.triggerExtraction(passageId);
      if (response.success) {
        // Start polling
        get().pollExtractionStatus(passageId);
      } else {
        throw new Error('Failed to trigger extraction');
      }
    } catch (error: any) {
      set({ extractionError: error.message, extractionStatus: 'failed' });
      throw error;
    }
  },

  pollExtractionStatus: async (passageId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await mockPassageAPI.getExtractionStatus(passageId);
        if (response.success && response.data) {
          const status = response.data.extractionStatus;

          if (status === 'completed') {
            clearInterval(pollInterval);
            set({ extractionStatus: 'completed' });
            // Load the full passage preview
            await get().loadPassagePreview(passageId);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            set({
              extractionStatus: 'failed',
              extractionError: 'Extraction failed. Please try again.'
            });
          }
          // Otherwise keep polling (status is 'processing')
        }
      } catch (error: any) {
        clearInterval(pollInterval);
        set({
          extractionStatus: 'failed',
          extractionError: error.message
        });
      }
    }, 3000); // Poll every 3 seconds
  },

  loadPassagePreview: async (passageId: string) => {
    set({ isLoading: true });
    try {
      const response = await mockPassageAPI.getPassagePreview(passageId);
      if (response.success && response.data) {
        set({
          currentExtendedPassage: response.data,
          isLoading: false
        });
      } else {
        throw new Error('Failed to load passage preview');
      }
    } catch (error: any) {
      set({ extractionError: error.message, isLoading: false });
      throw error;
    }
  },

  updatePassageContent: async (passageId: string, updates: Partial<ExtendedPassage>) => {
    set({ isLoading: true });
    try {
      const response = await mockPassageAPI.updatePassage(passageId, updates);
      if (response.success && response.data) {
        set({
          currentExtendedPassage: response.data,
          isLoading: false
        });
      } else {
        throw new Error('Failed to update passage');
      }
    } catch (error: any) {
      set({ extractionError: error.message, isLoading: false });
      throw error;
    }
  },

  updateQuestion: async (passageId: string, questionId: string, updates: any) => {
    try {
      const response = await mockPassageAPI.updateQuestion(passageId, questionId, updates);
      if (response.success && response.data) {
        set({ currentExtendedPassage: response.data });
      } else {
        throw new Error('Failed to update question');
      }
    } catch (error: any) {
      set({ extractionError: error.message });
      throw error;
    }
  },

  finalizePassageWorkflow: async (passageId: string) => {
    set({ isLoading: true });
    try {
      const response = await mockPassageAPI.finalizePassage(passageId);
      if (response.success && response.data) {
        const passage = get().currentExtendedPassage;
        if (passage) {
          set({
            currentExtendedPassage: { ...passage, status: 'finalized' },
            isLoading: false
          });
        }
      } else {
        throw new Error('Failed to finalize passage');
      }
    } catch (error: any) {
      set({ extractionError: error.message, isLoading: false });
      throw error;
    }
  },

  resetPassageWorkflow: () => {
    set({
      currentExtendedPassage: null,
      extractionStatus: 'idle',
      extractionError: null,
    });
  },
}));
export default useAdminStore

