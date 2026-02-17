
import React from 'react';
import WorkflowGuide from './WorkflowGuide';
import PromptTemplates from './PromptTemplates';
import LineSpecCard from './LineSpecCard';

const HowToMakeTab: React.FC = () => {
  return (
    <div className="max-w-[900px] mx-auto space-y-8">
      <WorkflowGuide />
      <PromptTemplates />
      <LineSpecCard />
    </div>
  );
};

export default HowToMakeTab;
