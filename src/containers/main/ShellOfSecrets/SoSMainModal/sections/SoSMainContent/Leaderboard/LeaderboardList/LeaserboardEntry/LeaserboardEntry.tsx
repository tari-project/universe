import { useTranslation } from 'react-i18next';
import { Wrapper, Avatar, Handle, Status, LeftSide, RightSide, Rank, Dot, Duration } from './styles';
import { LeaderboardEntry } from '@app/types/sosTypes';
import { sosFormatAwardedBonusTime } from '@app/utils';

function getTimeDifference(dateString: string) {
    const date = new Date(dateString);
    // Calculate the difference in milliseconds
    const diffInMs = Math.abs(date.getTime() - Date.now());
    // Convert to time units
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffInMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffInMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffInMs / 1000) % 60);
    return sosFormatAwardedBonusTime({ days, hours, minutes, seconds });
}

interface Props {
    entry: LeaderboardEntry;
    isCurrentUser: boolean;
}

export default function LeaserboardEntry({ entry, isCurrentUser }: Props) {
    const { t } = useTranslation('sos', { useSuspense: false });

    const getDuration = () => {
        return `${sosFormatAwardedBonusTime({ ...entry.total_time_bonus })}`;
    };
    const isMining = entry.last_mined_at && new Date(entry.last_mined_at).getTime() > Date.now() - 1000 * 60 * 5;

    return (
        <Wrapper $current={isCurrentUser}>
            <LeftSide>
                <Avatar $image={entry.photo} $current={isCurrentUser}>
                    <Rank $current={isCurrentUser}>{entry.rank}</Rank>
                </Avatar>
                <Handle $current={isCurrentUser}>{entry.name}</Handle>
            </LeftSide>
            <RightSide>
                {entry.last_mined_at && isMining && (
                    <Status>
                        <Dot /> {t('leaserboardEntry.mining')}
                    </Status>
                )}
                {entry.last_mined_at && !isMining && (
                    <Status $isRed={'red'}>
                        <Dot $isRed={'red'} />{' '}
                        {t('leaserboardEntry.idle', { time: getTimeDifference(entry.last_mined_at) })}
                    </Status>
                )}

                <Duration>{getDuration()}</Duration>
            </RightSide>
        </Wrapper>
    );
}
