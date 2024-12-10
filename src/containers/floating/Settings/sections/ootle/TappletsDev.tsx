import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';

import { SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';
import { TappletsGroup, TappletsGroupWrapper } from './OotleSettings.styles.ts';
import { MdLaunch, MdDelete } from 'react-icons/md';
import tariLogo from '@app/assets/tari.svg';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { useCallback, useEffect, useState } from 'react';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Input } from '@app/components/elements/inputs/Input.tsx';
import { Controller, useForm } from 'react-hook-form';
import { IoCheckmarkOutline, IoCloseOutline, IoRemoveOutline } from 'react-icons/io5';

const endpointRegex = /^(https?:\/\/)?(localhost|127\.0\.0\.1):\d{1,6}\/?$/;

const StyledStack = styled(Stack)`
    width: 100%;
`;

const StyledInput = styled(Input)`
    font-size: 12px;
`;

const StyledForm = styled.form`
    width: 100%;
    // Reserve space for error message
    min-height: 53px;
`;

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

export default function TappletsDev() {
    const { t } = useTranslation('ootle');
    const initialDevTappEndpoint = '';

    const { setActiveTapp, addDevTapp, deleteDevTapp, fetchDevTappDb } = useTappletsStore();
    const devTapplets = useTappletsStore((s) => s.devTapplets);
    // const addDevTapplet = useTappletsStore((s) => s.addDevTapp);
    // const deleteDevTapplet = useTappletsStore((s) => s.deleteDevTapp);
    // const fetchDevTappDb = useTappletsStore((s) => s.fetchDevTappDb);
    const devTappletsCount = devTapplets?.length || 0;
    console.log('fethch dev tapp', devTapplets);

    // TODO can be used if fetching from db works
    // useEffect(() => {
    //     const fetchTappletsInterval = setInterval(async () => {
    //         try {
    //             await fetchTapplets();
    //         } catch (error) {
    //             console.error('Error fetching dev tapplets:', error);
    //         }
    //     }, 5000);

    //     return () => {
    //         clearInterval(fetchTappletsInterval);
    //     };
    // }, [fetchTapplets]);
    const {
        control,
        watch,
        handleSubmit,
        setValue,
        reset,
        trigger,
        formState: { errors },
    } = useForm({
        defaultValues: { endpoint: '' },
    });
    const endpoint = watch('endpoint');

    useEffect(() => {
        setValue('endpoint', initialDevTappEndpoint);
    }, [initialDevTappEndpoint, setValue]);

    const handleApply = useCallback(
        async (data: { endpoint: string }) => {
            await addDevTapp(data.endpoint);
        },
        [addDevTapp]
    );

    const handleReset = useCallback(() => {
        reset({ endpoint: initialDevTappEndpoint });
    }, [reset]);

    useEffect(() => {
        trigger('endpoint');
    }, [endpoint, trigger]);

    return (
        <TappletsGroupWrapper $category="Dev Tapplets">
            <SquaredButton
                onClick={() => fetchDevTappDb()}
                color="tariPurple"
                size="medium"
                style={{ width: '25%', alignContent: 'center', marginBottom: 10 }}
            >
                {t('refresh-list')}
            </SquaredButton>
            <StyledForm onSubmit={handleSubmit(handleApply)} onReset={handleReset}>
                <StyledStack direction="row" alignItems="center" gap={10}>
                    <Controller
                        name="endpoint"
                        control={control}
                        rules={{
                            pattern: {
                                value: endpointRegex,
                                message: 'Invalid endpoint format',
                            },
                        }}
                        render={({ field }) => {
                            const { ref: _ref, ...rest } = field;
                            return <StyledInput type="text" hasError={!!errors.endpoint} {...rest} />;
                        }}
                    />
                    {!errors.endpoint && (
                        <IconButton type="submit">
                            <IoCheckmarkOutline />
                        </IconButton>
                    )}
                    <IconButton type="reset">
                        <IoCloseOutline />
                    </IconButton>
                </StyledStack>
                {errors.endpoint && <span style={{ color: 'red', fontSize: '12px' }}>{errors.endpoint.message}</span>}
            </StyledForm>
            <TappletsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('dev-tapplets')}</Typography>
                        {devTappletsCount ? (
                            <Count $count={devTappletsCount}>
                                <Typography>{devTappletsCount}</Typography>
                            </Count>
                        ) : null}
                    </SettingsGroupTitle>

                    <List sx={{ maxWidth: 600 }}>
                        {devTapplets.map((item, index) => (
                            <ListItem key={index}>
                                <ListItemAvatar>
                                    <Avatar src={tariLogo.toString()} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={item.display_name}
                                    secondary={`id: ${item.id} | endpoint: ${item.endpoint}`}
                                />
                                <IconButton
                                    aria-label="launch"
                                    style={{ marginRight: 10 }}
                                    onClick={() => setActiveTapp(item.id)}
                                >
                                    {/* <NavLink
                                        to={`/${TabKey.DEV_TAPPLETS}/${item.id}`}
                                        state={item}
                                        style={{ display: 'contents' }}
                                    >
                                    </NavLink> */}
                                    <MdLaunch color="primary" />
                                </IconButton>
                                <IconButton
                                    aria-label="delete"
                                    style={{ marginRight: 10 }}
                                    onClick={() => {
                                        deleteDevTapp(item.id);
                                    }}
                                >
                                    <MdDelete color="primary" />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                </SettingsGroupContent>
            </TappletsGroup>
        </TappletsGroupWrapper>
    );
}
