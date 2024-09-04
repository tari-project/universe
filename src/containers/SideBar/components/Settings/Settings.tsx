import React, { useCallback, useState } from 'react';

import {
    IoSettingsOutline,
    IoClose,
    IoCopyOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoCheckmarkOutline,
} from 'react-icons/io5';
import { useGetSeedWords } from '../../../../hooks/useGetSeedWords';

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

import { ControlledMoneroAddressInput } from '@app/components/MoneroAddressInput';
import { ResetSettingsButton } from '@app/containers/SideBar/components/Settings/ResetSettingsButton.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';
import { SeedWords } from './SeedWords';

enum FormFields {
    MONERO_ADDRESS = 'moneroAddress',
}

interface FormState {
    [FormFields.MONERO_ADDRESS]: string;
}

export default function Settings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const moneroAddress = useAppStatusStore((state) => state.monero_address);
    const isP2poolEnabled = useAppStatusStore((state) => state.p2pool_enabled);
    const isCpuMiningEnabled = useAppStatusStore((state) => state.cpu_mining_enabled);
    const isGpuMiningEnabled = useAppStatusStore((state) => state.gpu_mining_enabled);
    const [open, setOpen] = useState(false);
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const { reset, handleSubmit, control } = useForm<FormState>({
        defaultValues: { moneroAddress },
        mode: 'onSubmit',
    });
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();
    const miningAllowed = useAppStateStore((s) => s.setupProgress >= 1);
    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const isMining = isCPUMining || isGPUMining;
    const miningLoading = useMiningStore((s) => s.miningLoading);
    const isMiningInProgress = useMiningStore((s) => s.isMiningInProgress);
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
        reset({ moneroAddress });
    };

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        console.info('submitting');
        handleSubmit(
            (data) => {
                invoke('set_monero_address', { moneroAddress: data[FormFields.MONERO_ADDRESS] });
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
                <SeedWords showSeedWords={showSeedWords} seedWords={seedWords} />
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

    const inputsMarkup = (
        <Form onSubmit={onSubmit}>
            <Stack>
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

    const handleCpuMiningEnabled = useCallback(async () => {
        await invoke('set_cpu_mining_enabled', { enabled: !isCpuMiningEnabled });
    }, [isCpuMiningEnabled]);

    const handleGpuMiningEnabled = useCallback(async () => {
        await invoke('set_gpu_mining_enabled', { enabled: !isGpuMiningEnabled });
    }, [isGpuMiningEnabled]);

    const p2pMarkup = (
        <MinerContainer>
            <Stack>
                <Typography variant="h6">{t('pool-mining', { ns: 'settings' })}</Typography>
                <Typography variant="p">{t('pool-mining-description', { ns: 'settings' })}</Typography>
            </Stack>
            <ToggleSwitch
                checked={isP2poolEnabled}
                disabled={isMining || !miningAllowed || miningLoading}
                onChange={handleP2poolEnabled}
            />
        </MinerContainer>
    );

    const toggleDisabledBase = !miningAllowed || miningLoading;
    const cpuDisabled = isMiningInProgress && isCpuMiningEnabled && !isGpuMiningEnabled; // TODO: should we rather stop mining if they both get turned off from settings?
    const gpuDisabled = isMiningInProgress && isGpuMiningEnabled && !isCpuMiningEnabled;

    const cpuEnabledMarkup = (
        <MinerContainer>
            <Typography variant="h6">{t('cpu-mining-enabled', { ns: 'settings' })}</Typography>
            <ToggleSwitch
                checked={isCpuMiningEnabled}
                disabled={toggleDisabledBase || cpuDisabled}
                onChange={handleCpuMiningEnabled}
            />
        </MinerContainer>
    );

    const gpuEnabledMarkup = (
        <MinerContainer>
            <Typography variant="h6">{t('gpu-mining-enabled', { ns: 'settings' })}</Typography>
            <ToggleSwitch
                checked={isGpuMiningEnabled}
                disabled={toggleDisabledBase || gpuDisabled}
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
                    {inputsMarkup}
                    <Divider />
                    {p2pMarkup}
                    <Divider />
                    <HorisontalBox>
                        {cpuEnabledMarkup}
                        {gpuEnabledMarkup}
                    </HorisontalBox>
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
