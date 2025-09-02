import { Chip } from '@app/components/elements/Chip.tsx';
import { Wrapper } from './styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useFetchSurveyContent } from '@app/hooks/user/surveys/useFetchSurveyContent.ts';
import SurveyForm from './SurveyForm.tsx';

export default function UserSurvey() {
    const { data: survey } = useFetchSurveyContent();

    return survey ? (
        <Wrapper>
            <Chip>
                <p>{`Feedback`}</p>
            </Chip>
            <Typography variant="h1">{survey.title}</Typography>
            <Typography variant="p">{survey.description}</Typography>

            {survey.questions && <SurveyForm questions={survey.questions} />}
        </Wrapper>
    ) : null;
}
