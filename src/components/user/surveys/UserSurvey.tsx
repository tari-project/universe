import { Chip } from '@app/components/elements/Chip.tsx';
import { Wrapper } from './styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useFetchSurveyContent } from '@app/hooks/user/surveys/useFetchSurveyContent.ts';

export default function UserSurvey() {
    const { data: survey } = useFetchSurveyContent();

    console.debug(`survey= `, survey);

    const questionMarkup = survey?.questions?.map((question) => <p key={question.id}>{question.questionText}</p>);
    return survey ? (
        <Wrapper>
            <Chip>
                <p>{`Feedback`}</p>
            </Chip>
            <Typography variant="h1">{survey.title}</Typography>
            <Typography variant="p">{survey.description}</Typography>

            {questionMarkup}
        </Wrapper>
    ) : null;
}
