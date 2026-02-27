export type QuestionType = 'grammar';

export interface Question {
  id: number;
  type: QuestionType;
  category: string;
  content: string; 
  options: string[];
  correctAnswer: string;
  explanation: {
    rule: string;
    example: string;
    commonError: string;
  };
}
