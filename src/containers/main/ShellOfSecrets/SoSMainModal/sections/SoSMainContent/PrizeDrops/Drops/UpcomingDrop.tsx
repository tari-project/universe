/* eslint-disable i18next/no-literal-string */
import Progress from '../Progress/Progress';
import { Eyebrow, TextGroup, Title, Text, DropWrapper, RuneImage } from '../styles';
import cookieImage from './images/cookie.png';
import runeImage from './images/rune.png';

export default function UpcomingDrop() {
    return (
        <DropWrapper>
            <Eyebrow>
                <img src={cookieImage} alt="" />
                UPCOMING DROP
            </Eyebrow>

            <TextGroup>
                <Title>12D 8H 42M 21S</Title>
                <Text>Invite 10 new crew members and unlock classified information about the next drop</Text>
            </TextGroup>

            <RuneImage src={runeImage} alt="" />

            <Progress count={5} total={10} />
        </DropWrapper>
    );
}
