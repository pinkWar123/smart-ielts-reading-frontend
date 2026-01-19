import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, UserPlus, UserMinus, Users } from 'lucide-react';
import type { User } from '@/lib/api/sessions';

interface StudentListProps {
  enrolledStudentIds: string[];
  availableStudents: User[];
  onEnroll: (studentId: string) => void;
  onRemove: (studentId: string) => void;
  loading?: boolean;
  showAddSection?: boolean;
}

export const StudentList: React.FC<StudentListProps> = ({
  enrolledStudentIds,
  availableStudents,
  onEnroll,
  onRemove,
  loading = false,
  showAddSection = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const enrolledStudents = availableStudents.filter((s) =>
    enrolledStudentIds.includes(s.id)
  );

  const unenrolledStudents = availableStudents.filter(
    (s) => !enrolledStudentIds.includes(s.id)
  );

  const filteredEnrolled = enrolledStudents.filter((s) =>
    `${s.full_name} ${s.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUnenrolled = unenrolledStudents.filter((s) =>
    `${s.full_name} ${s.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Enrolled Students */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">
            Enrolled Students ({enrolledStudents.length})
          </h3>
        </div>

        {enrolledStudents.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-8">
              <p className="text-center text-slate-500">No students enrolled yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredEnrolled.map((student) => (
              <Card
                key={student.id}
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{student.full_name}</p>
                      <p className="text-sm text-slate-400">{student.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(student.id)}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Student Section */}
      {showAddSection && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Add Student</h3>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {unenrolledStudents.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-8">
                <p className="text-center text-slate-500">No available students</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredUnenrolled.map((student) => (
                <Card
                  key={student.id}
                  className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium">{student.full_name}</p>
                        <p className="text-sm text-slate-400">{student.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEnroll(student.id)}
                        disabled={loading}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

