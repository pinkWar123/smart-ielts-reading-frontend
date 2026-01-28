import { useAuthStore } from '../stores/authStore';

// API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Helper to get auth token
const getAuthHeader = (): Record<string, string> => {
  const token = useAuthStore.getState().getAccessToken();
  if (!token) {
    throw new ApiError('Authentication required', 401);
  }
  return { Authorization: `Bearer ${token}` };
};

// Helper to handle API responses
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      // Log full error for debugging
      console.error('API Error Response:', JSON.stringify(errorData, null, 2));
      // Handle FastAPI validation error format
      if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((e: { loc?: string[]; msg?: string }) => 
          `${e.loc?.join('.')}: ${e.msg}`
        ).join('; ');
      } else {
        errorMessage = errorData.detail || errorData.message || errorMessage;
      }
      errorCode = errorData.code;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  return response.json();
}

// ==================== Types ====================

export type TestType = 'FULL_TEST' | 'SINGLE_PASSAGE';
export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type UserView = 'ADMIN' | 'USER';
export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE_NOTGIVEN'
  | 'YES_NO_NOTGIVEN'
  | 'MATCHING_HEADINGS'
  | 'MATCHING_INFORMATION'
  | 'MATCHING_FEATURES'
  | 'MATCHING_SENTENCE_ENDINGS'
  | 'SENTENCE_COMPLETION'
  | 'SUMMARY_COMPLETION'
  | 'NOTE_COMPLETION'
  | 'TABLE_COMPLETION'
  | 'FLOW_CHART_COMPLETION'
  | 'DIAGRAM_LABEL_COMPLETION'
  | 'SHORT_ANSWER';

// Question types that require shared options at the group level
export const QUESTION_TYPES_WITH_OPTIONS: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'MATCHING_HEADINGS',
  'MATCHING_INFORMATION',
  'MATCHING_FEATURES',
  'MATCHING_SENTENCE_ENDINGS',
];

export const requiresGroupOptions = (questionType: QuestionType): boolean => {
  return QUESTION_TYPES_WITH_OPTIONS.includes(questionType);
};

// Request types
export interface CreateTestRequest {
  title: string;
  description?: string;
  test_type: TestType;
  time_limit_minutes: number;
}

export interface AddPassageToTestRequest {
  passage_id: string;
}

export interface QuestionOptionDTO {
  label: string;
  text: string;
}

export interface QuestionGroupDTO {
  id: string;
  group_instructions: string;
  question_type: QuestionType;
  start_question_number: number;
  end_question_number: number;
  order_in_passage: number;
  options?: QuestionOptionDTO[] | null;
}

export interface QuestionDTO {
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  options?: QuestionOptionDTO[] | null;
  correct_answer: Record<string, unknown>;
  explanation?: string | null;
  instructions?: string | null;
  points?: number;
  order_in_passage: number;
  question_group_id?: string | null;
}

export interface CreateCompletePassageRequest {
  title: string;
  content: string;
  difficulty_level?: number;
  topic: string;
  source?: string | null;
  question_groups?: QuestionGroupDTO[];
  questions: QuestionDTO[];
}

// Response types
export interface Author {
  id: string;
  username: string;
  email: string;
  full_name: string;
}

export interface TestResponse {
  id: string;
  title: string;
  description: string | null;
  test_type: TestType;
  passage_ids: string[];
  time_limit_minutes: number;
  total_questions: number;
  total_points: number;
  status: TestStatus;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
}

export interface PublishTestResponse {
  success: boolean;
  message: string;
}

export interface TestListItem {
  test_id: string;
  title: string;
  passage_count: number;
  status: TestStatus;
  type: TestType;
  time_limit_minutes: number;
  total_points: number;
  total_questions: number;
  created_by: Author;
}

export interface GetAllTestsResponse {
  tests: TestListItem[];
}

export interface QuestionGroupResponseDTO {
  id: string;
  group_instructions: string;
  question_type: QuestionType;
  start_question_number: number;
  end_question_number: number;
  order_in_passage: number;
  options?: QuestionOptionDTO[] | null;
}

export interface QuestionResponseDTO {
  id: string;
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  options: QuestionOptionDTO[] | null;
  correct_answer: Record<string, unknown>;
  explanation: string | null;
  instructions: string | null;
  points: number;
  order_in_passage: number;
  question_group_id: string | null;
}

export interface PassageResponse {
  id: string;
  title: string;
  content: string;
  word_count: number;
  difficulty_level: number;
  topic: string;
  source: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
}

