import React, { useState } from 'react';

import {
    IoSettingsOutline,
    IoClose,
    IoCopyOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoCheckmarkOutline,
} from 'react-icons/io5';
import { useGetSeedWords } from '../../../../hooks/useGetSeedWords';
import truncateString from '../../../../utils/truncateString';
import { invoke } from '@tauri-apps/api/tauri';

import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import VisualMode from '../../../Dashboard/components/VisualMode';
import { DialogContent, Form, HorisontalBox } from './Settings.styles';

import { useForm } from 'react-hook-form';
import ConnectButton from '@app/containers/Airdrop/components/ConnectButton/ConnectButton.tsx';

import { Button, IconButton } from '@app/components/elements/Button.tsx';
import Dialog from '@app/components/elements/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Divider } from '@app/components/elements/Divider.tsx';
import TelemetryMode from '@app/containers/Dashboard/components/TelemetryMode.tsx';

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import AppVersions from '@app/containers/SideBar/components/Settings/AppVersions.tsx';
import LanguageSettings from '@app/containers/SideBar/components/Settings/LanguageSettings.tsx';
import HardwareStatus from '@app/containers/SideBar/components/Settings/HardwareStatus.tsx';

import DebugSettings from '@app/containers/SideBar/components/Settings/DebugSettings.tsx';
import { MinerContainer } from '../../Miner/styles';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import useAppStateStore from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { ControlledNumberInput } from '@app/components/NumberInput';
import { ControlledMoneroAddressInput } from '@app/components/MoneroAddressInput';
import { ResetSettingsButton } from '@app/containers/SideBar/components/Settings/ResetSettingsButton.tsx';

enum FormFields {
    IDLE_TIMEOUT = 'idleTimeout',
    MONERO_ADDRESS = 'moneroAddress',
}

interface FormState {
    [FormFields.IDLE_TIMEOUT]: number;
    [FormFields.MONERO_ADDRESS]: string;
}

