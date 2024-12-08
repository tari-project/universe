/* eslint-disable i18next/no-literal-string */
import { Wrapper, Avatar, Handle, Status, LeftSide, RightSide, Rank, Dot, Duration } from './styles';

export default function LeaserboardEntry({ entry, $current }) {
    return (
        <Wrapper $current={$current}>
            <LeftSide>
                <Avatar $image={entry.image} $current={$current}>
                    <Rank $current={$current}>{entry.rank}</Rank>
                </Avatar>
                <Handle $current={$current}>{entry.handle}</Handle>
            </LeftSide>
            <RightSide>
                {entry.status === 'mining' && (
                    <Status>
                        <Dot /> Mining now
                    </Status>
                )}
                {entry.status === 'idle' && (
                    <Status $isRed={'red'}>
                        <Dot $isRed={'red'} /> Last mined 52m ago
                    </Status>
                )}

                <Duration>{entry.duration}</Duration>
            </RightSide>
        </Wrapper>
    );
}
