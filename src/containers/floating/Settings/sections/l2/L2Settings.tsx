import { useEffect, useId, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { selectL2Account, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import {
    handleL2WalletStateUpdate,
    PIN_CANCELLED_RE,
    resetL2ToL1Seed,
} from '@app/store/actions/l2WalletStoreActions.ts';
import type { L2Account, L2WalletState } from '@app/types/events-payloads.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Input } from '@app/components/elements/inputs/Input';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch';
import { useConfigUIStore } from '@app/store/useAppConfigStore.ts';
import { setL2SideBySide } from '@app/store/actions/appConfigStoreActions.ts';
import { setL2Open } from '@app/store/actions/uiStoreActions.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import SeedWords from '@app/components/wallet/seedwords/SeedWords.tsx';
import { setOotleIndexerUrl } from '@app/store/actions/config/core.ts';
import { CopyToClipboard } from '../wallet/WalletAddressMarkup/WalletAddressMarkup.tsx';
import { CTASArea, InputArea, WalletSettingsGrid } from '../wallet/styles.ts';
import {
    AddressErrorMessage,
    AddressFieldWrapper,
    AddressInput,
    AddressSettingsGroup,
    AddressSettingsGroupContent,
} from '../connections/NodeTypeConfiguration.styles.ts';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';

const fetchL2State = () => invoke<L2WalletState>('l2_get_state').then(handleL2WalletStateUpdate);

function Field({ value, testId }: { value: string; testId: string }) {
    return (
        <WalletSettingsGrid>
            <InputArea>
                <Input type="text" value={value} readOnly style={{ fontSize: 12 }} data-testid={testId} />
            </InputArea>
            <CTASArea>
                <CopyToClipboard text={value} />
            </CTASArea>
        </WalletSettingsGrid>
    );
}

function IndexerField() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const indexerUrl = useConfigCoreStore((s) => s.ootle_indexer_url) ?? '';
    const [input, setInput] = useState(indexerUrl);
    const [error, setError] = useState('');
    const errorId = useId();

    useEffect(() => setInput(indexerUrl), [indexerUrl]);

    async function save() {
        if (input.trim() === indexerUrl) {
            setError('');
            return;
        }
        try {
            await setOotleIndexerUrl(input);
            setError('');
        } catch (e) {
            setError(String(e) || 'validation failed');
        }
    }

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('l2.indexer')}</Typography>
                    </SettingsGroupTitle>
                </SettingsGroupContent>
            </SettingsGroup>
            <AddressSettingsGroup>
                <AddressSettingsGroupContent>
                    <AddressFieldWrapper>
                        <AddressInput
                            name="ootle-indexer-url"
                            type="url"
                            inputMode="url"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="http://localhost:18300"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setError('');
                            }}
                            onBlur={save}
                            onKeyDown={(e) => e.key === 'Enter' && save()}
                            $hasError={Boolean(error)}
                            aria-label={t('l2.indexer')}
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? errorId : undefined}
                            data-testid="l2-settings-indexer"
                        />
                        {error && (
                            <AddressErrorMessage id={errorId} role="alert" data-testid="l2-settings-indexer-error">
                                {t('l2.indexer-error', { reason: error })}
                            </AddressErrorMessage>
                        )}
                    </AddressFieldWrapper>
                </AddressSettingsGroupContent>
            </AddressSettingsGroup>
        </SettingsGroupWrapper>
    );
}

interface ActionBannerProps {
    groupTestId: string;
    descriptionKey: string;
    descriptionStyle?: CSSProperties;
    buttonKey: string;
    buttonTestId: string;
    enabling: boolean;
    error: string;
    onAction: () => void;
}

function L2ActionBanner({ props }: { props: ActionBannerProps }) {
    const { t } = useTranslation('settings', { useSuspense: false });
    return (
        <SettingsGroupWrapper>
            <SettingsGroup data-testid={props.groupTestId}>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('l2.status')}</Typography>
                    </SettingsGroupTitle>
                    <Typography style={props.descriptionStyle}>{t(props.descriptionKey)}</Typography>
                    {props.error && <Typography>{props.error}</Typography>}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Button onClick={props.onAction} disabled={props.enabling} data-testid={props.buttonTestId}>
                        {t(props.buttonKey)}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}

