import { useTranslation } from 'react-i18next';
import { MiningRate, NewPill, NudgeButton, Wrapper } from './styles.ts';

interface MemberProps {
    member: {
        image: string;
        isNew: boolean;
        isOnline: boolean;
        miningRate: number;
        id: string;
        name: string;
    };
}

export default function Member({ member }: MemberProps) {
    const { t } = useTranslation('sos', { useSuspense: false });
    const { isNew, isOnline, image, miningRate } = member;

    return (
        <Wrapper $isOnline={isOnline}>
            {isNew && <NewPill>{t('member.new')}</NewPill>}

            <svg
                width="99"
                height="99"
                viewBox="0 0 99 99"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="avatar-svg"
            >
                <circle
                    cx="87.4971"
                    cy="16.5"
                    r="9"
                    fill={isOnline ? '#C5FF47' : '#C8282B'}
                    stroke={isOnline ? '#C5FF47' : '#C8282B'}
                    strokeWidth="3"
                />
                <mask id="path-2-inside-1_185_456" fill="white">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M49.5 99C76.8381 99 99 76.8381 99 49.5C99 42.2389 97.4366 35.343 94.628 29.1305C92.5233 30.3207 90.0915 31 87.501 31C79.4929 31 73.001 24.5081 73.001 16.5C73.001 13.181 74.1162 10.1224 75.9922 7.67851C68.3321 2.81594 59.2449 0 49.5 0C22.1619 0 0 22.1619 0 49.5C0 76.8381 22.1619 99 49.5 99Z"
                    />
                </mask>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M49.5 99C76.8381 99 99 76.8381 99 49.5C99 42.2389 97.4366 35.343 94.628 29.1305C92.5233 30.3207 90.0915 31 87.501 31C79.4929 31 73.001 24.5081 73.001 16.5C73.001 13.181 74.1162 10.1224 75.9922 7.67851C68.3321 2.81594 59.2449 0 49.5 0C22.1619 0 0 22.1619 0 49.5C0 76.8381 22.1619 99 49.5 99Z"
                    fill="url(#imagePattern)"
                />
                <path
                    d="M94.628 29.1305L97.3617 27.8947L96.0092 24.903L93.1513 26.5191L94.628 29.1305ZM75.9922 7.67851L78.3719 9.50528L80.3692 6.90353L77.6 5.14572L75.9922 7.67851ZM96 49.5C96 75.1812 75.1812 96 49.5 96V102C78.4949 102 102 78.4949 102 49.5H96ZM91.8944 30.3663C94.5309 36.1982 96 42.6735 96 49.5H102C102 41.8044 100.342 34.4878 97.3617 27.8947L91.8944 30.3663ZM93.1513 26.5191C91.4853 27.4612 89.5606 28 87.501 28V34C90.6224 34 93.5613 33.1802 96.1047 31.7419L93.1513 26.5191ZM87.501 28C81.1498 28 76.001 22.8513 76.001 16.5H70.001C70.001 26.165 77.8361 34 87.501 34V28ZM76.001 16.5C76.001 13.8644 76.884 11.4435 78.3719 9.50528L73.6125 5.85174C71.3483 8.80126 70.001 12.4976 70.001 16.5H76.001ZM49.5 3C58.6588 3 67.1908 5.64486 74.3845 10.2113L77.6 5.14572C69.4734 -0.0129664 59.8309 -3 49.5 -3V3ZM3 49.5C3 23.8188 23.8188 3 49.5 3V-3C20.5051 -3 -3 20.5051 -3 49.5H3ZM49.5 96C23.8188 96 3 75.1812 3 49.5H-3C-3 78.4949 20.5051 102 49.5 102V96Z"
                    fill={isOnline ? '#C5FF47' : '#C8282B'}
                    mask="url(#path-2-inside-1_185_456)"
                />
                <defs>
                    <pattern id="imagePattern" patternUnits="userSpaceOnUse" width="100" height="100">
                        <image href={image} x="0" y="0" width="100" height="100" />
                    </pattern>
                </defs>
            </svg>

            {!isOnline && <NudgeButton className="nudge-btn">{t('member.nudge')}</NudgeButton>}

            {isOnline && (
                <MiningRate>
                    +{miningRate}
                    {t('member.minHr')}
                </MiningRate>
            )}
        </Wrapper>
    );
}
