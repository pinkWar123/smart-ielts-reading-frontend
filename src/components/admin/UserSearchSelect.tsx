import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, User, X } from 'lucide-react';
import { sessionsApi, type UserInfo } from '@/lib/api/sessions';

interface UserSearchSelectProps {
  role: 'TEACHER' | 'STUDENT';
  onSelect: (user: UserInfo) => void;
  onCancel: () => void;
  excludeIds?: string[];
  placeholder?: string;
}

export const UserSearchSelect: React.FC<UserSearchSelectProps> = ({
  role,
  onSelect,
  onCancel,
  excludeIds = [],
  placeholder = 'Search by name or email...',
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const searchUsers = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sessionsApi.queryUsers(role, searchQuery, 20);
      // Filter out already assigned users
      const filteredUsers = response.users.filter(
        (user) => !excludeIds.includes(user.id)
      );
      setUsers(filteredUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [role, excludeIds]);

  // Handle query change with debounce
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // If query is empty, clear results
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      searchUsers(query);
    }, 300); // 300ms debounce

    // Cleanup
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, searchUsers]);

  const handleSelect = (user: UserInfo) => {
    onSelect(user);
    setQuery('');
    setUsers([]);
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 bg-slate-800 border-slate-700 text-white"
          autoFocus
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setUsers([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          <span className="ml-2 text-sm text-slate-400">Searching...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && users.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-2">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user.full_name}</p>
                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!loading && !error && query.trim() && users.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">
            No {role.toLowerCase()}s found matching "{query}"
          </p>
        </div>
      )}

      {/* Cancel Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel} className="border-slate-700">
          Cancel
        </Button>
      </div>
    </div>
  );
};