function L2PinRequiredBanner() {
    const { t } = useTranslation('settings', { useSuspense: false });
    return (
        <SettingsGroupWrapper>
            <SettingsGroup data-testid="l2-settings-pin-required">
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('l2.status')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('l2.pin-required')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Button
                        onClick={() => invoke('create_pin').catch((e) => console.error('Failed to create PIN:', e))}
                    >
                        {t('l2.set-pin')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}

interface L2StatusState {
    pinLocked: boolean | undefined;
    enabled: boolean;
    locked: boolean;
    seedChangePending: boolean;
    enabling: boolean;
    error: string;
}

// Renders the L2 activation or unlock banner only once the persisted PIN state is known (`pinLocked !== undefined`).
function L2StatusGroup({
    state,
    onOpen,
}: {
    state: L2StatusState;
    onOpen: (command: 'enable_l2_wallet' | 'unlock_l2_wallet', errorKey: string) => void;
}) {
    const { pinLocked, enabled, locked, seedChangePending, enabling, error } = state;

    if (pinLocked === undefined) {
        return null;
    }
    if (!pinLocked) {
        return <L2PinRequiredBanner />;
    }
    if (seedChangePending) {
        return null;
    }
    if (!enabled) {
        return (
            <L2ActionBanner
                props={{
                    groupTestId: 'l2-settings-not-enabled',
                    descriptionKey: 'l2.enable-description',
                    buttonKey: 'l2.enable',
                    buttonTestId: 'l2-settings-enable',
                    enabling,
                    error,
                    onAction: () => onOpen('enable_l2_wallet', 'l2.enable-error'),
                }}
            />
        );
    }
    if (locked) {
        return (
            <L2ActionBanner
                props={{
                    groupTestId: 'l2-settings-locked',
                    descriptionKey: 'l2.unlock-description',
                    descriptionStyle: { whiteSpace: 'pre-line' },
                    buttonKey: 'l2.unlock',
                    buttonTestId: 'l2-settings-unlock',
                    enabling,
                    error,
                    onAction: () => onOpen('unlock_l2_wallet', 'l2.unlock-error'),
                }}
            />
        );
    }
    return null;
}

function L2AccountFields({ account }: { account: L2Account }) {
    const { t } = useTranslation('settings', { useSuspense: false });
    return (
        <>
            <SettingsGroupWrapper data-testid="l2-settings-account">
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('l2.address')}</Typography>
                        </SettingsGroupTitle>
                        <Typography>{t('l2.address-description')}</Typography>
                    </SettingsGroupContent>
                </SettingsGroup>
                <Field value={account.address} testId="l2-settings-address" />
            </SettingsGroupWrapper>
            <SettingsGroupWrapper $subGroup>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('l2.public-key')}</Typography>
                        </SettingsGroupTitle>
                        <Typography>{t('l2.public-key-description')}</Typography>
                    </SettingsGroupContent>
                </SettingsGroup>
                <Field value={account.public_key} testId="l2-settings-public-key" />
            </SettingsGroupWrapper>
        </>
    );
}

