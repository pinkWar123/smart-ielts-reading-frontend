import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Highlighter,
  UserCheck,
  UserX,
  Filter,
  Clock,
} from 'lucide-react';
import type {
  StudentProgressMessage,
  StudentAnswerMessage,
  StudentHighlightMessage,
  ViolationMessage,
  StudentSubmittedMessage,
  ParticipantJoinedMessage,
  ParticipantDisconnectedMessage,
} from '@/lib/types/websocket';

export type ActivityType = 
  | 'progress' 
  | 'answer' 
  | 'highlight' 
  | 'violation' 
  | 'submission'
  | 'joined'
  | 'disconnected';

export interface Activity {
  id: string;
  type: ActivityType;
  studentId: string;
  studentName: string;
  timestamp: string;
  data: any;
}

interface StudentActivityFeedProps {
  activities: Activity[];
  maxActivities?: number;
  showFilters?: boolean;
  className?: string;
}

export const StudentActivityFeed: React.FC<StudentActivityFeedProps> = ({
  activities,
  maxActivities = 50,
  showFilters = true,
  className = '',
}) => {
  const [selectedFilters, setSelectedFilters] = useState<Set<ActivityType>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply type filters
    if (selectedFilters.size > 0) {
      filtered = filtered.filter(activity => selectedFilters.has(activity.type));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.studentName.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    filtered = [...filtered].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit number of activities
    return filtered.slice(0, maxActivities);
  }, [activities, selectedFilters, searchQuery, maxActivities]);

  // Toggle filter
  const toggleFilter = (type: ActivityType) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setSelectedFilters(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters(new Set());
    setSearchQuery('');
  };

  // Get activity icon and color
  const getActivityStyle = (type: ActivityType) => {
    switch (type) {
      case 'progress':
        return {
          icon: <BookOpen className="h-4 w-4" />,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
        };
      case 'answer':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
        };
      case 'highlight':
        return {
          icon: <Highlighter className="h-4 w-4" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
        };
      case 'violation':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
        };
      case 'submission':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30',
        };
      case 'joined':
        return {
          icon: <UserCheck className="h-4 w-4" />,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
        };
      case 'disconnected':
        return {
          icon: <UserX className="h-4 w-4" />,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/30',
        };
    }
  };

  // Format activity message
  const formatActivityMessage = (activity: Activity): string => {
    switch (activity.type) {
      case 'progress':
        return `Viewing Question ${activity.data.questionNumber || activity.data.question_number}`;
      case 'answer':
        return `Answered Question ${activity.data.questionNumber || activity.data.question_number}${activity.data.is_update ? ' (updated)' : ''}`;
      case 'highlight':
        const text = activity.data.text || '';
        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
        return `Highlighted: "${preview}"`;
      case 'violation':
        return `Violation: ${activity.data.violationType || activity.data.violation_type}`;
      case 'submission':
        const score = activity.data.score !== null && activity.data.score !== undefined 
          ? ` (Score: ${activity.data.score})` 
          : '';
        const answered = activity.data.answeredQuestions !== undefined && activity.data.totalQuestions !== undefined
          ? ` - ${activity.data.answeredQuestions}/${activity.data.totalQuestions} answered`
          : '';
        return `Submitted test${score}${answered}`;
      case 'joined':
        return 'Joined the session';
      case 'disconnected':
        return 'Disconnected from session';
      default:
        return 'Unknown activity';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  // Activity count by type
  const getActivityCount = (type: ActivityType): number => {
    return activities.filter(a => a.type === type).length;
  };

  return (
    <Card className={`bg-slate-900/50 border-slate-800 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Activity Feed</CardTitle>
            <CardDescription className="text-slate-400">
              Real-time student activities ({filteredActivities.length} of {activities.length})
            </CardDescription>
          </div>
          {(selectedFilters.size > 0 || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-400 hover:text-white"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {['progress', 'answer', 'highlight', 'violation', 'submission', 'joined', 'disconnected'].map((type) => {
              const activityType = type as ActivityType;
              const style = getActivityStyle(activityType);
              const count = getActivityCount(activityType);
              const isSelected = selectedFilters.has(activityType);

              return (
                <Badge
                  key={type}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? `${style.bgColor} ${style.color} border-2 ${style.borderColor}`
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                  onClick={() => toggleFilter(activityType)}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {type} ({count})
                </Badge>
              );
            })}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search by student name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mt-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-400">No activities to display</p>
              <p className="text-sm text-slate-500 mt-1">
                {selectedFilters.size > 0 || searchQuery
                  ? 'Try adjusting your filters'
                  : 'Activities will appear here as students take the test'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((activity) => {
                const style = getActivityStyle(activity.type);
                return (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 p-3 rounded-lg ${style.bgColor} border ${style.borderColor} transition-all hover:border-opacity-60`}
                  >
                    <div className={`${style.color} mt-1`}>{style.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white truncate">
                          {activity.studentName}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {formatActivityMessage(activity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Helper function to convert WebSocket messages to activities
// studentNameLookup is an optional map to resolve student_id to student_name
// for messages that don't include student_name (like violation, participant_joined, participant_disconnected)
export function createActivityFromMessage(
  message: 
    | StudentProgressMessage 
    | StudentAnswerMessage 
    | StudentHighlightMessage 
    | ViolationMessage 
    | StudentSubmittedMessage
    | ParticipantJoinedMessage
    | ParticipantDisconnectedMessage,
  studentNameLookup?: Map<string, string>
): Activity {
  // Get student name - some messages have it directly, others need lookup
  const getStudentName = (): string => {
    if ('student_name' in message && message.student_name) {
      return message.student_name;
    }
    if (studentNameLookup && 'student_id' in message) {
      return studentNameLookup.get(message.student_id) || 'Unknown Student';
    }
    return 'Unknown Student';
  };

  const baseActivity = {
    id: `${message.timestamp}-${Math.random()}`,
    studentId: 'student_id' in message ? message.student_id : '',
    studentName: getStudentName(),
    timestamp: message.timestamp,
  };

  switch (message.type) {
    case 'student_progress':
      return {
        ...baseActivity,
        type: 'progress',
        data: {
          passageIndex: message.passage_index,
          questionIndex: message.question_index,
          questionNumber: message.question_number,
        },
      };
    case 'student_answer':
      return {
        ...baseActivity,
        type: 'answer',
        data: {
          questionId: message.question_id,
          questionNumber: message.question_number,
          is_update: message.is_update,
        },
      };
    case 'student_highlight':
      return {
        ...baseActivity,
        type: 'highlight',
        data: {
          text: message.text,  // Updated from highlighted_text
          passageId: message.passage_id,  // Updated from passage_index
        },
      };
    case 'violation':
      return {
        ...baseActivity,
        type: 'violation',
        data: {
          violationType: message.violation_type,
          totalCount: message.total_count,
        },
      };
    case 'student_submitted':
      return {
        ...baseActivity,
        type: 'submission',
        data: {
          score: message.score,
          timeTakenSeconds: message.time_taken_seconds,
          answeredQuestions: message.answered_questions,
          totalQuestions: message.total_questions,
        },
      };
    case 'participant_joined':
      return {
        ...baseActivity,
        type: 'joined',
        data: {},
      };
    case 'participant_disconnected':
      return {
        ...baseActivity,
        type: 'disconnected',
        data: {},
      };
    default:
      return {
        ...baseActivity,
        type: 'progress',
        data: {},
      };
  }
}
