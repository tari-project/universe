import { DigitWrapper, Wrapper } from './styles.ts';

const DEFAULT_PIN_LENGTH = 6;

interface DigitProps {
    value?: number;
}
function Digit({ value }: DigitProps) {
    return <DigitWrapper>{value}</DigitWrapper>;
}

export default function PinInput() {
    const digitMarkup = Array.from({ length: DEFAULT_PIN_LENGTH }, (_, i) => i + 1).map((n, i) => (
        <Digit key={n + i} value={n} />
    ));
    return <Wrapper>{digitMarkup}</Wrapper>;
}