// Pagination types
export interface PaginationMeta {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GetPaginatedPassagesResponse {
  data: PassageResponse[];
  meta: PaginationMeta;
}

export interface GetPaginatedPassagesParams {
  page?: number;
  page_size?: number;
  exclude_passage_ids?: string[];
  topic?: string;
  difficulty_level?: number;
  search?: string;
}

export interface CompletePassageResponse extends PassageResponse {
  question_groups: QuestionGroupResponseDTO[];
  questions: QuestionResponseDTO[];
}

// OCR Types
export interface ExtractedCorrectAnswer {
  answer?: string | string[] | null;
  acceptable_answers?: string[];
}

export interface ExtractedOption {
  label: string;
  text: string;
}

export interface ExtractedQuestion {
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  options?: ExtractedOption[] | null;
  correct_answer: ExtractedCorrectAnswer;
  explanation?: string | null;
  instructions?: string | null;
  points?: number;
  order_in_passage: number;
  question_group_id?: string | null;
}

export interface ExtractedQuestionGroup {
  id: string;
  group_instructions: string;
  question_type: QuestionType;
  start_question_number: number;
  end_question_number: number;
  order_in_passage: number;
  options?: ExtractedOption[] | null;
}

export interface ExtractedPassage {
  title: string;
  content: string;
  difficulty_level?: number;
  topic: string;
  source?: string | null;
  question_groups: ExtractedQuestionGroup[];
  questions: ExtractedQuestion[];
}

export interface TestMetadata {
  title?: string | null;
  description?: string | null;
  total_questions: number;
  estimated_time_minutes?: number;
  test_type?: TestType;
}

export interface ExtractedTestResponse {
  passages: ExtractedPassage[];
  test_metadata: TestMetadata;
  extraction_notes?: string[] | null;
  confidence_score?: number | null;
}

// ==================== Pagination Types ====================

export interface PaginationMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

// Paginated single test item
export interface SingleTestDTO {
  id: string;
  title: string;
  question_types: QuestionType[];
}

// Paginated full test item
export interface FullTestDTO {
  id: string;
  title: string;
}

export interface GetPaginatedSingleTestsResponse {
  data: SingleTestDTO[];
  meta: PaginationMeta;
}

export interface GetPaginatedFullTestsResponse {
  data: FullTestDTO[];
  meta: PaginationMeta;
}

// ==================== Passage Detail Types ====================

export interface AuthorInfo {
  id: string;
  username: string;
  full_name: string;
  email: string;
}

// Question DTO for passage detail (includes correct_answer which may be null for USER view)
export interface PassageDetailQuestionDTO {
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  options?: QuestionOptionDTO[] | null;
  correct_answer?: {
    answer?: string | string[] | null;
    acceptable_answers?: string[];
  } | null;
  explanation?: string | null;
  instructions?: string | null;
  points: number;
  order_in_passage: number;
  question_group_id?: string | null;
}

// Question group with nested questions for passage detail
export interface PassageDetailQuestionGroupDTO {
  id: string;
  group_instructions: string;
  question_type: QuestionType;
  start_question_number: number;
  end_question_number: number;
  order_in_passage: number;
  options?: QuestionOptionDTO[] | null;
  questions?: PassageDetailQuestionDTO[] | null;
}

export interface GetPassageDetailByIdResponse {
  title: string;
  content: string;
  difficulty_level: number;
  topic: string;
  source?: string | null;
  question_groups: PassageDetailQuestionGroupDTO[];
  created_by: AuthorInfo;
}

// ==================== Update Passage Types ====================

export interface UpdateQuestionDTO {
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  options?: QuestionOptionDTO[] | null;
  correct_answer: Record<string, unknown>;
  explanation?: string | null;
  instructions?: string | null;
  points?: number;
  order_in_passage: number;
  question_group_id?: string | null;
}

export interface UpdateQuestionGroupDTO {
  id: string;
  group_instructions: string;
  question_type: QuestionType;
  start_question_number: number;
  end_question_number: number;
  order_in_passage: number;
  options?: QuestionOptionDTO[] | null;
}

export interface UpdatePassageWithQuestionsRequest {
  title: string;
  content: string;
  difficulty_level: number;
  topic: string;
  source?: string | null;
  question_groups?: UpdateQuestionGroupDTO[];
  questions: UpdateQuestionDTO[];
}

// ==================== Test Detail with View Types ====================

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export interface TestDetailMetadata {
  title?: string | null;
  description?: string | null;
  total_questions: number;
  estimated_time_minutes: number;
  type: TestType;
  status: TestStatus;
  created_by: UserInfo;
  created_at: string;
  updated_at?: string | null;
}

export interface TestDetailPassageDTO {
  title: string;
  content: string;
  difficulty_level: number;
  topic: string;
  source?: string | null;
  question_groups: PassageDetailQuestionGroupDTO[];
}

export interface GetTestDetailWithViewResponse {
  passages: TestDetailPassageDTO[];
  test_metadata: TestDetailMetadata;
}

// ==================== API Functions ====================

// Test detail types
export interface TestPassageSummary {
  id: string;
  title: string;
  reduced_content: string;
  word_count: number;
  difficulty_level: number;
  topic: string;
  source: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TestDetailResponse {
  id: string;
  passage_count: number;
  passages: TestPassageSummary[];
  // These fields may or may not be present depending on the API
  title?: string;
  description?: string | null;
  test_type?: TestType;
  time_limit_minutes?: number;
  total_questions?: number;
  total_points?: number;
  status?: TestStatus;
  created_by?: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface UpdateTestRequest {
  title?: string;
  description?: string;
  time_limit_minutes?: number;
}

// ==================== Full Test Detail Types ====================

export interface FullTestQuestionOption {
  label: string;
  text: string;
}

export interface FullTestCorrectAnswer {
  answer: string | string[];
  acceptable_answers?: string[];
}

export interface FullTestQuestion {
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  options?: FullTestQuestionOption[] | null;
  correct_answer: FullTestCorrectAnswer;
  explanation?: string | null;
  instructions?: string | null;
  points: number;
  order_in_passage: number;
  question_group_id?: string | null;
}

export interface FullTestQuestionGroup {
  id: string;
  group_instructions: string;
  question_type: QuestionType;
  start_question_number: number;
  end_question_number: number;
  order_in_passage: number;
  options?: FullTestQuestionOption[] | null;
  questions: FullTestQuestion[];
}

export interface FullTestPassage {
  title: string;
  content: string;
  difficulty_level: number;
  topic: string;
  source?: string | null;
  question_groups: FullTestQuestionGroup[];
}

export interface FullTestCreatedBy {
  id: string;
  name: string;
  email: string;
}

export interface FullTestMetadata {
  title: string;
  description?: string | null;
  total_questions: number;
  estimated_time_minutes: number;
  type: TestType;
  status: TestStatus;
  created_by: FullTestCreatedBy;
  created_at: string;
  updated_at?: string | null;
}

export interface FullTestDetailResponse {
  passages: FullTestPassage[];
  test_metadata: FullTestMetadata;
}

export const testsApi = {
  /**
   * Create a new empty test
   */
  async createTest(data: CreateTestRequest): Promise<TestResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<TestResponse>(response);
  },

  /**
   * Get all tests
   */
  async getAllTests(testStatus?: TestStatus, testType?: TestType): Promise<GetAllTestsResponse> {
    const params = new URLSearchParams();
    if (testStatus) params.append('test_status', testStatus);
    if (testType) params.append('test_type', testType);

    const url = `${API_BASE_URL}/api/v1/tests${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<GetAllTestsResponse>(response);
  },

  /**
   * Get test detail with passages (summary)
   */
  async getTestDetail(testId: string): Promise<TestDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<TestDetailResponse>(response);
  },

  /**
   * Get full test detail with passages and questions
   */
  async getFullTestDetail(testId: string): Promise<FullTestDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}/full`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<FullTestDetailResponse>(response);
  },

  /**
   * Update a test
   */
  async updateTest(testId: string, data: UpdateTestRequest): Promise<TestResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<TestResponse>(response);
  },

