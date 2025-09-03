import { Chip } from '@app/components/elements/Chip.tsx';
import { ChipText, Description, Title, Wrapper } from './styles.ts';
import { useFetchSurveyContent } from '@app/hooks/user/surveys/useFetchSurveyContent.ts';
import SurveyForm from './SurveyForm.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { SurveyType } from '@app/types/user/surveys.ts';

interface UserSurveyProps {
    type: SurveyType;
}
export default function UserSurvey({ type }: UserSurveyProps) {
    const { data: survey, isLoading } = useFetchSurveyContent(type);
    const loadingMarkup = isLoading && <LoadingDots />;
    const markup = !!survey && (
        <>
            <Title variant="h1">{survey.title}</Title>
            <Description>{survey.description}</Description>
            {survey.questions && <SurveyForm questions={survey.questions} />}
        </>
    );

    return (
        <Wrapper>
            <Chip size="large">
                <ChipText>{`Feedback`}</ChipText>
            </Chip>
            {loadingMarkup}
            {markup}
        </Wrapper>
    );
}
