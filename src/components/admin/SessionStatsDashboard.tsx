import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Highlighter,
  TrendingUp,
  TrendingDown,
  Minus,
  UserCheck,
  UserX,
} from 'lucide-react';

interface SessionStatistics {
  totalStudents: number;
  connectedStudents: number;
  disconnectedStudents: number;
  submittedStudents: number;
  averageProgress: number; // percentage
  totalAnswersSubmitted: number;
  totalQuestionsAvailable: number;
  totalViolations: number;
  totalHighlights?: number;
  averageViolationsPerStudent?: number;
  timeRemaining?: number | null; // seconds
  sessionDuration?: number; // seconds
}

interface SessionStatsDashboardProps {
  stats: SessionStatistics;
  className?: string;
}

export const SessionStatsDashboard: React.FC<SessionStatsDashboardProps> = ({
  stats,
  className = '',
}) => {
  // Calculate derived metrics
  const connectionRate = stats.totalStudents > 0
    ? Math.round((stats.connectedStudents / stats.totalStudents) * 100)
    : 0;

  const submissionRate = stats.totalStudents > 0
    ? Math.round((stats.submittedStudents / stats.totalStudents) * 100)
    : 0;

  const averageAnswerRate = stats.totalQuestionsAvailable > 0
    ? Math.round((stats.totalAnswersSubmitted / (stats.totalStudents * stats.totalQuestionsAvailable)) * 100)
    : 0;

  // Format time remaining
  const formatTime = (seconds: number | null): string => {
    if (seconds === null || seconds < 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get trend indicator
  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold) return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (value < threshold) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-yellow-400" />;
  };

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {/* Total Students */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-xs">
                  Enrolled
                </Badge>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Students */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Connected</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-400">{stats.connectedStudents}</p>
                <p className="text-sm text-slate-500">/ {stats.totalStudents}</p>
              </div>
              <div className="mt-2">
                <Progress 
                  value={connectionRate} 
                  className="h-1.5 bg-slate-800"
                />
                <p className="text-xs text-slate-500 mt-1">{connectionRate}% online</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Activity className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submitted Students */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Submitted</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-purple-400">{stats.submittedStudents}</p>
                <p className="text-sm text-slate-500">/ {stats.totalStudents}</p>
              </div>
              <div className="mt-2">
                <Progress 
                  value={submissionRate} 
                  className="h-1.5 bg-slate-800"
                />
                <p className="text-xs text-slate-500 mt-1">{submissionRate}% complete</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Remaining */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Time Remaining</p>
              <p className="text-3xl font-bold text-yellow-400">
                {formatTime(stats.timeRemaining || 0)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                  {stats.timeRemaining && stats.timeRemaining > 0 ? 'In Progress' : 'Ended'}
                </Badge>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Progress */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Average Progress</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-blue-400">{Math.round(stats.averageProgress)}%</p>
              </div>
              <div className="mt-2">
                <Progress 
                  value={stats.averageProgress} 
                  className="h-1.5 bg-slate-800"
                />
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(stats.averageProgress, 50)}
                  <p className="text-xs text-slate-500">
                    {stats.averageProgress > 50 ? 'Above average' : stats.averageProgress < 50 ? 'Below average' : 'On track'}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Answers */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Answers Submitted</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-400">{stats.totalAnswersSubmitted}</p>
                <p className="text-sm text-slate-500">
                  / {stats.totalStudents * stats.totalQuestionsAvailable}
                </p>
              </div>
              <div className="mt-2">
                <Progress 
                  value={averageAnswerRate} 
                  className="h-1.5 bg-slate-800"
                />
                <p className="text-xs text-slate-500 mt-1">{averageAnswerRate}% answered</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Violations */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Violations</p>
              <p className={`text-3xl font-bold ${stats.totalViolations > 10 ? 'text-red-400' : stats.totalViolations > 5 ? 'text-orange-400' : 'text-yellow-400'}`}>
                {stats.totalViolations}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={
                    stats.totalViolations > 10
                      ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs'
                      : stats.totalViolations > 5
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs'
                  }
                >
                  {stats.averageViolationsPerStudent !== undefined
                    ? `${stats.averageViolationsPerStudent.toFixed(1)} avg/student`
                    : 'Monitoring'}
                </Badge>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              stats.totalViolations > 10 
                ? 'bg-red-500/20' 
                : stats.totalViolations > 5 
                ? 'bg-orange-500/20' 
                : 'bg-yellow-500/20'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                stats.totalViolations > 10 
                  ? 'text-red-400' 
                  : stats.totalViolations > 5 
                  ? 'text-orange-400' 
                  : 'text-yellow-400'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Highlights (optional) */}
      {stats.totalHighlights !== undefined && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Highlights</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.totalHighlights}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                    Engagement
                  </Badge>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Highlighter className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Compact version
export const SessionStatsCompact: React.FC<{ stats: SessionStatistics }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
        <UserCheck className="h-5 w-5 text-green-400" />
        <div>
          <p className="text-xs text-slate-400">Connected</p>
          <p className="text-lg font-bold text-white">{stats.connectedStudents}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
        <CheckCircle className="h-5 w-5 text-purple-400" />
        <div>
          <p className="text-xs text-slate-400">Submitted</p>
          <p className="text-lg font-bold text-white">{stats.submittedStudents}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
        <TrendingUp className="h-5 w-5 text-blue-400" />
        <div>
          <p className="text-xs text-slate-400">Progress</p>
          <p className="text-lg font-bold text-white">{Math.round(stats.averageProgress)}%</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <div>
          <p className="text-xs text-slate-400">Violations</p>
          <p className="text-lg font-bold text-white">{stats.totalViolations}</p>
        </div>
      </div>
    </div>
  );
};
