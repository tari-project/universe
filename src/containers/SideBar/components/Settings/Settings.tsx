import React, { useState } from 'react';
import {
    IconButton,
    Dialog,
    DialogContent,
    Button,
    Stack,
    Typography,
    Divider,
    CircularProgress,
    Tooltip,
    Box,
    DialogActions,
} from '@mui/material';
import { IoSettingsOutline, IoClose, IoCopyOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { useGetSeedWords } from '../../../../hooks/useGetSeedWords';
import truncateString from '../../../../utils/truncateString';
import { invoke } from '@tauri-apps/api/tauri';

import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useApplicationsVersions } from '../../../../hooks/useVersions.ts';
import VisualMode from '../../../Dashboard/components/VisualMode';
import { CardContainer, HorisontalBox, RightHandColumn } from './Settings.styles';
import { useHardwareStatus } from '@app/hooks/useHardwareStatus.ts';
import { CardComponent } from './Card.component.tsx';
import { ControlledNumberInput } from '@app/components/NumberInput/NumberInput.component.tsx';
import { useForm } from 'react-hook-form';
import { Environment, useEnvironment } from '@app/hooks/useEnvironment.ts';
import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import TelemetryMode from '@app/containers/Dashboard/components/TelemetryMode.tsx';
import { Language, LanguageList } from '../../../../i18initializer.ts';
import { changeLanguage } from 'i18next';
import { useTranslation } from 'react-i18next';
import AirdropPermissionSettings from '@app/containers/Airdrop/AirdropPermissionSettings/AirdropPermissionSettings.tsx';

enum FormFields {
    IDLE_TIMEOUT = 'idleTimeout',
}

interface FormState {
    [FormFields.IDLE_TIMEOUT]: number;
}

