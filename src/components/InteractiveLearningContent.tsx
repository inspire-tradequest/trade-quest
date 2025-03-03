
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, HelpCircle, Info, ArrowRight, Trophy, Star, Medal, SmilePlus } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import confetti from 'canvas-confetti';
import { Badge } from "@/components/ui/badge";

export interface InteractiveLearningStep {
  id: string;
  title: string;
  content: string;
  interactionType: 'clickable-element' | 'fill-in-blank' | 'drag-drop' | 'simple-next' | 'info-reveal' | 'multiple-choice' | 'flashcard';
  interactionData?: {
    elements?: { id: string; text: string; isCorrect?: boolean }[];
    blanks?: { id: string; correctAnswer: string }[];
    revealContent?: string;
    options?: { id: string; text: string; isCorrect: boolean }[];
    front?: string;
    back?: string;
    explanation?: string;
  };
  points?: number;
}

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  steps: InteractiveLearningStep[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  xpReward: number;
}

interface InteractiveLearningContentProps {
  steps: InteractiveLearningStep[];
  onComplete: () => void;
  course?: LearningCourse;
  onEarnPoints?: (points: number) => void;
  lastCompletedStepId?: string;
}

export default function InteractiveLearningContent({ 
  steps, 
  onComplete, 
  course, 
  onEarnPoints = () => {}, 
  lastCompletedStepId 
}: InteractiveLearningContentProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [showReveal, setShowReveal] = useState(false);
  const [selectedElements, setSelectedElements] = useState<Record<string, boolean>>({});
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState<Date | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const { toast } = useToast();
  
  const currentStep = steps[currentStepIndex];
  const progress = (completedSteps.length / steps.length) * 100;
  
  // Initialize from last completed step if provided
  useEffect(() => {
    if (lastCompletedStepId && steps.length > 0) {
      const lastIndex = steps.findIndex(step => step.id === lastCompletedStepId);
      if (lastIndex >= 0) {
        // Start from the step after the last completed one
        setCurrentStepIndex(Math.min(lastIndex + 1, steps.length - 1));
        
        // Mark all previous steps as completed
        const previousSteps = steps.slice(0, lastIndex + 1).map(step => step.id);
        setCompletedSteps(previousSteps);
      }
    }
  }, [lastCompletedStepId, steps]);
  
  // Space repetition logic
  useEffect(() => {
    if (lastInteractionTime) {
      const now = new Date();
      const timeDiff = now.getTime() - lastInteractionTime.getTime();
      const hoursPassed = timeDiff / (1000 * 60 * 60);
      
      // If it's been more than 1 hour since the last interaction
      // and we have completed steps, remind the user to review
      if (hoursPassed > 1 && completedSteps.length > 0 && completedSteps.length < steps.length) {
        toast({
          title: "Time for review!",
          description: "Revisit a previous concept to strengthen your learning.",
          duration: 5000,
        });
      }
    }
  }, [completedSteps, lastInteractionTime, steps.length, toast]);
  
  const calculateStepPoints = (step: InteractiveLearningStep) => {
    // Base points for the step
    const basePoints = step.points || 10;
    
    // Streak multiplier (max 3x)
    const streakMultiplier = Math.min(streakCount / 5 + 1, 3);
    
    // Difficulty multiplier
    let difficultyMultiplier = 1;
    if (course) {
      if (course.difficulty === 'intermediate') difficultyMultiplier = 1.5;
      if (course.difficulty === 'advanced') difficultyMultiplier = 2;
    }
    
    return Math.round(basePoints * streakMultiplier * difficultyMultiplier);
  };
  
  const markStepComplete = () => {
    if (!completedSteps.includes(currentStep.id)) {
      // Update streak
      setStreakCount(prev => prev + 1);
      
      // Calculate points
      const earnedPoints = calculateStepPoints(currentStep);
      setPointsEarned(prev => prev + earnedPoints);
      onEarnPoints(earnedPoints);
      
      // Show the points earned
      toast({
        title: `+${earnedPoints} XP`,
        description: streakCount >= 5 ? `${streakCount} streak bonus! 🔥` : "",
        duration: 2000,
      });
      
      // Add this step to completed steps
      setCompletedSteps([...completedSteps, currentStep.id]);
    }
    
    // Update last interaction time
    setLastInteractionTime(new Date());
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setShowReveal(false);
      setSelectedElements({});
      setShowFlashcardAnswer(false);
    } else {
      // Trigger confetti on completion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // If all steps are completed, show a bigger celebration
      if (completedSteps.length === steps.length - 1) {
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 }
          });
        }, 300);
        
        toast({
          title: "Module Completed! 🏆",
          description: course 
            ? `You've earned ${pointsEarned} XP from ${course.title}!`
            : "Great job completing this interactive learning module.",
          duration: 5000,
        });
      }
      
      onComplete();
    }
  };
  
  const handleElementClick = (elementId: string, isCorrect?: boolean) => {
    setSelectedElements({
      ...selectedElements,
      [elementId]: true
    });
    
    // Update last interaction time
    setLastInteractionTime(new Date());
    
    if (isCorrect) {
      toast({
        title: "Correct! ✓",
        description: "That's the right answer.",
      });
      
      // Small confetti burst for correct answers
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.7 }
      });
      
      setTimeout(() => {
        markStepComplete();
      }, 1000);
    } else {
      toast({
        title: "Not quite right",
        description: "Try another option.",
        variant: "destructive",
      });
      
      // Reset streak on wrong answer
      setStreakCount(0);
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
    
    // Update last interaction time
    setLastInteractionTime(new Date());
    
    if (allCorrect) {
      toast({
        title: "Perfect! ✓",
        description: "All answers are correct.",
      });
      
      // Trigger a small confetti burst for correct answers
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 }
      });
      
      setTimeout(() => {
        markStepComplete();
      }, 1000);
    } else {
      // Find which blanks are incorrect
      const incorrectBlanks = blanks.filter(blank => 
        userInputs[blank.id]?.toLowerCase().trim() !== blank.correctAnswer.toLowerCase().trim()
      );
      
      toast({
        title: "Not quite right",
        description: `${incorrectBlanks.length} answer${incorrectBlanks.length > 1 ? 's are' : ' is'} incorrect.`,
        variant: "destructive",
      });
      
      // Reset streak on wrong answer
      setStreakCount(0);
    }
  };
  
  const handleMultipleChoiceSelection = (optionId: string, isCorrect: boolean) => {
    setSelectedElements({
      ...selectedElements,
      [optionId]: true
    });
    
    // Update last interaction time
    setLastInteractionTime(new Date());
    
    if (isCorrect) {
      toast({
        title: "Correct! ✓",
        description: currentStep.interactionData?.explanation || "Great job!",
      });
      
      setTimeout(() => {
        markStepComplete();
      }, 1500);
    } else {
      toast({
        title: "Incorrect",
        description: "Try again.",
        variant: "destructive",
      });
      
      // Reset streak on wrong answer
      setStreakCount(0);
    }
  };
  
  const handleFlashcardFlip = () => {
    setShowFlashcardAnswer(!showFlashcardAnswer);
    setLastInteractionTime(new Date());
  };
  
  const renderInteraction = () => {
    switch (currentStep.interactionType) {
      case 'clickable-element':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {currentStep.interactionData?.elements?.map(element => (
              <Button
                key={element.id}
                variant={selectedElements[element.id] ? (element.isCorrect ? "default" : "destructive") : "outline"}
                className="justify-start text-left h-auto p-4 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => handleElementClick(element.id, element.isCorrect)}
                disabled={selectedElements[element.id]}
              >
                {selectedElements[element.id] && element.isCorrect && (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                )}
                {element.text}
              </Button>
            ))}
          </div>
        );
        
      case 'fill-in-blank':
        return (
          <div className="space-y-4 mt-4">
            {currentStep.interactionData?.blanks?.map((blank, index) => (
              <div key={blank.id} className="space-y-2">
                <div className="flex items-center">
                  <label className="mr-2 text-sm font-medium">{index + 1}.</label>
                  <input
                    type="text"
                    value={userInputs[blank.id] || ''}
                    onChange={(e) => handleInputChange(blank.id, e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Your answer here..."
                  />
                </div>
              </div>
            ))}
            <Button 
              onClick={checkBlankAnswers} 
              className="mt-4 transition-all duration-300 hover:scale-105"
            >
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
              className="mb-4 transition-all duration-300 hover:scale-105"
            >
              <Info className="mr-2 h-4 w-4" />
              {showReveal ? "Hide Details" : "Show Details"}
            </Button>
            
            {showReveal && (
              <div className="p-4 bg-muted rounded-md mt-2 animate-fade-in">
                {currentStep.interactionData?.revealContent}
              </div>
            )}
            
            <Button 
              onClick={markStepComplete} 
              className="mt-4 transition-all duration-300 hover:scale-105"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      
      case 'multiple-choice':
        return (
          <div className="space-y-3 mt-4">
            {currentStep.interactionData?.options?.map(option => (
              <Button
                key={option.id}
                variant={selectedElements[option.id] ? (option.isCorrect ? "default" : "destructive") : "outline"}
                className="w-full justify-start text-left p-3 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => handleMultipleChoiceSelection(option.id, option.isCorrect)}
                disabled={Object.keys(selectedElements).length > 0}
              >
                {selectedElements[option.id] && option.isCorrect && (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                )}
                {option.text}
              </Button>
            ))}
          </div>
        );
        
      case 'flashcard':
        return (
          <div className="mt-4">
            <div 
              className={`border rounded-lg p-6 min-h-[200px] flex items-center justify-center cursor-pointer transition-all duration-500 ${
                showFlashcardAnswer ? 'bg-muted' : 'bg-card hover:shadow-md'
              }`}
              onClick={handleFlashcardFlip}
            >
              <div className="text-center">
                {!showFlashcardAnswer ? (
                  <div className="animate-fade-in">
                    <p className="text-lg font-medium">{currentStep.interactionData?.front}</p>
                    <p className="text-sm text-muted-foreground mt-4">Click to flip</p>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <p className="text-lg">{currentStep.interactionData?.back}</p>
                  </div>
                )}
              </div>
            </div>
            
            {showFlashcardAnswer && (
              <div className="flex justify-center space-x-4 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowFlashcardAnswer(false);
                    setCurrentStepIndex(prev => prev > 0 ? prev - 1 : prev);
                  }}
                  disabled={currentStepIndex === 0}
                >
                  Review Again
                </Button>
                <Button onClick={markStepComplete}>
                  I Got It <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );
        
      case 'simple-next':
      default:
        return (
          <Button 
            onClick={markStepComplete} 
            className="mt-4 transition-all duration-300 hover:scale-105"
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        );
    }
  };
  
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1 flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex items-center ml-4">
            {streakCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 ml-2">
                <SmilePlus className="h-3 w-3" />
                <span>{streakCount} streak</span>
              </Badge>
            )}
            
            {pointsEarned > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 ml-2">
                <Star className="h-3 w-3" />
                <span>{pointsEarned} XP</span>
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{currentStep.title}</h3>
            {currentStep.points && (
              <Badge variant="outline" className="text-xs">
                {currentStep.points} XP
              </Badge>
            )}
          </div>
          
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: currentStep.content }} />
          </div>
          
          {renderInteraction()}
        </div>
      </CardContent>
    </Card>
  );
}
