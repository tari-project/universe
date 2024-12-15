/* eslint-disable i18next/no-literal-string */
import Progress from '../Progress/Progress';
import { DropWrapper, Eyebrow, TextGroup, Title, Text, MacbookImage } from '../styles';
import gemImage from './images/gem.png';
import mackbookImage from './images/macbook.png';

export default function MacbookDrop() {
    return (
        <DropWrapper>
            <Eyebrow>
                <img src={gemImage} alt="" />
                LIMITED TIME
            </Eyebrow>

            <TextGroup>
                <Title>WIN A MAC BOOK PRO</Title>
                <Text>Be the first of 100 people to remove 1 Day from your clock and win a Macbook Pro</Text>
            </TextGroup>

            <MacbookImage src={mackbookImage} alt="" />

            <Progress percent={50} />
        </DropWrapper>
    );
}