const Settings: React.FC = () => {
    const currentEnvironment = useEnvironment();
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    const blockTime = useAppStatusStore((state) => state.base_node?.block_time);
    const userInActivityTimeout = useAppStatusStore((state) => state.user_inactivity_timeout);
    const applicationsVersions = useAppStatusStore((state) => state.applications_versions);
    const { refreshApplicationsVersions, getApplicationsVersions } = useApplicationsVersions();
    const [open, setOpen] = useState(false);
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const { reset, handleSubmit, control } = useForm<FormState>({
        defaultValues: { idleTimeout: userInActivityTimeout },
        mode: 'onSubmit',
    });
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();
    const { cpu, gpu } = useHardwareStatus();

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setShowSeedWords(false);
    };

    const openLogsDirectory = () => {
        invoke('open_log_dir')
            .then(() => {
                console.info('Opening logs directory');
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const toggleSeedWordsVisibility = async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setShowSeedWords((p) => !p);
    };

    const copySeedWords = async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setIsCopyTooltipHidden(false);
        await navigator.clipboard.writeText(seedWords.join(','));
        setTimeout(() => setIsCopyTooltipHidden(true), 1000);
    };

    const handleCancel = () => {
        reset({ idleTimeout: userInActivityTimeout });
    };

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.info('submitting');
        handleSubmit(
            (data) => {
                console.info(typeof data[FormFields.IDLE_TIMEOUT]);
                invoke('set_user_inactivity_timeout', {
                    timeout: Number(data[FormFields.IDLE_TIMEOUT]),
                });
                invoke('set_auto_mining', { autoMining: false });
                handleClose();
            },
            (error) => {
                console.error(error);
            }
        )();
    };

    const handleLanguageChange = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, language: Language) => {
            event.preventDefault();
            event.stopPropagation();
            changeLanguage(language);
        },
        []
    );

    const now = new Date();
    const lastBlockTime = calculateTimeSince(blockTime || 0, now.getTime());
    const { daysString, hoursString, minutes, seconds } = lastBlockTime || {};
    const displayTime = `${daysString} ${hoursString} : ${minutes} : ${seconds}`;
    return (
        <>
            <IconButton onClick={handleClickOpen}>
                <IoSettingsOutline size={16} />
            </IconButton>
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth={'sm'}>
                <DialogContent>
                    <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" pb={1}>
                            <Typography variant="h4">{t('settings', { ns: 'settings' })}</Typography>
                            <IconButton onClick={handleClose}>
                                <IoClose size={20} />
                            </IconButton>
                        </Stack>
                        <Divider />
                        <Stack spacing={1} pt={1} pb={1} direction="column">
                            <Typography variant="h6">{t('seed-words', { ns: 'settings' })}</Typography>
                            <Stack flexDirection="row" alignItems="center" gap={1}>
                                <Typography variant="body2">
                                    {showSeedWords
                                        ? truncateString(seedWords.join(' '), 50)
                                        : '****************************************************'}
                                </Typography>
                                {seedWordsFetching ? (
                                    <CircularProgress size="34px" />
                                ) : (
                                    <IconButton onClick={toggleSeedWordsVisibility}>
                                        {showSeedWords ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                                    </IconButton>
                                )}
                                {showSeedWords && seedWordsFetched && (
                                    <Tooltip
                                        title={`${t('copied', { ns: 'common' })}!`}
                                        placement="top"
                                        open={!isCopyTooltipHidden}
                                        disableFocusListener
                                        disableHoverListener
                                        disableTouchListener
                                        PopperProps={{ disablePortal: true }}
                                    >
                                        <IconButton onClick={copySeedWords}>
                                            <IoCopyOutline size={18} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                        </Stack>
                        <form onSubmit={onSubmit}>
                            <Box my={1}>
                                <Stack spacing={1} pt={1}>
                                    <ControlledNumberInput
                                        name={FormFields.IDLE_TIMEOUT}
                                        control={control}
                                        title={t('idle-timeout.title', { ns: 'settings' })}
                                        endAdornment={t('seconds', { ns: 'common' })}
                                        placeholder={t('idle-timeout.placeholder', { ns: 'settings' })}
                                        type="int"
                                        rules={{
                                            max: {
                                                value: 21600,
                                                message: t('idle-timeout.max', { ns: 'settings' }),
                                            },
                                            min: {
                                                value: 1,
                                                message: t('idle-timeout.min', { ns: 'settings' }),
                                            },
                                        }}
                                    />
                                </Stack>
                                <Divider />
                                <DialogActions>
                                    <Button onClick={handleCancel} variant="outlined">
                                        {t('cancel', { ns: 'common' })}
                                    </Button>
                                    <Button type="submit" variant="contained">
                                        {t('submit', { ns: 'common' })}
                                    </Button>
                                </DialogActions>
                            </Box>
                        </form>
                        <AirdropPermissionSettings />
                        <Divider />
                        <HorisontalBox>
                            <Typography variant="h6">{t('change-language', { ns: 'settings' })}</Typography>
                            <RightHandColumn>
                                <Stack direction="row" justifyContent="flex-end" gap={2} gridArea="1 / 5 / 2 / 6">
                                    {LanguageList.map((langauge) => (
                                        <Button
                                            key={langauge}
                                            sx={{ alignSelf: 'center' }}
                                            onClick={(event) => handleLanguageChange(event, langauge)}
                                        >
                                            {langauge}
                                        </Button>
                                    ))}
                                </Stack>
                            </RightHandColumn>
                        </HorisontalBox>
                        <Divider />
                        <HorisontalBox>
                            <Typography variant="h6">{t('logs', { ns: 'settings' })}</Typography>
                            <RightHandColumn>
                                <Button onClick={openLogsDirectory} variant="text">
                                    {t('open-logs-directory', { ns: 'settings' })}
                                </Button>
                            </RightHandColumn>
                        </HorisontalBox>
                        <Divider />
                        <HorisontalBox>
                            <Typography variant="h6">{t('debug-info', { ns: 'settings' })}:</Typography>
                        </HorisontalBox>
                        <CardComponent
                            heading="Blocks"
                            labels={[
                                { labelText: t('last-block-added-time', { ns: 'settings' }), labelValue: displayTime },
                            ]}
                        />
                        <Divider />
                        {
                            <>
                                <HorisontalBox>
                                    <Typography variant="h6">{t('hardware-status', { ns: 'settings' })}:</Typography>
                                </HorisontalBox>
                                <CardContainer>
                                    <CardComponent
                                        heading={cpu?.label || `${t('unknown', { ns: 'common' })} CPU`}
                                        labels={[
                                            {
                                                labelText: t('usage', { ns: 'common' }),
                                                labelValue: `${cpu?.usage_percentage || 0}%`,
                                            },
                                            {
                                                labelText: t('temperature', { ns: 'common' }),
                                                labelValue: `${cpu?.current_temperature || 0}°C`,
                                            },
                                            {
                                                labelText: t('max-temperature', { ns: 'common' }),
                                                labelValue: `${cpu?.max_temperature || 0}°C`,
                                            },
                                        ]}
                                    />
                                    <CardComponent
                                        heading={gpu?.label || `${t('unknown', { ns: 'common' })} GPU`}
                                        labels={[
                                            {
                                                labelText: t('usage', { ns: 'common' }),
                                                labelValue: `${gpu?.usage_percentage || 0}%`,
                                            },
                                            {
                                                labelText: t('temperature', { ns: 'common' }),
                                                labelValue: `${gpu?.current_temperature || 0}°C`,
                                            },
                                            {
                                                labelText: t('max-temperature', { ns: 'common' }),
                                                labelValue: `${gpu?.max_temperature || 0}°C`,
                                            },
                                        ]}
                                    />
                                </CardContainer>
                            </>
                        }
                        <Divider />
                        {applicationsVersions && (
                            <>
                                <HorisontalBox>
                                    <Typography variant="h6">{t('versions', { ns: 'common' })}</Typography>
                                    <RightHandColumn>
                                        {currentEnvironment === Environment.Development && (
                                            <Button onClick={refreshApplicationsVersions} variant="text">
                                                {t('refresh-versions', { ns: 'settings' })}
                                            </Button>
                                        )}
                                        <Button onClick={getApplicationsVersions} variant="text">
                                            {t('update-versions', { ns: 'settings' })}
                                        </Button>
                                    </RightHandColumn>
                                </HorisontalBox>
                                <Stack spacing={0}>
                                    <CardContainer>
                                        {Object.entries(applicationsVersions).map(([key, value]) => (
                                            <CardComponent
                                                key={`${key}-${value}`}
                                                heading={key}
                                                labels={[
                                                    {
                                                        labelText: t('version', { ns: 'common' }),
                                                        labelValue: value || t('unknown', { ns: 'common' }),
                                                    },
                                                ]}
                                            />
                                        ))}
                                    </CardContainer>
                                </Stack>
                            </>
                        )}
                        <Divider />
                        <HorisontalBox>
                            <VisualMode />
                            <TelemetryMode />
                        </HorisontalBox>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Settings;