  /**
   * Delete a test
   */
  async deleteTest(testId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || 'Failed to delete test',
        response.status,
        errorData.code
      );
    }
  },

  /**
   * Publish a test (change status to PUBLISHED)
   */
  async publishTest(testId: string): Promise<PublishTestResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<PublishTestResponse>(response);
  },

  /**
   * Unpublish a test (change status to DRAFT)
   */
  async unpublishTest(testId: string): Promise<PublishTestResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}/unpublish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<PublishTestResponse>(response);
  },

  /**
   * Add a passage to a test
   */
  async addPassageToTest(testId: string, passageId: string): Promise<TestResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}/passages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ passage_id: passageId }),
    });

    return handleResponse<TestResponse>(response);
  },

  /**
   * Remove a passage from a test
   */
  async removePassageFromTest(testId: string, passageId: string): Promise<TestResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}/passages/${passageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<TestResponse>(response);
  },

  /**
   * Get paginated single tests with optional question type filter
   */
  async getPaginatedSingleTests(
    page: number = 1,
    pageSize: number = 10,
    questionTypes?: QuestionType[]
  ): Promise<GetPaginatedSingleTestsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    if (questionTypes && questionTypes.length > 0) {
      questionTypes.forEach(type => params.append('question_types', type));
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/tests/single-tests?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<GetPaginatedSingleTestsResponse>(response);
  },

  /**
   * Get paginated full tests
   */
  async getPaginatedFullTests(
    page: number = 1,
    pageSize: number = 10
  ): Promise<GetPaginatedFullTestsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/api/v1/tests/full-tests?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<GetPaginatedFullTestsResponse>(response);
  },

  /**
   * Get test detail with view (ADMIN or USER)
   * ADMIN view includes correct answers, USER view hides them
   */
  async getTestDetailWithView(
    testId: string,
    view: UserView
  ): Promise<GetTestDetailWithViewResponse> {
    const params = new URLSearchParams();
    params.append('view', view);

    const response = await fetch(`${API_BASE_URL}/api/v1/tests/${testId}/detail?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<GetTestDetailWithViewResponse>(response);
  },
};

export interface UpdatePassageRequest {
  title?: string;
  content?: string;
  difficulty_level?: number;
  topic?: string;
  source?: string | null;
}

export const passagesApi = {
  /**
   * Create a complete passage with questions
   */
  async createCompletePassage(data: CreateCompletePassageRequest): Promise<CompletePassageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/passages/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<CompletePassageResponse>(response);
  },

  /**
   * Get all passages (deprecated - use getPaginatedPassages instead)
   */
  async getAllPassages(): Promise<PassageResponse[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/passages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<PassageResponse[]>(response);
  },

  /**
   * Get paginated passages with optional filters
   */
  async getPaginatedPassages(params: GetPaginatedPassagesParams = {}): Promise<GetPaginatedPassagesResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params.topic) searchParams.append('topic', params.topic);
    if (params.difficulty_level) searchParams.append('difficulty_level', params.difficulty_level.toString());
    if (params.search) searchParams.append('search', params.search);
    
    // Handle array of exclude_passage_ids
    if (params.exclude_passage_ids && params.exclude_passage_ids.length > 0) {
      params.exclude_passage_ids.forEach(id => searchParams.append('exclude_passage_ids', id));
    }
    
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/api/v1/passages${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<GetPaginatedPassagesResponse>(response);
  },

  /**
   * Get a complete passage with questions
   */
  async getCompletePassage(passageId: string): Promise<CompletePassageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/passages/${passageId}/complete`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<CompletePassageResponse>(response);
  },

  /**
   * Update a passage
   */
  async updatePassage(passageId: string, data: UpdatePassageRequest): Promise<PassageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/passages/${passageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<PassageResponse>(response);
  },

  /**
   * Delete a passage
   */
  async deletePassage(passageId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/passages/${passageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || 'Failed to delete passage',
        response.status,
        errorData.code
      );
    }
  },

  /**
   * Get passage detail by ID with author info and questions
   */
  async getPassageById(passageId: string): Promise<GetPassageDetailByIdResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/passages/${passageId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return handleResponse<GetPassageDetailByIdResponse>(response);
  },

  /**
   * Update a passage with all questions (13-14 questions required)
   */
  async updatePassageWithQuestions(
    passageId: string,
    data: UpdatePassageWithQuestionsRequest
  ): Promise<CompletePassageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/passages/${passageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<CompletePassageResponse>(response);
  },
};

export const ocrApi = {
  /**
   * Extract test from images
   */
  async extractTestFromImages(
    files: File[],
    testTitle?: string,
    extractionHint?: string
  ): Promise<ExtractedTestResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    if (testTitle) {
      formData.append('test_title', testTitle);
    }
    if (extractionHint) {
      formData.append('extraction_hint', extractionHint);
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/ocr/extract-test`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formData,
    });

    return handleResponse<ExtractedTestResponse>(response);
  },

  /**
   * Extract text from a single image
   */
  async extractTextFromImage(file: File, prompt?: string): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (prompt) {
      formData.append('prompt', prompt);
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/ocr/extract-text`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });

    return handleResponse<{ text: string }>(response);
  },
};

export default { testsApi, passagesApi, ocrApi };

