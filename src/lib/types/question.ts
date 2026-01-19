// IELTS Question Types
export const QuestionType = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TRUE_FALSE_NOT_GIVEN: 'TRUE_FALSE_NOT_GIVEN',
  YES_NO_NOT_GIVEN: 'YES_NO_NOT_GIVEN',
  MATCHING_HEADINGS: 'MATCHING_HEADINGS',
  MATCHING_INFORMATION: 'MATCHING_INFORMATION',
  MATCHING_FEATURES: 'MATCHING_FEATURES',
  SENTENCE_COMPLETION: 'SENTENCE_COMPLETION',
  SUMMARY_COMPLETION: 'SUMMARY_COMPLETION',
  SHORT_ANSWER: 'SHORT_ANSWER',
  DIAGRAM_LABELING: 'DIAGRAM_LABELING',
  TABLE_COMPLETION: 'TABLE_COMPLETION',
  FLOW_CHART: 'FLOW_CHART',
  NOTE_COMPLETION: 'NOTE_COMPLETION',
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  questionNumber: number;
  text: string;
  answer: string | string[]; // Correct answer(s)
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'MULTIPLE_CHOICE';
  options: string[];
  answer: string;
}

export interface TrueFalseNotGivenQuestion extends BaseQuestion {
  type: 'TRUE_FALSE_NOT_GIVEN';
  answer: 'TRUE' | 'FALSE' | 'NOT GIVEN';
}

export interface YesNoNotGivenQuestion extends BaseQuestion {
  type: 'YES_NO_NOT_GIVEN';
  answer: 'YES' | 'NO' | 'NOT GIVEN';
}

export interface MatchingHeadingsQuestion extends BaseQuestion {
  type: 'MATCHING_HEADINGS';
  headings: { id: string; text: string }[];
  answer: string; // heading id
}

export interface MatchingInformationQuestion extends BaseQuestion {
  type: 'MATCHING_INFORMATION';
  paragraphs: string[]; // e.g., ['A', 'B', 'C', 'D']
  answer: string; // paragraph letter
}

export interface MatchingFeaturesQuestion extends BaseQuestion {
  type: 'MATCHING_FEATURES';
  features: { id: string; text: string }[];
  answer: string; // feature id
}

export interface SentenceCompletionQuestion extends BaseQuestion {
  type: 'SENTENCE_COMPLETION';
  wordLimit?: number;
  answer: string;
}

export interface SummaryCompletionQuestion extends BaseQuestion {
  type: 'SUMMARY_COMPLETION';
  wordLimit?: number;
  options?: string[]; // For summary with word bank
  answer: string;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'SHORT_ANSWER';
  wordLimit?: number;
  answer: string;
}

export interface DiagramLabelingQuestion extends BaseQuestion {
  type: 'DIAGRAM_LABELING';
  diagramUrl?: string;
  wordLimit?: number;
  answer: string;
}

export interface TableCompletionQuestion extends BaseQuestion {
  type: 'TABLE_COMPLETION';
  wordLimit?: number;
  answer: string;
}

export interface FlowChartQuestion extends BaseQuestion {
  type: 'FLOW_CHART';
  wordLimit?: number;
  answer: string;
}

export interface NoteCompletionQuestion extends BaseQuestion {
  type: 'NOTE_COMPLETION';
  wordLimit?: number;
  answer: string;
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseNotGivenQuestion
  | YesNoNotGivenQuestion
  | MatchingHeadingsQuestion
  | MatchingInformationQuestion
  | MatchingFeaturesQuestion
  | SentenceCompletionQuestion
  | SummaryCompletionQuestion
  | ShortAnswerQuestion
  | DiagramLabelingQuestion
  | TableCompletionQuestion
  | FlowChartQuestion
  | NoteCompletionQuestion;

export interface QuestionGroup {
  id: string;
  type: QuestionType;
  instructions: string;
  questions: Question[];
  startNumber: number;
  endNumber: number;
}