function L2ResetSeedDialog({
    open,
    seedChangePending,
    onOpenChange,
}: {
    open: boolean;
    seedChangePending: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation('settings', { useSuspense: false });
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Stack
                    direction="column"
                    alignItems="center"
                    justifyContent="space-between"
                    style={{ width: 400, height: 120 }}
                >
                    <Typography variant="h3">{t('l2.use-l1-seed')}</Typography>
                    <Typography variant="p" style={{ whiteSpace: 'pre', textAlign: 'center' }}>
                        {t('l2.confirm-replace-copy')}
                    </Typography>
                    {seedChangePending ? (
                        <LoadingDots />
                    ) : (
                        <Stack direction="row" gap={8}>
                            <Button size="small" onClick={() => onOpenChange(false)}>
                                {t('cancel')}
                            </Button>
                            <Button
                                size="small"
                                color="warning"
                                onClick={() => resetL2ToL1Seed().then(() => onOpenChange(false))}
                                data-testid="l2-settings-use-l1-seed-confirm"
                            >
                                {t('yes')}
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

function L2SeedWordsSection({
    seedSource,
    seedChangePending,
}: {
    seedSource: L2WalletState['seed_source'];
    seedChangePending: boolean;
}) {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [confirmReset, setConfirmReset] = useState(false);
    const noteKey = seedSource === 'imported' ? 'l2.seed-note-imported' : 'l2.seed-note-l1';

    return (
        <>
            <SettingsGroupWrapper data-testid="l2-settings-seed-words">
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('l2.seed-words')}</Typography>
                        </SettingsGroupTitle>
                        <Typography data-testid="l2-settings-seed-note">{t(noteKey)}</Typography>
                    </SettingsGroupContent>
                    {seedSource === 'imported' && (
                        <SettingsGroupAction>
                            <Button
                                onClick={() => setConfirmReset(true)}
                                disabled={seedChangePending}
                                data-testid="l2-settings-use-l1-seed"
                            >
                                {t('l2.use-l1-seed')}
                            </Button>
                        </SettingsGroupAction>
                    )}
                </SettingsGroup>
                <SeedWords isL2 />
                {seedChangePending && <LoadingDots />}
            </SettingsGroupWrapper>
            <L2ResetSeedDialog
                open={confirmReset}
                seedChangePending={seedChangePending}
                onOpenChange={setConfirmReset}
            />
        </>
    );
}

const isSeedSectionVisible = (hasPin: boolean, enabled: boolean, locked: boolean, seedChangePending: boolean) =>
    hasPin && ((enabled && !locked) || seedChangePending);

function L2SideBySideGroup() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const sideBySide = useConfigUIStore((s) => s.l2_side_by_side);

    const handleToggle = (checked: boolean) => {
        void setL2SideBySide(checked).then(() => {
            // Turning it off with both cards open leaves the L1 card; a failed
            // write rolls the setting back, so read it rather than the click.
            if (!useConfigUIStore.getState().l2_side_by_side) setL2Open(false);
        });
    };

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('l2.side-by-side')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('l2.side-by-side-description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        data-testid="l2-settings-side-by-side"
                        checked={sideBySide}
                        onChange={({ target }) => handleToggle(target.checked)}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}

function useL2OpenCommand(hasPin: boolean) {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [enabling, setEnabling] = useState(false);
    const [error, setError] = useState('');

    // The panel may never have been opened, so catch up with the backend here too.
    useEffect(() => {
        if (!hasPin) return;
        fetchL2State().catch((e) => console.warn('Could not load L2 wallet state:', e));
    }, [hasPin]);

    async function open(command: 'enable_l2_wallet' | 'unlock_l2_wallet', errorKey: string) {
        setEnabling(true);
        setError('');
        try {
            await invoke(command);
            await fetchL2State();
        } catch (e) {
            if (!PIN_CANCELLED_RE.test(String(e))) setError(`${t(errorKey)}${e}`);
        } finally {
            setEnabling(false);
        }
    }

    return { enabling, error, open };
}

export const L2Settings = () => {
    const pinLocked = useWalletStore((s) => s.is_pin_locked);
    const hasPin = pinLocked === true;
    const enabled = useL2WalletStore((s) => s.enabled);
    const locked = useL2WalletStore((s) => s.locked);
    const account = useL2WalletStore(selectL2Account);
    const seedSource = useL2WalletStore((s) => s.seed_source);
    const seedChangePending = useL2WalletStore((s) => s.seedChangePending);
    const { enabling, error, open } = useL2OpenCommand(hasPin);

    const showAccountFields = hasPin && enabled && Boolean(account);
    const showSeedSection = isSeedSectionVisible(hasPin, enabled, locked, seedChangePending);

    return (
        <>
            <L2StatusGroup
                state={{ pinLocked, enabled, locked, seedChangePending, enabling, error }}
                onOpen={open}
            />
            <L2SideBySideGroup />
            {showAccountFields && account && <L2AccountFields account={account} />}
            <IndexerField />
            {/* An import or reset turns L2 off while the wallet phase restarts, so keep the section up while it runs. */}
            {showSeedSection && <L2SeedWordsSection seedSource={seedSource} seedChangePending={seedChangePending} />}
        </>
    );
};
