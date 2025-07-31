import { Wrapper, Text, Number } from './styles';

interface Props {
    isActive: boolean;
    text: string;
    number: number;
    onClick: () => void;
}

export default function FilterButton({ isActive, text, number, onClick }: Props) {
    return (
        <Wrapper $isActive={isActive} type="button" onClick={onClick}>
            <Text>{text}</Text>
            <Number>{number}</Number>
        </Wrapper>
    );
}
