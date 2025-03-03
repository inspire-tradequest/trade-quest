
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Award } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import confetti from 'canvas-confetti';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizProps {
  assessmentId: string;
  lessonId: string;
  questions: QuizQuestion[];
  onComplete: (score: number, totalQuestions: number) => void;
}

export default function Quiz({ assessmentId, lessonId, questions, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Function to save quiz progress to Supabase
  const saveQuizProgress = async (finalScore: number) => {
    if (!user) return;
    
    try {
      const { data: existingProgress, error: fetchError } = await supabase
        .from('learning_progress')
        .select()
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (existingProgress) {
        const { error: updateError } = await supabase
          .from('learning_progress')
          .update({
            score: finalScore,
            completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('learning_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            score: finalScore,
            completed: true
          });
          
        if (insertError) throw insertError;
      }
      
      // Record the assessment completion
      await supabase
        .from('assessment_results')
        .insert({
          user_id: user.id,
          assessment_id: assessmentId,
          score: finalScore,
          max_score: questions.length,
          answers: userAnswers
        });
        
    } catch (error: any) {
      console.error('Error saving quiz progress:', error);
      toast({
        title: "Error saving progress",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOptionSelect = (index: number) => {
    if (hasAnswered) return;
    setSelectedOption(index);
  };

  const checkAnswer = () => {
    if (selectedOption === null) return;
    
    setHasAnswered(true);
    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Store user's answer
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(newUserAnswers);
    
    toast({
      title: isCorrect ? "Correct answer!" : "Incorrect answer",
      description: isCorrect ? "Well done!" : currentQuestion.explanation,
      variant: isCorrect ? "default" : "destructive",
    });
  };

  const moveToNextQuestion = () => {
    if (isLastQuestion) {
      completeQuiz();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    }
  };

  const moveToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(userAnswers[currentQuestionIndex - 1] || null);
      setHasAnswered(true); // Already answered
    }
  };

  const completeQuiz = async () => {
    setQuizCompleted(true);
    const finalScore = (score / questions.length) * 100;
    
    // If score is higher than 80%, trigger confetti
    if (finalScore >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    await saveQuizProgress(finalScore);
    onComplete(score, questions.length);
  };

  return (
    <Card className="w-full">
      {!quizCompleted ? (
        <>
          <CardHeader>
            <CardTitle>Quiz: Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
            <CardDescription>
              Select the best answer to the question below
            </CardDescription>
            <Progress value={(currentQuestionIndex / questions.length) * 100} className="mt-2" />
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-lg font-medium mb-4">{currentQuestion.text}</div>
            
            <RadioGroup value={selectedOption?.toString()} className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`flex items-center space-x-2 p-3 rounded-md cursor-pointer border transition-colors
                    ${hasAnswered && index === currentQuestion.correctAnswerIndex 
                      ? 'border-green-500 bg-green-50' 
                      : hasAnswered && index === selectedOption 
                        ? 'border-red-500 bg-red-50' 
                        : selectedOption === index 
                          ? 'border-primary' 
                          : 'border-input hover:bg-accent hover:text-accent-foreground'}`}
                  onClick={() => handleOptionSelect(index)}
                >
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`}
                    disabled={hasAnswered}
                  />
                  <Label 
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                  {hasAnswered && index === currentQuestion.correctAnswerIndex && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {hasAnswered && index === selectedOption && index !== currentQuestion.correctAnswerIndex && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              ))}
            </RadioGroup>
            
            {hasAnswered && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <div className="font-medium mb-1">Explanation:</div>
                <div className="text-sm">{currentQuestion.explanation}</div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={moveToPreviousQuestion} disabled={currentQuestionIndex === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <div className="space-x-2">
              {!hasAnswered ? (
                <Button onClick={checkAnswer} disabled={selectedOption === null}>
                  Check Answer
                </Button>
              ) : (
                <Button onClick={moveToNextQuestion}>
                  {isLastQuestion ? 'Complete Quiz' : 'Next Question'} 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </>
      ) : (
        <div className="py-8 px-6 text-center">
          <div className="flex justify-center mb-4">
            <Award className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl mb-2">Quiz Completed!</CardTitle>
          <p className="text-lg mb-6">
            Your score: {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
          </p>
          
          <div className="flex justify-center">
            <Button onClick={() => onComplete(score, questions.length)}>
              Back to Lesson
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
