import { Icon } from '@iconify/react';

export const PageLoader = () => {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Icon 
          icon="mdi:loading" 
          className="h-10 w-10 animate-spin text-primary" 
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

