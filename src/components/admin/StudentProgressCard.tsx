import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  Highlighter,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

interface StudentProgress {
  passageIndex: number;
  questionIndex: number;
  questionNumber?: number;
}

interface StudentProgressCardProps {
  studentId: string;
  studentName: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED';
  progress: StudentProgress | null;
  answersSubmitted: number;
  totalQuestions: number;
  tabViolations: number;
  highlightCount?: number;
  lastActivity: string | null;
  score?: number | null;
  isSubmitted?: boolean;
  className?: string;
}

export const StudentProgressCard: React.FC<StudentProgressCardProps> = ({
  studentId,
  studentName,
  connectionStatus,
  progress,
  answersSubmitted,
  totalQuestions,
  tabViolations,
  highlightCount = 0,
  lastActivity,
  score,
  isSubmitted = false,
  className = '',
}) => {
  // Calculate completion percentage
  const completionPercentage = totalQuestions > 0 
    ? Math.round((answersSubmitted / totalQuestions) * 100) 
    : 0;

  // Get violation severity
  const getViolationSeverity = () => {
    if (tabViolations === 0) return 'none';
    if (tabViolations <= 2) return 'low';
    if (tabViolations <= 5) return 'medium';
    return 'high';
  };

  const violationSeverity = getViolationSeverity();

  // Format last activity time
  const formatLastActivity = (timestamp: string | null): string => {
    if (!timestamp) return 'No activity yet';
    
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

  return (
    <Card className={`bg-slate-900/50 border-slate-800 ${className}`}>
      <CardHeader className="pb-3">
        {/* Student Name and Connection Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{studentName}</h3>
              <p className="text-xs text-slate-500 truncate">{studentId}</p>
            </div>
          </div>

          {/* Connection Badge */}
          <Badge
            className={
              connectionStatus === 'CONNECTED'
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }
          >
            {connectionStatus === 'CONNECTED' ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>

        {/* Submission Status */}
        {isSubmitted && (
          <Badge className="mt-2 w-fit bg-purple-500/20 text-purple-400 border-purple-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted {score !== null && score !== undefined && `• Score: ${score}`}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Progress */}
        {progress && !isSubmitted && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Current Position</span>
            </div>
            <p className="text-white text-sm">
              Passage {progress.passageIndex + 1}, Question{' '}
              {progress.questionNumber || progress.questionIndex + 1}
            </p>
          </div>
        )}

        {/* Answer Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-slate-400">Answers</span>
            </div>
            <span className="text-white font-medium">
              {answersSubmitted} / {totalQuestions}
            </span>
          </div>
          <Progress 
            value={completionPercentage} 
            className="h-2 bg-slate-800"
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{completionPercentage}% Complete</span>
            {!isSubmitted && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>In Progress</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Violations */}
          <div
            className={`p-3 rounded-lg border ${
              violationSeverity === 'none'
                ? 'bg-slate-800/50 border-slate-700'
                : violationSeverity === 'low'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : violationSeverity === 'medium'
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                className={`h-4 w-4 ${
                  violationSeverity === 'none'
                    ? 'text-slate-400'
                    : violationSeverity === 'low'
                    ? 'text-yellow-400'
                    : violationSeverity === 'medium'
                    ? 'text-orange-400'
                    : 'text-red-400'
                }`}
              />
              <span className="text-xs text-slate-400">Violations</span>
            </div>
            <p
              className={`text-lg font-semibold ${
                violationSeverity === 'none'
                  ? 'text-white'
                  : violationSeverity === 'low'
                  ? 'text-yellow-400'
                  : violationSeverity === 'medium'
                  ? 'text-orange-400'
                  : 'text-red-400'
              }`}
            >
              {tabViolations}
            </p>
          </div>

          {/* Highlights */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Highlighter className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-slate-400">Highlights</span>
            </div>
            <p className="text-lg font-semibold text-white">{highlightCount}</p>
          </div>
        </div>

        {/* Last Activity */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="h-3 w-3" />
              <span>Last Activity</span>
            </div>
            <span className="text-slate-400">{formatLastActivity(lastActivity)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact version for lists
export const StudentProgressCardCompact: React.FC<
  Pick<
    StudentProgressCardProps,
    | 'studentId'
    | 'studentName'
    | 'connectionStatus'
    | 'answersSubmitted'
    | 'totalQuestions'
    | 'tabViolations'
  >
> = ({
  studentId,
  studentName,
  connectionStatus,
  answersSubmitted,
  totalQuestions,
  tabViolations,
}) => {
  const completionPercentage = totalQuestions > 0 
    ? Math.round((answersSubmitted / totalQuestions) * 100) 
    : 0;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
      {/* Connection Indicator */}
      <div
        className={`w-2 h-2 rounded-full ${
          connectionStatus === 'CONNECTED' ? 'bg-green-400' : 'bg-red-400'
        } animate-pulse`}
      />

      {/* Student Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{studentName}</p>
        <p className="text-xs text-slate-500 truncate">{studentId}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">
            {answersSubmitted}/{totalQuestions}
          </p>
          <p className="text-xs text-slate-500">{completionPercentage}%</p>
        </div>

        {/* Violations Badge */}
        {tabViolations > 0 && (
          <Badge
            variant="destructive"
            className="bg-red-500/20 text-red-400 border-red-500/30"
          >
            {tabViolations}
          </Badge>
        )}
      </div>
    </div>
  );
};
