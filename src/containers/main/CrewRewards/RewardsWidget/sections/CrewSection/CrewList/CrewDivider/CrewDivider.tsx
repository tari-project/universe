import { Line, Wrapper } from './styles';

interface Props {
    text: string;
}

export default function CrewDivider({ text }: Props) {
    return (
        <Wrapper>
            {text}
            <Line />
        </Wrapper>
    );
}
