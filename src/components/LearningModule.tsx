
import { useState, useEffect } from 'react';
import { GraduationCap, ChevronRight, PlayCircle, BookOpen, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LearningModuleData {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // minutes
  level: 'beginner' | 'intermediate' | 'advanced';
  progress: number; // 0-100
  lessons: {
    id: string;
    title: string;
    completed: boolean;
    duration: number; // minutes
  }[];
}

interface LearningModuleProps {
  module: LearningModuleData;
  onSelect: (id: string) => void;
  className?: string;
}

const LearningModule = ({ module, onSelect, className }: LearningModuleProps) => {
  const [expanded, setExpanded] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={cn(
        "trading-card",
        animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      <div 
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-trade-blue-100 flex items-center justify-center mr-3">
            <GraduationCap className="h-5 w-5 text-trade-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{module.title}</h3>
            <div className="flex items-center mt-1 space-x-2">
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                getLevelColor(module.level)
              )}>
                {module.level.charAt(0).toUpperCase() + module.level.slice(1)}
              </span>
              <span className="text-xs text-gray-500">
                {module.estimatedTime} min
              </span>
              <span className="text-xs text-gray-500">
                {module.lessons.length} lessons
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right mr-2">
            <div className="text-sm font-medium">
              {module.progress}%
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <ChevronRight className={cn(
            "h-5 w-5 text-gray-400 transition-transform",
            expanded && "transform rotate-90"
          )} />
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
          <p className="text-sm text-gray-600 mb-4">{module.description}</p>
          
          <div className="space-y-2">
            {module.lessons.map((lesson, index) => (
              <div 
                key={lesson.id}
                className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(lesson.id);
                }}
              >
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  {lesson.completed ? (
                    <CheckCircle className="h-4 w-4 text-trade-green-500" />
                  ) : (
                    index === module.lessons.filter(l => l.completed).length ? (
                      <PlayCircle className="h-4 w-4 text-trade-blue-500" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-gray-400" />
                    )
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{lesson.title}</div>
                  <div className="text-xs text-gray-500">{lesson.duration} min</div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningModule;
