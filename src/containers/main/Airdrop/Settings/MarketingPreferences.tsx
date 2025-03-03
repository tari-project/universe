import CheckboxButton from '@app/components/elements/inputs/CheckboxButton';
import { Typography } from '@app/components/elements/Typography';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';
import { useAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

enum EventSubscriptionType {
    Status = 'status',
    Updates = 'updates',
    Rewards = 'rewards',
}

enum EventSubscriptionChannel {
    Email = 'email',
    Push = 'push',
}

interface MarketingEvent {
    eventType: EventSubscriptionType;
    channel: EventSubscriptionChannel;
}

interface Subscription extends MarketingEvent {
    subscribed: boolean;
}

interface MarketingPreferences {
    emailEvents?: Subscription[];
    pushNotificationEvents?: Subscription[];
}

interface UpdateMarketingPreferencesPayload {
    subscribe?: MarketingEvent[];
    unsubscribe?: MarketingEvent[];
}

const useGetMarketingPreferences = () => {
    const [marketingPreferences, setMarketingPreferences] = useState<MarketingPreferences>();
    const [isFetching, setIsFetching] = useState(false);
    const handleRequest = useAirdropRequest();

    const fetchMarketingPreferences = useCallback(async () => {
        setIsFetching(true);
        const abortController = new AbortController();
        const signal = abortController.signal;
        await handleRequest<MarketingPreferences>({
            path: '/miner/events',
            method: 'GET',
            signal,
        }).then((res) => {
            setMarketingPreferences(res);
        });
        setIsFetching(false);
        return () => {
            abortController.abort();
            setIsFetching(false);
        };
    }, [handleRequest]);

    useEffect(() => {
        if (!marketingPreferences && !isFetching) fetchMarketingPreferences();
    }, [fetchMarketingPreferences, isFetching, marketingPreferences]);

    return { marketingPreferences, fetchPreferences: fetchMarketingPreferences, isFetching, setMarketingPreferences };
};

const useUpdateMarketingPreferences = () => {
    const handleRequest = useAirdropRequest();

    return useCallback(
        (body: UpdateMarketingPreferencesPayload) => {
            const abortController = new AbortController();
            const signal = abortController.signal;
            return handleRequest<MarketingPreferences>({
                path: '/miner/events',
                method: 'POST',
                body: { ...body },
                signal,
            });
        },
        [handleRequest]
    );
};

export default function AirdropMarketingPreferences() {
    const { t } = useTranslation('airdrop', { useSuspense: false });
    const {
        marketingPreferences: preferences,
        fetchPreferences,
        setMarketingPreferences,
    } = useGetMarketingPreferences();

    const hendleUpdatePreferences = useUpdateMarketingPreferences();

    const updatePreferences = useCallback(
        (preferences: MarketingPreferences) => {
            if (!preferences.emailEvents) return;
            const subscribe = preferences.emailEvents.filter((event) => event.subscribed);
            const unsubscribe = preferences.emailEvents.filter((event) => !event.subscribed);
            return hendleUpdatePreferences({
                subscribe,
                unsubscribe,
            }).finally(fetchPreferences);
        },
        [hendleUpdatePreferences, fetchPreferences]
    );

    const togglePreference = useCallback(
        (event) => {
            const { name } = event.target;
            if (!preferences?.emailEvents) return;
            const emailEvents = [...preferences.emailEvents];
            for (const event of emailEvents) {
                if (event.eventType === name) {
                    event.subscribed = !event.subscribed;
                }
            }

            const newPreferences = { ...preferences, emailEvents };
            setMarketingPreferences(newPreferences);
            updatePreferences(newPreferences);
        },
        [preferences, setMarketingPreferences, updatePreferences]
    );

    const isChecked = (type: EventSubscriptionType) => {
        return preferences?.emailEvents?.some((event) => event.eventType === type && event.subscribed);
    };

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('marketingPreferences')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent>
                    <CheckboxButton
                        label={t('preferences.status')}
                        name={EventSubscriptionType.Status}
                        description={t('preferences.statusDescription')}
                        onChange={togglePreference}
                        checked={isChecked(EventSubscriptionType.Status)}
                    />
                    <CheckboxButton
                        label={t('preferences.updates')}
                        name={EventSubscriptionType.Updates}
                        description={t('preferences.updatesDescription')}
                        onChange={togglePreference}
                        checked={isChecked(EventSubscriptionType.Updates)}
                    />
                    <CheckboxButton
                        label={t('preferences.rewards')}
                        name={EventSubscriptionType.Rewards}
                        description={t('preferences.rewardsDescription')}
                        onChange={togglePreference}
                        checked={isChecked(EventSubscriptionType.Rewards)}
                    />
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
