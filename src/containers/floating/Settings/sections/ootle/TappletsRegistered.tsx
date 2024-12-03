import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { useRegisteredTappletsStore } from '@app/store/useRegisteredTappletsStore.ts';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';

const Count = styled.div<{ $count: number }>`
    border-radius: 11px;
    background-color: ${({ theme }) => theme.palette.background.accent};
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    line-height: 1;
    width: ${({ $count }) => ($count > 999 ? 'auto' : '22px')};
    height: ${({ $count }) => ($count > 999 ? 'auto' : '22px')};
    font-size: ${({ $count }) => ($count > 999 ? '10px' : '11px')};
`;

export default function TappletsRegistered() {
    const { t } = useTranslation('settings');
    const fetchTapplets = useRegisteredTappletsStore((s) => s?.fetchRegisteredTapplets);
    const registeredTapplets = useRegisteredTappletsStore((state) => state.registeredTapplets);
    const registeredTappletsCount = registeredTapplets?.length || 0;
    console.log('fethch registered tapp', registeredTapplets);
    const listMarkup = registeredTappletsCount
        ? registeredTapplets.map((tapp, i) => <li key={`tapp-${tapp}:${i}`}>{tapp.display_name}</li>)
        : null;

    // TODO can be used if fetching from db works
    // useEffect(() => {
    //     const fetchTappletsInterval = setInterval(async () => {
    //         try {
    //             await fetchTapplets();
    //         } catch (error) {
    //             console.error('Error fetching registered tapplets:', error);
    //         }
    //     }, 5000);

    //     return () => {
    //         clearInterval(fetchTappletsInterval);
    //     };
    // }, [fetchTapplets]);

    return (
        <SettingsGroupWrapper>
            <SquaredButton
                onClick={() => fetchTapplets()}
                color="tariPurple"
                size="medium"
                style={{ width: '25%', alignContent: 'center' }}
            >
                {t('fetch-registered-tapplets')}
            </SquaredButton>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('registered-tapplets')}</Typography>
                        {registeredTappletsCount ? (
                            <Count $count={registeredTappletsCount}>
                                <Typography>{registeredTappletsCount}</Typography>
                            </Count>
                        ) : null}
                    </SettingsGroupTitle>

                    <Stack style={{ fontSize: '12px' }}>
                        <ol>{listMarkup}</ol>
                    </Stack>
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
