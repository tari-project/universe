export enum SurveyType {
    CLOSE = 'close',
    LONG = 'long',
}
export enum SurveyQuestionType {
    RADIO = 'radio',
    CHECKBOX = 'checkbox',
    TEXT = 'text',
}

export interface SurveyQuestionOption {
    id: string;
    questionId: string;
    optionText: string;
    value: string;
    order: number;
}

export interface SurveyQuestion {
    id: string;
    surveyId: string;
    questionText: string;
    questionType: SurveyQuestionType;
    order: number;
    options?: SurveyQuestionOption[];
}

export interface Survey {
    id: string;
    title: string;
    type: SurveyType;
    description?: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    questions?: SurveyQuestion[];
}

// Error Response Type
export interface ApiError {
    error: string;
    message: string;
}
