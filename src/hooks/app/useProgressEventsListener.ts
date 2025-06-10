import {
    updateCoreSetupPhaseInfo,
    updateHardwareSetupPhaseInfo,
    updateNodeSetupPhaseInfo,
    updateMiningSetupPhaseInfo,
    updateWalletSetupPhaseInfo,
} from '@app/store/actions/setupStoreActions';
import { PhaseTitle } from '@app/store/useSetupStore';
import { deepEqual } from '@app/utils/objectDeepEqual';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useRef } from 'react';

export const PROGRESS_STATE_UPDATE = 'progress_tracker_update';

export interface ProgressTrackerUpdatePayload {
    phase_title: PhaseTitle;
    title: string;
    progress: number;
    title_params: Record<string, string>;
    is_complete: boolean;
}

export type ProgressStateUpdateEvent =
    | {
          event_type: 'Core';
          payload: ProgressTrackerUpdatePayload;
      }
    | {
          event_type: 'Node';
          payload: ProgressTrackerUpdatePayload;
      }
    | {
          event_type: 'Hardware';
          payload: ProgressTrackerUpdatePayload;
      }
    | {
          event_type: 'Mining';
          payload: ProgressTrackerUpdatePayload;
      }
    | {
          event_type: 'Wallet';
          payload: ProgressTrackerUpdatePayload;
      };

// const LOG_EVENT_TYPES = ['Core', 'Node', 'Wallet', 'Hardware', 'Mining'];
const LOG_EVENT_TYPES = [''];

export const useProgressEventsListener = () => {
    const eventRef = useRef<ProgressStateUpdateEvent | null>(null);
    function handleLogUpdate(newEvent: ProgressStateUpdateEvent) {
        if (LOG_EVENT_TYPES.includes(newEvent.event_type)) {
            const isEqual = deepEqual(eventRef.current, newEvent);
            if (!isEqual) {
                console.info(newEvent.event_type, newEvent.payload);
                eventRef.current = newEvent;
            }
        }
    }

    useEffect(() => {
        const unlisten = listen(
            PROGRESS_STATE_UPDATE,
            async ({ payload: event }: { payload: ProgressStateUpdateEvent }) => {
                handleLogUpdate(event);
                switch (event.event_type) {
                    case 'Core':
                        updateCoreSetupPhaseInfo(event.payload);
                        break;
                    case 'Node':
                        updateNodeSetupPhaseInfo(event.payload);
                        break;
                    case 'Hardware':
                        updateHardwareSetupPhaseInfo(event.payload);
                        break;
                    case 'Mining':
                        updateMiningSetupPhaseInfo(event.payload);
                        break;
                    case 'Wallet':
                        updateWalletSetupPhaseInfo(event.payload);
                        break;
                    default:
                        break;
                }
            }
        );
        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);
};
