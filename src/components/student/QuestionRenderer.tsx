import React from 'react';
import type {
  Question,
  MultipleChoiceQuestion,
  MatchingHeadingsQuestion,
  MatchingInformationQuestion,
  MatchingFeaturesQuestion,
  SentenceCompletionQuestion,
  ShortAnswerQuestion,
} from '@/lib/types/question';
import { QuestionType } from '@/lib/types/question';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface QuestionRendererProps {
  question: Question;
  answer: string | string[] | undefined;
  onAnswerChange: (answer: string | string[]) => void;
  showResults?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  onAnswerChange,
  showResults = false,
}) => {
  const renderQuestionContent = () => {
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE: {
        const mcQuestion = question as MultipleChoiceQuestion;
        return (
          <RadioGroup
            value={answer as string}
            onValueChange={onAnswerChange}
            disabled={showResults}
          >
            {mcQuestion.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <label
                  htmlFor={`${question.id}-${index}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </RadioGroup>
        );
      }

      case QuestionType.TRUE_FALSE_NOT_GIVEN:
        return (
          <RadioGroup
            value={answer as string}
            onValueChange={onAnswerChange}
            disabled={showResults}
          >
            {['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <label
                  htmlFor={`${question.id}-${option}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </RadioGroup>
        );

      case QuestionType.YES_NO_NOT_GIVEN:
        return (
          <RadioGroup
            value={answer as string}
            onValueChange={onAnswerChange}
            disabled={showResults}
          >
            {['YES', 'NO', 'NOT GIVEN'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <label
                  htmlFor={`${question.id}-${option}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </RadioGroup>
        );

      case QuestionType.SENTENCE_COMPLETION:
      case QuestionType.SHORT_ANSWER:
      case QuestionType.SUMMARY_COMPLETION:
      case QuestionType.TABLE_COMPLETION:
      case QuestionType.NOTE_COMPLETION:
      case QuestionType.FLOW_CHART:
      case QuestionType.DIAGRAM_LABELING: {
        const wordLimit = (question as SentenceCompletionQuestion | ShortAnswerQuestion).wordLimit;
        return (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your answer..."
              value={answer as string || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={showResults}
              className="max-w-md"
            />
            {wordLimit && (
              <p className="text-xs text-muted-foreground">
                Maximum {wordLimit} word{wordLimit > 1 ? 's' : ''}
              </p>
            )}
          </div>
        );
      }

      case QuestionType.MATCHING_HEADINGS: {
        const mhQuestion = question as MatchingHeadingsQuestion;
        return (
          <RadioGroup
            value={answer as string}
            onValueChange={onAnswerChange}
            disabled={showResults}
          >
            {mhQuestion.headings?.map((heading) => (
              <div key={heading.id} className="flex items-center space-x-2">
                <RadioGroupItem value={heading.id} id={`${question.id}-${heading.id}`} />
                <label
                  htmlFor={`${question.id}-${heading.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {heading.text}
                </label>
              </div>
            ))}
          </RadioGroup>
        );
      }

      case QuestionType.MATCHING_INFORMATION: {
        const miQuestion = question as MatchingInformationQuestion;
        return (
          <RadioGroup
            value={answer as string}
            onValueChange={onAnswerChange}
            disabled={showResults}
          >
            {miQuestion.paragraphs?.map((para: string) => (
              <div key={para} className="flex items-center space-x-2">
                <RadioGroupItem value={para} id={`${question.id}-${para}`} />
                <label
                  htmlFor={`${question.id}-${para}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  Paragraph {para}
                </label>
              </div>
            ))}
          </RadioGroup>
        );
      }

      case QuestionType.MATCHING_FEATURES: {
        const mfQuestion = question as MatchingFeaturesQuestion;
        return (
          <RadioGroup
            value={answer as string}
            onValueChange={onAnswerChange}
            disabled={showResults}
          >
            {mfQuestion.features?.map((feature) => (
              <div key={feature.id} className="flex items-center space-x-2">
                <RadioGroupItem value={feature.id} id={`${question.id}-${feature.id}`} />
                <label
                  htmlFor={`${question.id}-${feature.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {feature.text}
                </label>
              </div>
            ))}
          </RadioGroup>
        );
      }

      default:
        return <p className="text-sm text-muted-foreground">Unsupported question type</p>;
    }
  };

  return (
    <Card className={showResults && answer ? 'border-2 border-primary' : ''}>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-2">
          <span className="font-bold text-primary">{question.questionNumber}.</span>
          <p className="text-sm flex-1">{question.text}</p>
        </div>
        {renderQuestionContent()}
      </CardContent>
    </Card>
  );
};

