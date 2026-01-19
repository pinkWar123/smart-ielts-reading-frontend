import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PassagePreviewEditor } from '@/components/admin/PassagePreviewEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import type { APIPassage, EditablePassageData } from '@/lib/types/api';

// Sample data from the API
const samplePassageData: APIPassage = {
  id: "ce66ecd8-8c4d-4a90-b300-fbe68ce28d0d",
  title: "Investing in the Future",
  content: "The founding and development of many universities has been dependent on philanthropy. This has been true from some of the oldest universities such as Bologna, Oxford and Cambridge in the twelfth century, to relative newcomers like the universities of Harvard and Yale in the seventeenth century. Wealthy merchants gave young institutions money, land, libraries and rare items. Their belief in the value of higher learning is echoed by the growing number of philanthropists whose gifts have helped transform the University of Auckland, the largest university in New Zealand.",
  word_count: 88,
  difficulty_level: 1,
  topic: "History",
  source: "IELTS Reading Practice",
  created_by: "fba20bde-fa37-49f8-9e1b-d28ccee282e6",
  created_at: "2026-01-03T09:27:36.017669Z",
  updated_at: "2026-01-03T09:27:36.017845Z",
  is_active: true,
  question_groups: [
    {
      id: "3fca807b-c985-4e3b-b192-b0253f925d0f",
      group_instructions: "Questions 1-8: Do the following statements agree with the information given in Reading Passage 1? In boxes 1-8 on your answer sheet, write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
      question_type: "TRUE_FALSE_NOTGIVEN",
      start_question_number: 1,
      end_question_number: 8,
      order_in_passage: 1
    },
    {
      id: "98586007-76a8-4539-87cb-28c74a2606ec",
      group_instructions: "Questions 9-13: Complete the notes below. Choose ONE WORD ONLY from the passage for each answer. Write your answer in boxes 9-13 on your answer sheet.",
      question_type: "NOTE_COMPLETION",
      start_question_number: 9,
      end_question_number: 13,
      order_in_passage: 2
    }
  ],
  questions: [
    {
      id: "a8cbae4d-50a2-4b40-be40-6af05e243923",
      question_number: 1,
      question_type: "TRUE_FALSE_NOTGIVEN",
      question_text: "Harvard and Yale were the first universities to benefit from philanthropy.",
      options: [
        { label: "TRUE", text: "The statement agrees with the information" },
        { label: "FALSE", text: "The statement contradicts the information" },
        { label: "NOT GIVEN", text: "There is no information on this" }
      ],
      correct_answer: { value: "FALSE" },
      explanation: null,
      instructions: "Write TRUE, FALSE, or NOT GIVEN",
      points: 1,
      order_in_passage: 1,
      question_group_id: "3fca807b-c985-4e3b-b192-b0253f925d0f"
    },
    {
      id: "a3fccbeb-82ec-48cb-8de0-218d83cb4c56",
      question_number: 2,
      question_type: "TRUE_FALSE_NOTGIVEN",
      question_text: "Merchants liked to donate to the same universities they attended themselves.",
      options: [
        { label: "TRUE", text: "The statement agrees with the information" },
        { label: "FALSE", text: "The statement contradicts the information" },
        { label: "NOT GIVEN", text: "There is no information on this" }
      ],
      correct_answer: { value: "NOT GIVEN" },
      explanation: null,
      instructions: "Write TRUE, FALSE, or NOT GIVEN",
      points: 1,
      order_in_passage: 2,
      question_group_id: "3fca807b-c985-4e3b-b192-b0253f925d0f"
    },
    {
      id: "593e7b3d-90ae-4969-bd70-9ba05c3f61a7",
      question_number: 3,
      question_type: "TRUE_FALSE_NOTGIVEN",
      question_text: "The first gift to the University of Auckland came in 1884.",
      options: [
        { label: "TRUE", text: "The statement agrees with the information" },
        { label: "FALSE", text: "The statement contradicts the information" },
        { label: "NOT GIVEN", text: "There is no information on this" }
      ],
      correct_answer: { value: "TRUE" },
      explanation: null,
      instructions: "Write TRUE, FALSE, or NOT GIVEN",
      points: 1,
      order_in_passage: 3,
      question_group_id: "3fca807b-c985-4e3b-b192-b0253f925d0f"
    },
    {
      id: "ec6d2f6d-2f4b-4de3-ab1c-331d3507a20d",
      question_number: 4,
      question_type: "TRUE_FALSE_NOTGIVEN",
      question_text: "Otago University often received larger gifts than Gillies' gift to Auckland.",
      options: [
        { label: "TRUE", text: "The statement agrees with the information" },
        { label: "FALSE", text: "The statement contradicts the information" },
        { label: "NOT GIVEN", text: "There is no information on this" }
      ],
      correct_answer: { value: "FALSE" },
      explanation: null,
      instructions: "Write TRUE, FALSE, or NOT GIVEN",
      points: 1,
      order_in_passage: 4,
      question_group_id: "3fca807b-c985-4e3b-b192-b0253f925d0f"
    },
    {
      id: "24980ec4-eba8-49cb-a334-8fcb9308f1f4",
      question_number: 5,
      question_type: "TRUE_FALSE_NOTGIVEN",
      question_text: "In the 1930s the government wanted to close Auckland's engineering school.",
      options: [
        { label: "TRUE", text: "The statement agrees with the information" },
        { label: "FALSE", text: "The statement contradicts the information" },
        { label: "NOT GIVEN", text: "There is no information on this" }
      ],
      correct_answer: { value: "TRUE" },
      explanation: null,
      instructions: "Write TRUE, FALSE, or NOT GIVEN",
      points: 1,
      order_in_passage: 5,
      question_group_id: "3fca807b-c985-4e3b-b192-b0253f925d0f"
    },
    {
      id: "44309059-87a6-4b8b-8501-eccf75626cf7",
      question_number: 6,
      question_type: "TRUE_FALSE_NOTGIVEN",
      question_text: "After raising $6,500, Crookes returned to academic life.",
      options: [
        { label: "TRUE", text: "The statement agrees with the information" },
        { label: "FALSE", text: "The statement contradicts the information" },
        { label: "NOT GIVEN", text: "There is no information on this" }
      ],
      correct_answer: { value: "NOT GIVEN" },
      explanation: null,
      instructions: "Write TRUE, FALSE, or NOT GIVEN",
      points: 1,
      order_in_passage: 6,
      question_group_id: "3fca807b-c985-4e3b-b192-b0253f925d0f"
    },
    {
      id: "dcd43fc7-7539-4277-abb4-1f42301235ef",
      question_number: 7,
      question_type: "TRUE_FALSE_NOTGIVEN",
      question_text: "In the 1950s the best lecturers chose to work in Britain or Australia rather than Auckland.",
      options: [
        { label: "TRUE", text: "The statement agrees with the information" },
        { label: "FALSE", text: "The statement contradicts the information" },
        { label: "NOT GIVEN", text: "There is no information on this" }
      ],
      correct_answer: { value: "TRUE" },
      explanation: null,
      instructions: "Write TRUE, FALSE, or NOT GIVEN",
      points: 1,
      order_in_passage: 7,
      question_group_id: "3fca807b-c985-4e3b-b192-b0253f925d0f"
    },
    {
      id: "503e95e0-036a-46e9-9ea7-145fe2cb0a8e",
      question_number: 8,
      question_type: "TRUE_FALSE_NOTGIVEN",
      question_text: "A single philanthropist was responsible for the new Medical School.",
      options: [
        { label: "TRUE", text: "The statement agrees with the information" },
        { label: "FALSE", text: "The statement contradicts the information" },
        { label: "NOT GIVEN", text: "There is no information on this" }
      ],
      correct_answer: { value: "FALSE" },
      explanation: null,
      instructions: "Write TRUE, FALSE, or NOT GIVEN",
      points: 1,
      order_in_passage: 8,
      question_group_id: "3fca807b-c985-4e3b-b192-b0253f925d0f"
    },
    {
      id: "a9769c36-c706-41e8-aefa-2845b48ec46c",
      question_number: 9,
      question_type: "NOTE_COMPLETION",
      question_text: "Henry Cooper's campaign marked the 9............ of the University",
      options: null,
      correct_answer: { value: "centenary" },
      explanation: null,
      instructions: "Choose ONE WORD ONLY from the passage",
      points: 1,
      order_in_passage: 9,
      question_group_id: "98586007-76a8-4539-87cb-28c74a2606ec"
    },
    {
      id: "4f312053-e818-4f7f-b919-2a02309a3a8a",
      question_number: 10,
      question_type: "NOTE_COMPLETION",
      question_text: "this appeal is raising money to invest in the University's 10................",
      options: null,
      correct_answer: { value: "staff" },
      explanation: null,
      instructions: "Choose ONE WORD ONLY from the passage",
      points: 1,
      order_in_passage: 10,
      question_group_id: "98586007-76a8-4539-87cb-28c74a2606ec"
    },
    {
      id: "f75aa291-3829-40b9-b441-3da026b1ebee",
      question_number: 11,
      question_type: "NOTE_COMPLETION",
      question_text: "gifts are being sought from graduates who are located 11..................",
      options: null,
      correct_answer: { value: "overseas" },
      explanation: null,
      instructions: "Choose ONE WORD ONLY from the passage",
      points: 1,
      order_in_passage: 11,
      question_group_id: "98586007-76a8-4539-87cb-28c74a2606ec"
    },
    {
      id: "80fbd050-f326-43c9-b2a7-4411fa7642ee",
      question_number: 12,
      question_type: "NOTE_COMPLETION",
      question_text: "some donations had not been 12................. by the University",
      options: null,
      correct_answer: { value: "recorded" },
      explanation: null,
      instructions: "Choose ONE WORD ONLY from the passage",
      points: 1,
      order_in_passage: 12,
      question_group_id: "98586007-76a8-4539-87cb-28c74a2606ec"
    },
    {
      id: "0b575d37-aaf2-46a6-80dd-88d32ece5389",
      question_number: 13,
      question_type: "NOTE_COMPLETION",
      question_text: "there is a new financial 13................ for the campaign",
      options: null,
      correct_answer: { value: "target" },
      explanation: null,
      instructions: "Choose ONE WORD ONLY from the passage",
      points: 1,
      order_in_passage: 13,
      question_group_id: "98586007-76a8-4539-87cb-28c74a2606ec"
    }
  ]
};

export const PassagePreviewDemo: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (data: EditablePassageData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    console.log('Submitting passage data:', data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Passage Added Successfully!</h2>
            <p className="text-muted-foreground">
              The passage has been added to your test.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => setIsSubmitted(false)}>
              Add Another Passage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-border" />
            <span className="text-sm text-muted-foreground">
              Preview Passage
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <PassagePreviewEditor
          passage={samplePassageData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  );
};

export default PassagePreviewDemo;

