import { Wrapper, Text, Number } from './styles';

interface Props {
    isActive: boolean;
    text: string;
    number: number;
}

export default function FilterButton({ isActive, text, number }: Props) {
    return (
        <Wrapper $isActive={isActive} type="button">
            <Text>{text}</Text>
            <Number>{number}</Number>
        </Wrapper>
    );
}
