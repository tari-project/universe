import { Character, Characters, Wrapper } from './CharSpinner.styles.ts';

export default function CharSpinner() {
    const bla = '3429847,2323';
    const charArray = Array.from(bla);
    return (
        <Wrapper>
            <Characters>
                {charArray.map((c, i) => (
                    <Character key={i + c}>{c}</Character>
                ))}
            </Characters>
        </Wrapper>
    );
}
