import { Wrapper, Title, Subtitle, Content, Top, Chip } from './styles.ts';
import { useTranslation } from 'react-i18next';

export interface StepItem {
    stepNumber: number;
    completed: boolean;
    title: string;
    subtitle: string;
}
export const Step = ({ stepNumber, completed, title, subtitle }: StepItem) => {
    const { t } = useTranslation(['staged-security']);
    return (
        <Wrapper>
            <Top>
                <Chip $isStep>{t('steps.step', { stepNumber })}</Chip>
                <Chip $isStep={completed}>{t('steps.complete', { context: `${completed}` })}</Chip>
            </Top>
            <Content>
                <Title>{title}</Title>
                <Subtitle>{subtitle}</Subtitle>
            </Content>
        </Wrapper>
    );
};
