import { Avatar, BottomRow, ContentWrapper, TopRow, TextBar, Wrapper } from './styles';

export default function CrewEntrySkeleton() {
    return (
        <Wrapper>
            <Avatar />
            <ContentWrapper>
                <TopRow>
                    <TextBar />
                    <TextBar />
                </TopRow>
                <BottomRow>
                    <TextBar />
                </BottomRow>
            </ContentWrapper>
        </Wrapper>
    );
}
