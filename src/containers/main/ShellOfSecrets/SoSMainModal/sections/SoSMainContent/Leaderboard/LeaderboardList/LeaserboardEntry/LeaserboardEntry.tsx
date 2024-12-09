import { useTranslation } from 'react-i18next';
import { Wrapper, Avatar, Handle, Status, LeftSide, RightSide, Rank, Dot, Duration } from './styles';

export default function LeaserboardEntry({ entry, $current }) {
    const { t } = useTranslation('sos', { useSuspense: false });
    const lastMined = '52m';

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
                        <Dot /> {t('leaserboardEntry.mining')}
                    </Status>
                )}
                {entry.status === 'idle' && (
                    <Status $isRed={'red'}>
                        <Dot $isRed={'red'} /> {t('leaserboardEntry.idle', { time: lastMined })}
                    </Status>
                )}

                <Duration>{entry.duration}</Duration>
            </RightSide>
        </Wrapper>
    );
}
