import React, { useEffect, useState } from 'react';
import useAdminStore from '@/lib/stores/adminStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, Eye, Calendar } from 'lucide-react';

export const PassageLibrary: React.FC = () => {
  const { passages, loadPassages, deletePassage } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPassages();
  }, [loadPassages]);

  const filteredPassages = passages.filter(passage =>
    passage.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    passage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deletePassage(id);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Passage Library</h1>
        <p className="text-muted-foreground mt-2">
          Manage your reading passages
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search passages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredPassages.length} passage{filteredPassages.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Passages */}
      {filteredPassages.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No passages found matching your search.' : 'No passages yet. Create your first passage!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPassages.map((passage) => (
            <Card key={passage.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{passage.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {passage.content.substring(0, 200)}...
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(passage.id, passage.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(passage.createdAt)}</span>
                  </div>
                  <span>•</span>
                  <span>{passage.totalQuestions} questions</span>
                  <span>•</span>
                  <span>{passage.content.split(' ').length} words</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

