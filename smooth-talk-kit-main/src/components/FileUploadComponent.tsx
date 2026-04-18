import * as React from 'react';
import { Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/config';
const FileUploadComponent: React.FC = () => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUploadButtonClick = () => {
    const el = document.createElement('input');
    el.setAttribute('type', 'file');
    el.setAttribute('accept', 'application/pdf');
    el.addEventListener('change', async (ev) => {
      if (el.files && el.files.length > 0) {
        const file = el.files.item(0);
        if (file) {
          setIsUploading(true);
          setUploadedFile(null);
          try {
            const formData = new FormData();
            formData.append('pdf', file);

            const API = import.meta.env.API_BASE_URL;
            const response = await fetch(`${API}/upload/pdf`, {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              setUploadedFile(file.name);
              toast({
                title: 'Upload successful',
                description: `${file.name} has been uploaded successfully.`,
              });
            } else {
              throw new Error('Upload failed');
            }
          } catch (error) {
            console.error('Upload error:', error);
            toast({
              title: 'Upload failed',
              description: 'There was an error uploading your file. Please try again.',
              variant: 'destructive',
            });
          } finally {
            setIsUploading(false);
          }
        }
      }
    });
    el.click();
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-primary" />
          Document Upload
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload a PDF to start chatting
        </p>
      </div>

      <Card
        onClick={!isUploading ? handleFileUploadButtonClick : undefined}
        className={`flex-1 flex flex-col justify-center items-center p-8 border-2 border-dashed transition-all ${
          isUploading
            ? 'border-muted-foreground/30 bg-muted/20 cursor-not-allowed'
            : 'border-upload-border bg-upload-bg hover:bg-upload-hover hover:border-primary-light cursor-pointer'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Uploading...</p>
            <p className="text-xs text-muted-foreground">Please wait while we process your file</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-background">
                <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-1">{uploadedFile}</p>
              <p className="text-xs text-muted-foreground">File uploaded successfully</p>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleFileUploadButtonClick();
              }}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Upload Another File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Upload PDF File</p>
              <p className="text-xs text-muted-foreground">
                Click to browse or drag and drop your PDF here
              </p>
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Supported format: PDF</p>
            </div>
          </div>
        )}
      </Card>

      {uploadedFile && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tip:</span> You can now start asking questions about your document in the chat.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;