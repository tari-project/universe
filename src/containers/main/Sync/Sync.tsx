import { Content, HeaderImg, Wrapper } from './sync.styles.ts';
import coins from '/assets/img/coins.png';

export default function Sync() {
    return (
        <Wrapper>
            <Content>
                <HeaderImg src={coins} alt="coin ring img" />
                <div>{`bla`}</div>
                <div>{`bla TWO`}</div>
            </Content>
        </Wrapper>
    );
}
