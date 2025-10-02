'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function ErrorTrigger() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error for ErrorBoundary testing');
  }

  return (
    <div className="p-4">
      <Button
        variant="destructive"
        onClick={() => setShouldError(true)}
        data-testid="error-trigger"
      >
        Trigger Error (Test ErrorBoundary)
      </Button>
    </div>
  );
}
