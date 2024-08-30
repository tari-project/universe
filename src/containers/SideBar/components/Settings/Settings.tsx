import React, { useState } from 'react';

import { IoSettingsOutline, IoClose, IoCopyOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { useGetSeedWords } from '../../../../hooks/useGetSeedWords';
import truncateString from '../../../../utils/truncateString';
import { invoke } from '@tauri-apps/api/tauri';

import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useApplicationsVersions } from '../../../../hooks/useVersions.ts';
import VisualMode from '../../../Dashboard/components/VisualMode';
import { CardContainer, DialogContent, Form, HorisontalBox, RightHandColumn } from './Settings.styles';
import { useHardwareStatus } from '@app/hooks/useHardwareStatus.ts';
import { CardComponent } from './Card.component.tsx';
import { ControlledNumberInput } from '@app/components/NumberInput/NumberInput.component.tsx';
import { useForm } from 'react-hook-form';
import { Environment, useEnvironment } from '@app/hooks/useEnvironment.ts';
import ConnectButton from '@app/containers/Airdrop/components/ConnectButton/ConnectButton.tsx';
import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { Button, IconButton } from '@app/components/elements/Button.tsx';
import Dialog from '@app/components/elements/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Divider } from '@app/components/elements/Divider.tsx';
import TelemetryMode from '@app/containers/Dashboard/components/TelemetryMode.tsx';
import { Language, LanguageList } from '../../../../i18initializer.ts';
import { changeLanguage } from 'i18next';
import { useTranslation } from 'react-i18next';

enum FormFields {
    IDLE_TIMEOUT = 'idleTimeout',
}

interface FormState {
    [FormFields.IDLE_TIMEOUT]: number;
}

export default function Settings() {
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

    const seedWordMarkup = (
        <Stack>
            <Typography variant="h6">Seed Words</Typography>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">
                    {showSeedWords
                        ? truncateString(seedWords.join(' '), 50)
                        : '****************************************************'}
                </Typography>
                {seedWordsFetching ? (
                    <div>loader</div>
                ) : (
                    <IconButton onClick={toggleSeedWordsVisibility}>
                        {showSeedWords ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </IconButton>
                )}
                {showSeedWords && seedWordsFetched && <div>copy</div>}
            </Stack>
        </Stack>
    );

    const idleTimerMarkup = (
        <Form onSubmit={onSubmit}>
            <Stack>
                <Typography variant="h6">Time after which machine is considered idle</Typography>
                <input name="idle" placeholder="Enter idle timeout in seconds" type="int" />
            </Stack>
            <Stack direction="row" justifyContent="flex-end">
                <Button onClick={handleCancel}>Cancel</Button>
                <Button type="submit" styleVariant="contained">
                    Submit
                </Button>
            </Stack>
        </Form>
    );
    return (
        <>
            <IconButton onClick={handleClickOpen}>
                <IoSettingsOutline size={16} />
            </IconButton>
            <Dialog onClose={handleClose} open={open}>
                <DialogContent>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="h4">Settings</Typography>
                        <IconButton onClick={handleClose}>
                            <IoClose size={20} />
                        </IconButton>
                    </Stack>
                    <Divider />
                    {seedWordMarkup}
                    <Divider />
                    {idleTimerMarkup}
                    <Divider />
                    <HorisontalBox>
                        <Typography variant="h6">Logs</Typography>
                        <RightHandColumn>
                            <Button onClick={openLogsDirectory} variant="text">
                                Open logs directory
                            </Button>
                        </RightHandColumn>
                    </HorisontalBox>
                    <Divider />
                    <HorisontalBox>
                        <Typography variant="h6">Debug Info:</Typography>
                    </HorisontalBox>
                    <CardComponent
                        heading="Blocks"
                        labels={[{ labelText: 'Last block added to chain time', labelValue: displayTime }]}
                    />
                    <Divider />
                    <Divider />
                    {
                        <>
                            <HorisontalBox>
                                <Typography variant="h6">Hardware Status:</Typography>
                            </HorisontalBox>
                            <CardContainer>
                                <CardComponent
                                    heading={cpu?.label || 'Unknown CPU'}
                                    labels={[
                                        { labelText: 'Usage', labelValue: `${cpu?.usage_percentage || 0}%` },
                                        {
                                            labelText: 'Temperature',
                                            labelValue: `${cpu?.current_temperature || 0}°C`,
                                        },
                                        {
                                            labelText: 'Max Temperature',
                                            labelValue: `${cpu?.max_temperature || 0}°C`,
                                        },
                                    ]}
                                />
                                <CardComponent
                                    heading={gpu?.label || 'Unknown GPU'}
                                    labels={[
                                        { labelText: 'Usage', labelValue: `${gpu?.usage_percentage || 0}%` },
                                        {
                                            labelText: 'Temperature',
                                            labelValue: `${gpu?.current_temperature || 0}°C`,
                                        },
                                        {
                                            labelText: 'Max Temperature',
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
                                <Typography variant="h6">Versions</Typography>
                                <RightHandColumn>
                                    {currentEnvironment === Environment.Development && (
                                        <Button variant="text" onClick={refreshApplicationsVersions}>
                                            Update Versions
                                        </Button>
                                    )}
                                    <Button variant="text" onClick={getApplicationsVersions}>
                                        Refresh Versions
                                    </Button>
                                </RightHandColumn>
                            </HorisontalBox>
                            <Stack>
                                <CardContainer>
                                    {Object.entries(applicationsVersions).map(([key, value]) => (
                                        <CardComponent
                                            key={`${key}-${value}`}
                                            heading={key}
                                            labels={[
                                                {
                                                    labelText: 'Version',
                                                    labelValue: value || 'Unknown',
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
                    <HorisontalBox>
                        <ConnectButton />
                    </HorisontalBox>
                </DialogContent>
            </Dialog>
        </>
    );
}
