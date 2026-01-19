import React, { useState, useEffect } from 'react';
import { X, Clock, BookOpen, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GetTestDetailWithViewResponse, TestDetailPassageDTO } from '@/lib/api/tests';

interface TestSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: TestStartConfig) => void;
  testData: GetTestDetailWithViewResponse | null;
  isLoading?: boolean;
}

export interface TestStartConfig {
  timeMinutes: number;
  selectedPassageIndices: number[];
  testType: 'FULL_TEST' | 'SINGLE_PASSAGE';
}

const TIME_OPTIONS = [10, 15, 20, 25, 30, 40, 50, 60];

export const TestSelectionModal: React.FC<TestSelectionModalProps> = ({
  isOpen,
  onClose,
  onStart,
  testData,
  isLoading = false,
}) => {
  const [selectedTime, setSelectedTime] = useState<number>(20);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [selectedPassages, setSelectedPassages] = useState<number[]>([]);
  const [mode, setMode] = useState<'full' | 'individual'>('full');

  const isFullTest = testData?.test_metadata.type === 'FULL_TEST';
  const passages = testData?.passages || [];
  const estimatedTime = testData?.test_metadata.estimated_time_minutes || 20;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && testData) {
      setSelectedTime(estimatedTime);
      setSelectedPassages(passages.map((_, i) => i));
      setMode('full');
    }
  }, [isOpen, testData, estimatedTime, passages.length]);

  const handlePassageToggle = (index: number) => {
    setSelectedPassages(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index].sort((a, b) => a - b);
    });
  };

  const handleModeChange = (newMode: 'full' | 'individual') => {
    setMode(newMode);
    if (newMode === 'full') {
      setSelectedPassages(passages.map((_, i) => i));
      setSelectedTime(estimatedTime);
    } else {
      setSelectedPassages([]);
      setSelectedTime(20);
    }
  };

  const handleStart = () => {
    if (selectedPassages.length === 0) {
      return;
    }
    onStart({
      timeMinutes: selectedTime,
      selectedPassageIndices: selectedPassages,
      testType: testData?.test_metadata.type || 'SINGLE_PASSAGE',
    });
  };

  const getPassageQuestionCount = (passage: TestDetailPassageDTO): number => {
    return passage.question_groups.reduce((acc, group) => {
      return acc + (group.questions?.length || 0);
    }, 0);
  };

  const getTotalSelectedQuestions = (): number => {
    return selectedPassages.reduce((acc, idx) => {
      const passage = passages[idx];
      return acc + (passage ? getPassageQuestionCount(passage) : 0);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a1f] rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden shadow-2xl border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">
            {testData?.test_metadata.title || 'Loading...'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-slate-400">Loading test details...</p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Step 1: Practice Mode */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
                Step 1: Choose practice mode
              </h3>
              
              {isFullTest ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Full Test Option */}
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      mode === 'full' 
                        ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20' 
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => handleModeChange('full')}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-white">Full Test</h4>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTimeDropdown(!showTimeDropdown);
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              mode === 'full' 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {selectedTime} min
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          
                          {showTimeDropdown && mode === 'full' && (
                            <div className="absolute top-full right-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-10 min-w-[80px]">
                              {TIME_OPTIONS.map(time => (
                                <button
                                  key={time}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTime(time);
                                    setShowTimeDropdown(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                                    selectedTime === time ? 'text-emerald-400' : 'text-slate-300'
                                  }`}
                                >
                                  {time} min
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                        Complete all passages in this test
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          mode === 'full' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                        }`}>
                          {mode === 'full' && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-500">
                          {testData?.test_metadata.total_questions} questions
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Individual Passages Option */}
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      mode === 'individual' 
                        ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20' 
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => handleModeChange('individual')}
                  >
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-white mb-3">Practice by Passage</h4>
                      <p className="text-sm text-slate-400 mb-3">
                        Choose specific passages to practice
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          mode === 'individual' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                        }`}>
                          {mode === 'individual' && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-500">
                          Select passages below
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Single Passage Time Selection */
                <Card className="bg-emerald-950/50 border-emerald-500">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white mb-1">Practice Time</h4>
                        <p className="text-sm text-slate-400">
                          Default: {estimatedTime} minutes (recommended)
                        </p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium"
                        >
                          <Clock className="w-4 h-4" />
                          {selectedTime} min
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        
                        {showTimeDropdown && (
                          <div className="absolute top-full right-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-10 min-w-[100px]">
                            {TIME_OPTIONS.map(time => (
                              <button
                                key={time}
                                onClick={() => {
                                  setSelectedTime(time);
                                  setShowTimeDropdown(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                                  selectedTime === time ? 'text-emerald-400' : 'text-slate-300'
                                }`}
                              >
                                {time} minutes
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Step 2: Passage Selection (Only for Full Test in Individual Mode) */}
            {isFullTest && mode === 'individual' && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
                  Step 2: Select passages to practice
                </h3>
                
                <div className="space-y-3">
                  {passages.map((passage, index) => {
                    const questionCount = getPassageQuestionCount(passage);
                    const isSelected = selectedPassages.includes(index);
                    
                    return (
                      <Card 
                        key={index}
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-emerald-950/30 border-emerald-500/50' 
                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                        }`}
                        onClick={() => handlePassageToggle(index)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'border-emerald-500 bg-emerald-500' 
                                  : 'border-slate-600'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div>
                                <h4 className="font-medium text-white flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-emerald-400" />
                                  Passage {index + 1}
                                </h4>
                                <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">
                                  {passage.title}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-slate-400 border-slate-700">
                              {questionCount} questions
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Time Selection for Individual Mode */}
                {selectedPassages.length > 0 && (
                  <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Time for {selectedPassages.length} passage{selectedPassages.length > 1 ? 's' : ''}:
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-medium border border-slate-700"
                        >
                          <Clock className="w-4 h-4" />
                          {selectedTime} min
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        
                        {showTimeDropdown && (
                          <div className="absolute bottom-full right-0 mb-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-10 min-w-[100px]">
                            {TIME_OPTIONS.map(time => (
                              <button
                                key={time}
                                onClick={() => {
                                  setSelectedTime(time);
                                  setShowTimeDropdown(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                                  selectedTime === time ? 'text-emerald-400' : 'text-slate-300'
                                }`}
                              >
                                {time} min
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
                Test Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {selectedPassages.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Passage{selectedPassages.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {getTotalSelectedQuestions()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {selectedTime}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Minutes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <Button
            onClick={handleStart}
            disabled={isLoading || selectedPassages.length === 0}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Practice
          </Button>
        </div>
      </div>
    </div>
  );
};


