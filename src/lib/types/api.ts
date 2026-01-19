// API Response Types (snake_case to match backend)
// These types represent the data structure returned from the API

export interface APIQuestionOption {
  label: string;
  text: string;
}

export interface APICorrectAnswer {
  value: string;
}

export interface APIQuestion {
  id: string;
  question_number: number;
  question_type: string;
  question_text: string;
  options: APIQuestionOption[] | null;
  correct_answer: APICorrectAnswer;
  explanation: string | null;
  instructions: string;
  points: number;
  order_in_passage: number;
  question_group_id: string;
}

export interface APIQuestionGroup {
  id: string;
  group_instructions: string;
  question_type: string;
  start_question_number: number;
  end_question_number: number;
  order_in_passage: number;
}

export interface APIPassage {
  id: string;
  title: string;
  content: string;
  word_count: number;
  difficulty_level: number;
  topic: string;
  source: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  question_groups: APIQuestionGroup[];
  questions: APIQuestion[];
}

// Question type constants matching API
export const APIQuestionType = {
  TRUE_FALSE_NOTGIVEN: 'TRUE_FALSE_NOTGIVEN',
  YES_NO_NOTGIVEN: 'YES_NO_NOTGIVEN',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  NOTE_COMPLETION: 'NOTE_COMPLETION',
  SENTENCE_COMPLETION: 'SENTENCE_COMPLETION',
  SUMMARY_COMPLETION: 'SUMMARY_COMPLETION',
  SHORT_ANSWER: 'SHORT_ANSWER',
  MATCHING_HEADINGS: 'MATCHING_HEADINGS',
  MATCHING_INFORMATION: 'MATCHING_INFORMATION',
  MATCHING_FEATURES: 'MATCHING_FEATURES',
  DIAGRAM_LABELING: 'DIAGRAM_LABELING',
  TABLE_COMPLETION: 'TABLE_COMPLETION',
  FLOW_CHART: 'FLOW_CHART',
} as const;

export type APIQuestionTypeValue = typeof APIQuestionType[keyof typeof APIQuestionType];

// Helper to check if a question type requires a select input
export const isSelectQuestionType = (type: string): boolean => {
  return [
    APIQuestionType.TRUE_FALSE_NOTGIVEN,
    APIQuestionType.YES_NO_NOTGIVEN,
    APIQuestionType.MULTIPLE_CHOICE,
  ].includes(type as APIQuestionTypeValue);
};

// Helper to get options for select question types
export const getSelectOptions = (type: string): { label: string; value: string }[] => {
  switch (type) {
    case APIQuestionType.TRUE_FALSE_NOTGIVEN:
      return [
        { label: 'TRUE', value: 'TRUE' },
        { label: 'FALSE', value: 'FALSE' },
        { label: 'NOT GIVEN', value: 'NOT GIVEN' },
      ];
    case APIQuestionType.YES_NO_NOTGIVEN:
      return [
        { label: 'YES', value: 'YES' },
        { label: 'NO', value: 'NO' },
        { label: 'NOT GIVEN', value: 'NOT GIVEN' },
      ];
    default:
      return [];
  }
};

// Editable passage data for preview/edit mode
export interface EditablePassageData {
  title: string;
  content: string;
  topic: string;
  source: string;
  difficulty_level: number;
  questions: EditableQuestion[];
  question_groups: EditableQuestionGroup[];
}

export interface EditableQuestion {
  id: string;
  question_number: number;
  question_type: string;
  question_text: string;
  correct_answer: string;
  options: APIQuestionOption[] | null;
  instructions: string;
  points: number;
  question_group_id: string;
}

export interface EditableQuestionGroup {
  id: string;
  group_instructions: string;
  question_type: string;
  start_question_number: number;
  end_question_number: number;
}

// Transform API passage to editable format
export const apiPassageToEditable = (passage: APIPassage): EditablePassageData => ({
  title: passage.title,
  content: passage.content,
  topic: passage.topic,
  source: passage.source,
  difficulty_level: passage.difficulty_level,
  question_groups: passage.question_groups.map(g => ({
    id: g.id,
    group_instructions: g.group_instructions,
    question_type: g.question_type,
    start_question_number: g.start_question_number,
    end_question_number: g.end_question_number,
  })),
  questions: passage.questions.map(q => ({
    id: q.id,
    question_number: q.question_number,
    question_type: q.question_type,
    question_text: q.question_text,
    correct_answer: q.correct_answer.value,
    options: q.options,
    instructions: q.instructions,
    points: q.points,
    question_group_id: q.question_group_id,
  })),
});