export default function Settings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const userInActivityTimeout = useAppStatusStore((state) => state.user_inactivity_timeout);
    const moneroAddress = useAppStatusStore((state) => state.monero_address);
    const isP2poolEnabled = useAppStatusStore((state) => state.p2pool_enabled);
    const isCpuMiningEnabled = useAppStatusStore((state) => state.cpu_mining_enabled);
    const isGpuMiningEnabled = useAppStatusStore((state) => state.gpu_mining_enabled);
    const [open, setOpen] = useState(false);
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const { reset, handleSubmit, control } = useForm<FormState>({
        defaultValues: { idleTimeout: userInActivityTimeout, moneroAddress },
        mode: 'onSubmit',
    });
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();
    const miningAllowed = useAppStateStore((s) => s.setupProgress >= 1);
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const { isLoading } = useMiningControls();
    const handleClickOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setShowSeedWords(false);
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
        await navigator.clipboard.writeText(seedWords.join(' '));
        setTimeout(() => setIsCopyTooltipHidden(true), 1000);
    };

    const handleCancel = () => {
        reset({ idleTimeout: userInActivityTimeout });
    };

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        console.info('submitting');
        handleSubmit(
            (data) => {
                console.info(typeof data[FormFields.IDLE_TIMEOUT]);
                invoke('set_user_inactivity_timeout', {
                    timeout: Number(data[FormFields.IDLE_TIMEOUT]),
                });
                invoke('set_monero_address', { moneroAddress: data[FormFields.MONERO_ADDRESS] });
                invoke('set_auto_mining', { autoMining: false });
                handleClose();
            },
            (error) => {
                console.error(error);
            }
        )();
    };

    const seedWordMarkup = (
        <Stack>
            <Stack direction="row" justifyContent="space-between" style={{ height: 40 }}>
                <Typography variant="h6">Seed Words</Typography>
                {showSeedWords && seedWordsFetched && (
                    <IconButton onClick={copySeedWords}>
                        {isCopyTooltipHidden ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                    </IconButton>
                )}
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">
                    {showSeedWords
                        ? truncateString(seedWords.join(' '), 50)
                        : '****************************************************'}
                </Typography>
                <IconButton onClick={toggleSeedWordsVisibility} disabled={seedWordsFetching}>
                    {seedWordsFetching ? (
                        <CircularProgress />
                    ) : showSeedWords ? (
                        <IoEyeOffOutline size={18} />
                    ) : (
                        <IoEyeOutline size={18} />
                    )}
                </IconButton>
            </Stack>
        </Stack>
    );

    const idleTimerMarkup = (
        <Form onSubmit={onSubmit}>
            <Stack>
                <ControlledNumberInput
                    name={FormFields.IDLE_TIMEOUT}
                    endAdornment={t('seconds', { ns: 'common' })}
                    title={t('idle-timeout.title', { ns: 'settings' })}
                    placeholder={t('idle-timeout.placeholder', { ns: 'settings' })}
                    control={control}
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
                <ControlledMoneroAddressInput
                    name={FormFields.MONERO_ADDRESS}
                    control={control}
                    title={t('monero-address.title', { ns: 'settings' })}
                    placeholder={t('monero-address.placeholder', { ns: 'settings' })}
                />
            </Stack>
            <Stack direction="row" justifyContent="flex-end">
                <Button onClick={handleCancel}>Cancel</Button>
                <Button type="submit" styleVariant="contained">
                    Submit
                </Button>
            </Stack>
        </Form>
    );
    const handleP2poolEnabled = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        invoke('set_p2pool_enabled', { p2poolEnabled: isChecked }).then(() => {
            console.info('P2pool enabled checked', isChecked);
        });
    };

    const handleCpuMiningEnabled = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        invoke('set_cpu_mining_enabled', { enabled: isChecked }).then(() => {
            console.info('CPU mining enabled checked', isChecked);
        });
    };

    const handleGpuMiningEnabled = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        invoke('set_gpu_mining_enabled', { enabled: isChecked }).then(() => {
            console.info('GPU mining enabled checked', isChecked);
        });
    };

    const p2pMarkup = (
        <MinerContainer>
            <Stack>
                <Typography variant="h6">{t('pool-mining', { ns: 'settings' })}</Typography>
                <Typography variant="p">{t('pool-mining-description', { ns: 'settings' })}</Typography>
            </Stack>
            <ToggleSwitch
                checked={isP2poolEnabled}
                disabled={isMining || !miningAllowed || isLoading}
                onChange={handleP2poolEnabled}
            />
        </MinerContainer>
    );

    const cpuEnabledMarkup = (
        <MinerContainer>
            <Stack>
                <Typography variant="h6">{t('cpu-mining-enabled', { ns: 'settings' })}</Typography>
            </Stack>
            <ToggleSwitch
                checked={isCpuMiningEnabled}
                disabled={isMining || !miningAllowed || isLoading}
                onChange={handleCpuMiningEnabled}
            />
        </MinerContainer>
    );

    const gpuEnabledMarkup = (
        <MinerContainer>
            <Stack>
                <Typography variant="h6">{t('gpu-mining-enabled', { ns: 'settings' })}</Typography>
            </Stack>
            <ToggleSwitch
                checked={isGpuMiningEnabled}
                disabled={isMining || !miningAllowed || isLoading}
                onChange={handleGpuMiningEnabled}
            />
        </MinerContainer>
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
                    {p2pMarkup}
                    <Divider />
                    {cpuEnabledMarkup}
                    <Divider />
                    {gpuEnabledMarkup}
                    <Divider />
                    <LanguageSettings />
                    <Divider />
                    <DebugSettings />
                    <Divider />
                    <HardwareStatus />
                    <Divider />
                    <AppVersions />
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                        <VisualMode />
                        <TelemetryMode />
                    </Stack>
                    <Divider />
                    <HorisontalBox>
                        <ConnectButton />
                    </HorisontalBox>
                    <Divider />
                    <HorisontalBox>
                        <ResetSettingsButton />
                    </HorisontalBox>
                </DialogContent>
            </Dialog>
        </>
    );
}
