
import React from 'react';
import { Button } from '@/components/ui/Button';
import { useExportStory } from '@/hooks/useStoryteller';
import toast from 'react-hot-toast';
import { FileText, Code } from 'lucide-react';

interface StoryExportProps {
  campaignId: string;
}

export function StoryExport({ campaignId }: StoryExportProps) {
  const exportMutation = useExportStory();

  const handleExport = async (format: 'pdf' | 'html') => {
    try {
      await exportMutation.mutateAsync({ campaignId, format });
      toast.success(`Story exported as ${format.toUpperCase()}`);
    } catch {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        loading={exportMutation.isPending}
        icon={<FileText className="h-4 w-4" />}
      >
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('html')}
        loading={exportMutation.isPending}
        icon={<Code className="h-4 w-4" />}
      >
        HTML
      </Button>
    </div>
  );
}
