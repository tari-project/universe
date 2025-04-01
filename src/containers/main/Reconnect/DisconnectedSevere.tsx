import { Typography } from '@app/components/elements/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';

const DisconnectedSevere: React.FC = () => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    return (
        <div className="buttons-container">
            <Typography variant="h1">{t('disconnect-severe-title')}</Typography>
            <Typography variant="h2">{t('disconnect-severe-subtitle')}</Typography>
            <div className="buttons-wrapper">
                <button className="primary-button" onClick={() => console.info('Clicked primary button')}>
                    {t('auto-reconnect')}
                </button>
                <button className="secondary-button" onClick={() => console.info('Clicked reconnect button')}>
                    {t('connect-now')}
                </button>
                <button className="secondary-button" onClick={() => console.info('Clicked secondary button')}>
                    {t('restart-app')}
                </button>
                <button className="secondary-button" onClick={() => console.info('Clicked secondary button')}>
                    {t('go-to-telegram')}
                </button>
            </div>
        </div>
    );
};

export default DisconnectedSevere;
