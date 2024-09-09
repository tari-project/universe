import React, { useCallback, useState } from 'react';

import {
    IoSettingsOutline,
    IoCopyOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoCheckmarkOutline,
    IoClose,
} from 'react-icons/io5';
import { useGetSeedWords } from '../../../../hooks/useGetSeedWords';

import { invoke } from '@tauri-apps/api/tauri';

import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import VisualMode from '../../../Dashboard/components/VisualMode';
import { CardContainer, Form, HorisontalBox } from './Settings.styles';

import { useForm } from 'react-hook-form';
import ConnectButton from '@app/containers/Airdrop/components/ConnectButton/ConnectButton.tsx';

import { Button, IconButton } from '@app/components/elements/Button.tsx';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
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
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';

import { ControlledMoneroAddressInput } from '@app/components/MoneroAddressInput';
import { ResetSettingsButton } from '@app/containers/SideBar/components/Settings/ResetSettingsButton.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';
import { SeedWords } from './SeedWords';
import { CardComponent } from '@app/containers/SideBar/components/Settings/Card.component.tsx';

enum FormFields {
    MONERO_ADDRESS = 'moneroAddress',
}

interface FormState {
    [FormFields.MONERO_ADDRESS]: string;
}

export default function Settings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    const { moneroAddress, walletAddress, isCpuMiningEnabled, isGpuMiningEnabled, isP2poolEnabled, p2poolStats } =
        useAppStatusStore(
            useShallow((s) => ({
                moneroAddress: s.monero_address,
                walletAddress: s.tari_address,
                isCpuMiningEnabled: s.cpu_mining_enabled,
                isGpuMiningEnabled: s.gpu_mining_enabled,
                isP2poolEnabled: s.p2pool_enabled,
                p2poolStats: s.p2pool_stats,
            }))
        );

    // p2pool
    const p2poolSha3Stats = p2poolStats?.sha3;
    const p2poolRandomXStats = p2poolStats?.randomx;
    const p2poolTribe = p2poolSha3Stats?.tribe?.name;
    const p2poolSha3MinersCount = p2poolSha3Stats?.num_of_miners;
    const p2poolRandomxMinersCount = p2poolRandomXStats?.num_of_miners;
    const p2poolSha3HashRate = p2poolSha3Stats?.pool_hash_rate;
    const p2poolRandomxHashRate = p2poolRandomXStats?.pool_hash_rate;
    const p2poolSha3TotalEarnings = p2poolSha3Stats?.pool_total_earnings;
    const p2poolRandomxTotalEarnings = p2poolRandomXStats?.pool_total_earnings;
    const p2poolSha3ChainTip = p2poolSha3Stats?.share_chain_height;
    const p2poolRandomxChainTip = p2poolRandomXStats?.share_chain_height;
    const p2poolSha3UserTotalEarnings = walletAddress ? p2poolSha3Stats?.total_earnings[walletAddress] : 0;
    const p2poolRandomxUserTotalEarnings = walletAddress ? p2poolRandomXStats?.total_earnings[walletAddress] : 0;
    const p2poolUserTotalEarnings =
        p2poolSha3UserTotalEarnings && p2poolRandomxUserTotalEarnings
            ? p2poolSha3UserTotalEarnings + p2poolRandomxUserTotalEarnings
            : 0;

    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const [isCopyTooltipHiddenWalletAddress, setIsCopyTooltipHiddenWalletAddress] = useState(true);
    const { reset, handleSubmit, control } = useForm<FormState>({
        defaultValues: { moneroAddress },
        mode: 'onSubmit',
    });
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();
    const miningAllowed = useAppStateStore(useShallow((s) => s.setupProgress >= 1));
    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const isMiningInProgress = isCPUMining || isGPUMining;
    const miningInitiated = useMiningStore(useShallow((s) => s.miningInitiated));
    const miningLoading = (miningInitiated && !isMiningInProgress) || (!miningInitiated && isMiningInProgress);
    const [open, setOpen] = useState(false);

    const handleClose = () => {
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

    const copyWalletAddress = async () => {
        setIsCopyTooltipHiddenWalletAddress(false);
        await navigator.clipboard.writeText(walletAddress + '');
        setTimeout(() => setIsCopyTooltipHiddenWalletAddress(true), 1000);
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

    const walletAddressMarkup = walletAddress ? (
        <>
            <Divider />
            <Stack>
                <Stack direction="row" justifyContent="space-between" style={{ height: 40 }}>
                    <Typography variant="h6">Tari Wallet Address</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="p">{walletAddress}</Typography>
                    <IconButton onClick={copyWalletAddress}>
                        {isCopyTooltipHiddenWalletAddress ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                    </IconButton>
                </Stack>
            </Stack>
        </>
    ) : null;

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
                disabled={isMiningInProgress || !miningAllowed || miningLoading}
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

    const p2poolStatsMarkup = (
        <>
            <Divider />
            <MinerContainer>
                <HorisontalBox>
                    <Typography variant="h6">{t('p2pool-stats', { ns: 'settings' })}</Typography>
                </HorisontalBox>
                <CardContainer>
                    <CardComponent
                        heading={`${t('tribe', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'Current',
                                labelValue: p2poolTribe ? p2poolTribe : '',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('miners', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: '' + p2poolSha3MinersCount,
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: '' + p2poolRandomxMinersCount,
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-hash-rate', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: (p2poolSha3HashRate ? p2poolSha3HashRate : 0) + ' H/s',
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: (p2poolRandomxHashRate ? p2poolRandomxHashRate : 0) + ' H/s',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-total-earnings', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: (p2poolSha3TotalEarnings ? p2poolSha3TotalEarnings : 0) + ' tXTM',
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: (p2poolRandomxTotalEarnings ? p2poolRandomxTotalEarnings : 0) + ' tXTM',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-chain-tip', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: '#' + p2poolSha3ChainTip,
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: '#' + p2poolRandomxChainTip,
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-user-total-earnings', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: (p2poolSha3UserTotalEarnings ? p2poolSha3UserTotalEarnings : 0) + ' tXTM',
                            },
                            {
                                labelText: 'RandomX',
                                labelValue:
                                    (p2poolRandomxUserTotalEarnings ? p2poolRandomxUserTotalEarnings : 0) + ' tXTM',
                            },
                            {
                                labelText: 'Total',
                                labelValue: p2poolUserTotalEarnings + ' tXTM',
                            },
                        ]}
                    />
                </CardContainer>
            </MinerContainer>
        </>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <IconButton onClick={() => setOpen(true)}>
                <IoSettingsOutline size={16} />
            </IconButton>
            <DialogContent>
                <Stack style={{ minWidth: 600 }}>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="h4">Settings</Typography>
                        <IconButton onClick={() => setOpen(false)}>
                            <IoClose />
                        </IconButton>
                    </Stack>
                    {walletAddressMarkup}
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
                    {p2poolStatsMarkup}
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
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
