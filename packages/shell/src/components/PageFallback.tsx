import React from 'react';
import { Loader } from '@doevents/shared';

const PageFallback: React.FC = () => (
  <div className="flex min-h-[50vh] items-center justify-center bg-background">
    <Loader />
  </div>
);

export default PageFallback;
