import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUpload } from './ImageUpload';
import useAdminStore from '@/lib/stores/adminStore';
import type { Passage } from '@/lib/types/passage';
import { Save } from 'lucide-react';

export const PassageCreator: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { createPassage } = useAdminStore();

  const handleTextExtracted = (text: string) => {
    setContent(text);
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert('Please provide both title and content');
      return;
    }

    const newPassage: Omit<Passage, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      content,
      questionGroups: [], // Questions will be added later
      totalQuestions: 0,
    };

    createPassage(newPassage);

    // Reset form
    setTitle('');
    setContent('');

    alert('Passage saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Passage</h2>
        <p className="text-muted-foreground">
          Upload images or manually enter passage text
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <ImageUpload onTextExtracted={handleTextExtracted} />
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enter Passage Manually</CardTitle>
              <CardDescription>
                Type or paste the passage text directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You can copy text from websites or other sources and paste it here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Common form fields */}
      <Card>
        <CardHeader>
          <CardTitle>Passage Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Enter passage title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder="Passage content will appear here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!title || !content}>
              <Save className="mr-2 h-4 w-4" />
              Save Passage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

