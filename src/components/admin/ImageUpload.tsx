import React, { useState } from 'react';
import { Upload, Loader2, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { convertImagesToText } from '@/lib/api/claude';

interface ImageUploadProps {
  onTextExtracted: (text: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onTextExtracted }) => {
  const [images, setImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await convertImagesToText({ images });

      if (result.success && result.text) {
        onTextExtracted(result.text);
      } else {
        setError(result.error || 'Failed to extract text from images');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Passage Images</CardTitle>
        <CardDescription>
          Upload images of IELTS reading passages. The AI will extract the text automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          <Button onClick={handleConvert} disabled={isProcessing || images.length === 0}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Convert
              </>
            )}
          </Button>
        </div>

        {images.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected images:</p>
            <div className="flex flex-wrap gap-2">
              {images.map((file, index) => (
                <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                  <FileImage className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

