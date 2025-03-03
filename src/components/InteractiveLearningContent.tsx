
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, HelpCircle, Info, ArrowRight } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface InteractiveLearningStep {
  id: string;
  title: string;
  content: string;
  interactionType: 'clickable-element' | 'fill-in-blank' | 'drag-drop' | 'simple-next' | 'info-reveal';
  interactionData?: {
    elements?: { id: string; text: string; isCorrect?: boolean }[];
    blanks?: { id: string; correctAnswer: string }[];
    revealContent?: string;
  };
}

interface InteractiveLearningContentProps {
  steps: InteractiveLearningStep[];
  onComplete: () => void;
}

export default function InteractiveLearningContent({ steps, onComplete }: InteractiveLearningContentProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [showReveal, setShowReveal] = useState(false);
  
  const currentStep = steps[currentStepIndex];
  const progress = (completedSteps.length / steps.length) * 100;
  
  const markStepComplete = () => {
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps([...completedSteps, currentStep.id]);
    }
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setShowReveal(false);
    } else {
      onComplete();
    }
  };
  
  const handleElementClick = (elementId: string, isCorrect?: boolean) => {
    if (isCorrect) {
      markStepComplete();
    }
  };
  
  const handleInputChange = (blankId: string, value: string) => {
    setUserInputs({
      ...userInputs,
      [blankId]: value,
    });
  };
  
  const checkBlankAnswers = () => {
    const blanks = currentStep.interactionData?.blanks || [];
    const allCorrect = blanks.every(blank => 
      userInputs[blank.id]?.toLowerCase().trim() === blank.correctAnswer.toLowerCase().trim()
    );
    
    if (allCorrect) {
      markStepComplete();
    }
  };
  
  const renderInteraction = () => {
    switch (currentStep.interactionType) {
      case 'clickable-element':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {currentStep.interactionData?.elements?.map(element => (
              <Button
                key={element.id}
                variant="outline"
                className="justify-start text-left h-auto p-4"
                onClick={() => handleElementClick(element.id, element.isCorrect)}
              >
                {element.text}
              </Button>
            ))}
          </div>
        );
        
      case 'fill-in-blank':
        return (
          <div className="space-y-4 mt-4">
            {currentStep.interactionData?.blanks?.map(blank => (
              <div key={blank.id} className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={userInputs[blank.id] || ''}
                    onChange={(e) => handleInputChange(blank.id, e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Your answer here..."
                  />
                </div>
              </div>
            ))}
            <Button onClick={checkBlankAnswers} className="mt-2">
              Check Answers
            </Button>
          </div>
        );
        
      case 'info-reveal':
        return (
          <div className="mt-4">
            <Button 
              variant={showReveal ? "outline" : "default"}
              onClick={() => setShowReveal(!showReveal)}
              className="mb-4"
            >
              <Info className="mr-2 h-4 w-4" />
              {showReveal ? "Hide Details" : "Show Details"}
            </Button>
            
            {showReveal && (
              <div className="p-4 bg-muted rounded-md mt-2">
                {currentStep.interactionData?.revealContent}
              </div>
            )}
            
            <Button onClick={markStepComplete} className="mt-4">
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
        
      case 'simple-next':
      default:
        return (
          <Button onClick={markStepComplete} className="mt-4">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        );
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{currentStep.title}</h3>
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: currentStep.content }} />
          </div>
          
          {renderInteraction()}
        </div>
      </CardContent>
    </Card>
  );
}
