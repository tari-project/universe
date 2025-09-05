/* eslint-disable i18next/no-literal-string */
import { AdminButton, ButtonGroup, CategoryLabel, ExtraContent } from '../styles';

import {
    setMininimumMiningTimeMs,
    setShowCloseDialog,
    setShowLongTimeDialog,
    useUserFeedbackStore,
} from '@app/store/stores/userFeedbackStore.ts';
import { useState } from 'react';

export function FeedbackGroup() {
    const longMiningTimeMs = useUserFeedbackStore((s) => s.longMiningTimeMs);
    const closeMiningTimeMs = useUserFeedbackStore((s) => s.closeMiningTimeMs);
    const showCloseDialog = useUserFeedbackStore((s) => s.showCloseDialog);
    const showLongTimeDialog = useUserFeedbackStore((s) => s.showLongTimeDialog);
    const [closeMin, setCloseMin] = useState(closeMiningTimeMs / 1000 / 60 / 60);
    const [longMin, setLongMin] = useState(longMiningTimeMs / 1000 / 60 / 60);

    return (
        <>
            <CategoryLabel>Feedback</CategoryLabel>
            <ButtonGroup>
                <AdminButton onClick={() => setShowCloseDialog(!showCloseDialog)} $isActive={showCloseDialog}>
                    Close Survey
                </AdminButton>
                <AdminButton onClick={() => setShowLongTimeDialog(!showLongTimeDialog)} $isActive={showLongTimeDialog}>
                    Long time Miner Survey
                </AdminButton>
            </ButtonGroup>
            <ExtraContent>
                <label>
                    CLOSE min time (minutes)
                    <input
                        name="close"
                        type="number"
                        value={closeMin}
                        onChange={(e) => {
                            let value = Number(e.target.value);
                            if (isNaN(value)) {
                                value = 1;
                            } else {
                                setCloseMin(value);
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setMininimumMiningTimeMs('closeMiningTimeMs', closeMin * 1000 * 60 * 60);
                        }}
                    >
                        save
                    </button>
                </label>

                <label>
                    LONG min time (minutes)
                    <input
                        name="long"
                        type="number"
                        value={longMin}
                        onChange={(e) => {
                            let value = Number(e.target.value);
                            if (isNaN(value)) {
                                value = 1;
                            } else {
                                setLongMin(value);
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setMininimumMiningTimeMs('longMiningTimeMs', longMin * 1000 * 60 * 60);
                        }}
                    >
                        save
                    </button>
                </label>
            </ExtraContent>
        </>
    );
}
