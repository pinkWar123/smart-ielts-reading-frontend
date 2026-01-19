import { QuestionGroup } from './question';

export type PassageStatus = 'draft' | 'processing' | 'ready' | 'finalized' | 'failed';
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PassageImage {
  id: string;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  imageOrder: number;
}

export interface Passage {
  id: string;
  title: string;
  content: string;
  paragraphs?: string[]; // For matching information questions
  createdAt: Date;
  updatedAt: Date;
  questionGroups: QuestionGroup[];
  totalQuestions: number;
}

export interface ExtendedPassage extends Passage {
  status: PassageStatus;
  extractionStatus?: ExtractionStatus;
  extractionError?: string;
  wordCount?: number;
  images?: PassageImage[];
}

export interface PassageInput {
  title: string;
  content: string;
  images?: File[];
}

