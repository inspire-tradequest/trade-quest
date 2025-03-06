import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle, Clock, Video, FileText, ArrowRight, Award } from "lucide-react";
import { aiApi, LearningContentResponse, LearningProgress } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import InteractiveLearningContent, { InteractiveLearningStep } from "@/components/InteractiveLearningContent";

export default function LearningAI() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [learningContent, setLearningContent] = useState<LearningContentResponse | null>(null);
  const [userProgress, setUserProgress] = useState<LearningProgress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('lessons');
  const [showInteractive, setShowInteractive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchUserProgress();
      getPersonalizedContent();
    }
  }, [user]);

  const fetchUserProgress = async () => {
    if (!user) return;
    
    try {
      setError(null);
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching learning progress:', error);
        setError(`Error fetching learning progress: ${error.message}`);
        return;
      }
      
      setUserProgress(data || []);
    } catch (error: any) {
      console.error('Error fetching learning progress:', error);
      setError(`Error fetching learning progress: ${error.message}`);
    }
  };

  const getPersonalizedContent = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const mockResponse: LearningContentResponse = {
        lessons: [
          {
            id: 'intro_to_investing',
            title: 'Introduction to Investing',
            description: 'Learn the basics of investing and financial markets',
            content: 'Investing is the act of allocating resources, usually money, with the expectation of generating income or profit over time...',
            difficulty: 'beginner',
            estimatedDuration: 15,
            format: 'text',
            resources: [
              { type: 'article', url: 'https://www.investopedia.com/terms/i/investing.asp', title: 'Investing Basics' }
            ]
          },
          {
            id: 'technical_analysis_101',
            title: 'Technical Analysis Fundamentals',
            description: 'Learn how to analyze price charts and identify patterns',
            content: 'Technical analysis is a trading discipline that evaluates investments and identifies trading opportunities by analyzing statistical trends...',
            difficulty: 'beginner',
            estimatedDuration: 20,
            format: 'interactive',
            resources: [],
            interactiveContent: [
              {
                id: 'ta_step1',
                title: 'Understanding Chart Types',
                content: 'There are several chart types used in technical analysis.',
                interactionType: 'info-reveal',
                interactionData: {
                  revealContent: 'The main chart types are Line, Bar, Candlestick, and Point & Figure charts.'
                },
                points: 10
              },
              {
                id: 'ta_step2',
                title: 'Identify the Pattern',
                content: 'Can you identify which pattern is shown?',
                interactionType: 'multiple-choice',
                interactionData: {
                  options: [
                    { id: 'opt1', text: 'Head and Shoulders', isCorrect: true },
                    { id: 'opt2', text: 'Double Top', isCorrect: false },
                    { id: 'opt3', text: 'Flag Pattern', isCorrect: false }
                  ]
                },
                points: 15
              }
            ]
          }
        ],
        recommendedPath: {
          nextLessons: ['intro_to_investing'],
          rationale: 'Start with the basics of investing to build a strong foundation.'
        },
        assessments: [
          {
            id: 'intro_to_investing_assessment',
            title: 'Introduction to Investing Assessment',
            questions: [
              {
                text: 'What is the primary purpose of investing?',
                options: [
                  'To make quick profits',
                  'To generate income or profit over time',
                  'To avoid taxes',
                  'To spend money'
                ],
                correctAnswerIndex: 1,
                explanation: 'Investing is about allocating resources with the expectation of generating income or profit over time.'
              }
            ]
          }
        ]
      };

      try {
        const response = await aiApi.getLearningContent({
          userId: user.id,
          knowledgeLevel: 'beginner',
          topics: ['investing', 'trading', 'technical_analysis'],
          preferredFormats: ['text', 'video', 'interactive']
        });
        
        setLearningContent(response);
        
        if (response.recommendedPath.nextLessons.length > 0) {
          const nextLessonId = response.recommendedPath.nextLessons[0];
          const nextLesson = response.lessons.find(lesson => lesson.id === nextLessonId);
          if (nextLesson) {
            setSelectedLesson(nextLesson);
          } else if (response.lessons.length > 0) {
            setSelectedLesson(response.lessons[0]);
          }
        } else if (response.lessons.length > 0) {
          setSelectedLesson(response.lessons[0]);
        }
      } catch (functionError: any) {
        console.error('Error from Supabase function:', functionError);
        
        setLearningContent(mockResponse);
        
        if (mockResponse.lessons.length > 0) {
          setSelectedLesson(mockResponse.lessons[0]);
        }
        
        toast({
          title: "Using demo content",
          description: "Could not connect to learning service. Using demo content instead.",
          variant: "default",
        });
      }
      
    } catch (error: any) {
      console.error('Error loading learning content:', error);
      setError(`Error loading learning content: ${error.message}`);
      
      toast({
        title: "Error loading learning content",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markLessonAsCompleted = async (lessonId: string) => {
    if (!user) return;
    
    try {
      setError(null);
      const { data: existingProgress, error: fetchError } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error checking existing progress:', fetchError);
        setError(`Error checking progress: ${fetchError.message}`);
        throw fetchError;
      }
      
      if (existingProgress) {
        const { error: updateError } = await supabase
          .from('learning_progress')
          .update({ completed: true })
          .eq('id', existingProgress.id);
          
        if (updateError) {
          console.error('Error updating progress:', updateError);
          setError(`Error updating progress: ${updateError.message}`);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('learning_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true
          });
          
        if (insertError) {
          console.error('Error inserting progress:', insertError);
          setError(`Error saving progress: ${insertError.message}`);
          throw insertError;
        }
      }
      
      fetchUserProgress();
      
      toast({
        title: "Lesson completed",
        description: "Your progress has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating progress",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const takeAssessment = async (assessmentId: string) => {
    setCurrentTab('assessments');
    
    toast({
      title: "Assessment Ready",
      description: "You can now take the assessment for this lesson.",
    });
  };

  const isLessonCompleted = (lessonId: string) => {
    return userProgress.some(p => p.lesson_id === lessonId && p.completed);
  };

  const calculateCompletionPercentage = () => {
    if (!learningContent || learningContent.lessons.length === 0) return 0;
    
    const completedLessons = learningContent.lessons.filter(lesson => 
      isLessonCompleted(lesson.id)
    ).length;
    
    return (completedLessons / learningContent.lessons.length) * 100;
  };

  const formatIcon = (format: string) => {
    switch (format) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'interactive':
        return <BookOpen className="h-4 w-4" />;
      case 'text':
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  const handleCompleteInteractive = () => {
    setShowInteractive(false);
    if (selectedLesson) {
      markLessonAsCompleted(selectedLesson.id);
    }
  };

  if (!user) {
    return (
      <div className="container max-w-6xl py-10">
        <Card className="flex flex-col justify-center items-center p-10 text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium mb-2">Sign in required</h3>
          <p className="text-gray-500 mb-6">
            Please sign in to access the learning center.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Learning Center</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Personalized learning content tailored to your knowledge level and interests
        </p>
      </div>
      
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <h3 className="font-medium mb-2">Error</h3>
              <p>{error}</p>
              <Button 
                onClick={() => {
                  setError(null);
                  fetchUserProgress();
                  getPersonalizedContent();
                }}
                variant="outline" 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : learningContent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Learning Journey</CardTitle>
                <CardDescription>Track your progress and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Course Completion</span>
                    <span>{Math.round(calculateCompletionPercentage())}%</span>
                  </div>
                  <Progress value={calculateCompletionPercentage()} />
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-medium">Next recommended:</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {learningContent.recommendedPath.nextLessons.length > 0 ? 
                          userProgress.filter(p => 
                            learningContent.recommendedPath.nextLessons.includes(p.lesson_id) && 
                            p.completed
                          ).length : 0}/{learningContent.recommendedPath.nextLessons.length}
                      </span>
                    </div>
                    
                    <p className="text-sm mt-2 text-gray-600">
                      {learningContent.recommendedPath.rationale}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Available Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningContent.lessons.map((lesson) => (
                    <div 
                      key={lesson.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50
                        ${selectedLesson?.id === lesson.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}
                      `}
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setShowInteractive(false);
                        setCurrentTab('lessons');
                      }}
                    >
                      <div className="flex items-center">
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <div className="h-5 w-5 mr-2 flex items-center justify-center">
                            {formatIcon(lesson.format)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{lesson.title}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {lesson.estimatedDuration} min • 
                            <span className="ml-1 capitalize">{lesson.difficulty}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {selectedLesson ? (
              showInteractive && selectedLesson.format === 'interactive' && selectedLesson.interactiveContent ? (
                <div className="space-y-4">
                  <Card className="mb-4">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{selectedLesson.title} - Interactive Module</CardTitle>
                          <CardDescription>
                            Complete all steps to finish this module
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowInteractive(false)}>
                          Back to Lesson
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                  
                  <InteractiveLearningContent 
                    steps={selectedLesson.interactiveContent as InteractiveLearningStep[]}
                    onComplete={handleCompleteInteractive}
                  />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{selectedLesson.title}</CardTitle>
                        <CardDescription>
                          {selectedLesson.estimatedDuration} min • {selectedLesson.difficulty}
                        </CardDescription>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        selectedLesson.format === 'video' ? 'bg-red-100 text-red-800' :
                        selectedLesson.format === 'interactive' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedLesson.format.charAt(0).toUpperCase() + selectedLesson.format.slice(1)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Tabs value={currentTab} onValueChange={setCurrentTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="lessons">Lesson</TabsTrigger>
                        <TabsTrigger value="resources">Resources</TabsTrigger>
                        <TabsTrigger value="assessments">Assessment</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="lessons">
                        <div className="prose max-w-none">
                          <p>{selectedLesson.content}</p>
                          
                          {selectedLesson.format === 'interactive' && selectedLesson.interactiveContent && (
                            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                              <h3 className="flex items-center text-purple-800 mb-2">
                                <Award className="h-5 w-5 mr-2" />
                                Interactive Learning Available
                              </h3>
                              <p className="text-sm text-gray-700 mb-4">
                                This lesson includes an interactive module to help you better understand the concepts through hands-on practice.
                              </p>
                              <Button onClick={() => setShowInteractive(true)}>
                                Start Interactive Module
                              </Button>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="resources">
                        <div className="space-y-3">
                          {selectedLesson.resources && selectedLesson.resources.length > 0 ? (
                            selectedLesson.resources.map((resource, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{resource.title}</div>
                                  <div className="text-xs text-gray-500">{resource.type}</div>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    View Resource
                                  </a>
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              No additional resources available for this lesson.
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="assessments">
                        {learningContent.assessments && learningContent.assessments.some(a => a.id === `${selectedLesson.id}_assessment`) ? (
                          <div>
                            <p className="mb-4">
                              Test your knowledge of {selectedLesson.title} with this assessment.
                            </p>
                            <Button onClick={() => takeAssessment(`${selectedLesson.id}_assessment`)}>
                              Start Assessment
                            </Button>
                            
                            {currentTab === 'assessments' && (
                              <div className="mt-6 space-y-6">
                                {learningContent.assessments
                                  .find(a => a.id === `${selectedLesson.id}_assessment`)
                                  ?.questions.map((question, qIndex) => (
                                    <div key={qIndex} className="p-4 bg-gray-50 rounded-lg">
                                      <h4 className="font-medium mb-3">Question {qIndex + 1}: {question.text}</h4>
                                      <div className="space-y-2">
                                        {question.options.map((option, oIndex) => (
                                          <div key={oIndex} className="flex items-center">
                                            <input 
                                              type="radio" 
                                              id={`q${qIndex}-o${oIndex}`}
                                              name={`question-${qIndex}`}
                                              className="mr-2"
                                            />
                                            <label htmlFor={`q${qIndex}-o${oIndex}`}>{option}</label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                
                                <Button className="mt-4">
                                  Submit Assessment
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No assessment available for this lesson yet.
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  
                  <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                    {isLessonCompleted(selectedLesson.id) ? (
                      <Button variant="outline" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </Button>
                    ) : (
                      <Button onClick={() => markLessonAsCompleted(selectedLesson.id)}>
                        Mark as Completed
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            ) : (
              <Card className="h-full flex flex-col justify-center items-center p-10 text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">Select a lesson</h3>
                <p className="text-gray-500 mb-6">
                  Choose a lesson from the list to begin learning.
                </p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card className="flex flex-col justify-center items-center p-10 text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium mb-2">No learning content yet</h3>
          <p className="text-gray-500 mb-6">
            Get personalized learning content based on your knowledge level and interests.
          </p>
          <Button onClick={getPersonalizedContent} disabled={isLoading}>
            Get Personalized Content
          </Button>
        </Card>
      )}
    </div>
  );
}
