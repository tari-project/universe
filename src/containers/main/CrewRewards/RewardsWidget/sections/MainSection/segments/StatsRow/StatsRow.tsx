import {
    Wrapper,
    ActiveMinersWrapper,
    PhotoWrapper,
    PhotoImage,
    StatusDot,
    TextWrapper,
    MainText,
    LabelText,
    Divider,
} from './styles';

import photo1 from '../../../../../images/person1.png';

export default function StatsRow() {
    return (
        <Wrapper>
            <ActiveMinersWrapper>
                <PhotoWrapper>
                    <PhotoImage $image={photo1} aria-hidden="true" />
                    <PhotoImage $image={photo1} aria-hidden="true" />
                    <PhotoImage $image={photo1} aria-hidden="true" />
                    <StatusDot />
                </PhotoWrapper>

                <TextWrapper>
                    <MainText>
                        12 <span>{`of 32`}</span>
                    </MainText>
                    <LabelText>{`Active Miners`}</LabelText>
                </TextWrapper>
            </ActiveMinersWrapper>

            <Divider />

            <TextWrapper>
                <MainText>15,000</MainText>
                <LabelText>{`Bonus XTM Earned`}</LabelText>
            </TextWrapper>
        </Wrapper>
    );
}
