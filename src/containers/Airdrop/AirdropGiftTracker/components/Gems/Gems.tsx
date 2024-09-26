import { Wrapper, Number, Label, GemImage } from './styles';
import gemImage from '../../images/gem.png';

interface Props {
    number: number;
    label: string;
}

export default function Gems({ number, label }: Props) {
    return (
        <Wrapper>
            <Number>
                <GemImage src={gemImage} alt="" /> {Math.round(number).toLocaleString()}
            </Number>
            <Label>{label}</Label>
        </Wrapper>
    );
}
