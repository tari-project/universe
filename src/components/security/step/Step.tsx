import { Wrapper, Title, Subtitle, Content, Top, Chip } from './styles.ts';

export interface StepItem {
    stepNumber: number;
    completed: boolean;
    title: string;
    subtitle: string;
}
export const Step = ({ stepNumber, completed, title, subtitle }: StepItem) => {
    return (
        <Wrapper>
            <Top>
                <Chip $isStep>{`Step ${stepNumber}`}</Chip>
                <Chip>{completed ? `Complete` : `Incomplete`}</Chip>
            </Top>
            <Content>
                <Title>{title}</Title>
                <Subtitle>{subtitle}</Subtitle>
            </Content>
        </Wrapper>
    );
};
