import {
    BackgroundNodeSyncUpdatePayload,
    ConnectedPeersUpdatePayload,
    ConnectionStatusPayload,
    CriticalProblemPayload,
    DetectedAvailableGpuEngines,
    DetectedDevicesPayload,
    NewBlockHeightPayload,
    NodeTypeUpdatePayload,
    ShowReleaseNotesPayload,
    TariAddressUpdatePayload,
} from './events-payloads.ts';
import {
    BaseNodeStatus,
    CpuMinerStatus,
    ExternalDependency,
    GpuMinerStatus,
    NetworkStatus,
    PoolStatus,
    WalletBalance,
} from './app-status.ts';
import { ConfigCore, ConfigMining, ConfigUI, ConfigWallet } from './configs.ts';
import { DisabledPhasesPayload } from '@app/store/actions/setupStoreActions.ts';

export enum SetupPhase {
    Core = 'Core',
    Wallet = 'Wallet',
    Hardware = 'Hardware',
    Node = 'Node',
    Mining = 'Mining',
}

export const BACKEND_STATE_UPDATE = 'backend_state_update';
export type BackendStateUpdateEvent =
    | {
          event_type: 'BaseNodeUpdate';
          payload: BaseNodeStatus;
      }
    | {
          event_type: 'WalletBalanceUpdate';
          payload: WalletBalance;
      }
    | {
          event_type: 'CpuMiningUpdate';
          payload: CpuMinerStatus;
      }
    | {
          event_type: 'GpuMiningUpdate';
          payload: GpuMinerStatus;
      }
    | {
          event_type: 'ConnectedPeersUpdate';
          payload: ConnectedPeersUpdatePayload;
      }
    | {
          event_type: 'NewBlockHeight';
          payload: NewBlockHeightPayload;
      }
    | {
          event_type: 'CloseSplashscreen';
          payload: undefined;
      }
    | {
          event_type: 'DetectedDevices';
          payload: DetectedDevicesPayload;
      }
    | {
          event_type: 'DetectedAvailableGpuEngines';
          payload: DetectedAvailableGpuEngines;
      }
    | {
          event_type: 'CriticalProblem';
          payload: CriticalProblemPayload;
      }
    | {
          event_type: 'MissingApplications';
          payload: ExternalDependency[];
      }
    | {
          event_type: 'StuckOnOrphanChain';
          payload: boolean;
      }
    | {
          event_type: 'ShowReleaseNotes';
          payload: ShowReleaseNotesPayload;
      }
    | {
          event_type: 'NetworkStatus';
          payload: NetworkStatus;
      }
    | {
          event_type: 'CorePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'WalletPhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'HardwarePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'NodePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'MiningPhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'InitialSetupFinished';
          payload: undefined;
      }
    | {
          event_type: 'UnlockApp';
          payload: undefined;
      }
    | {
          event_type: 'UnlockWallet';
          payload: undefined;
      }
    | {
          event_type: 'UnlockCpuMining';
          payload: undefined;
      }
    | {
          event_type: 'UnlockGpuMining';
          payload: undefined;
      }
    | {
          event_type: 'LockWallet';
          payload: undefined;
      }
    | {
          event_type: 'LockGpuMining';
          payload: undefined;
      }
    | {
          event_type: 'LockCpuMining';
          payload: undefined;
      }
    | {
          event_type: 'NodeTypeUpdate';
          payload: NodeTypeUpdatePayload;
      }
    | {
          event_type: 'ConfigCoreLoaded';
          payload: ConfigCore;
      }
    | {
          event_type: 'ConfigUILoaded';
          payload: ConfigUI;
      }
    | {
          event_type: 'ConfigWalletLoaded';
          payload: ConfigWallet;
      }
    | {
          event_type: 'ConfigMiningLoaded';
          payload: ConfigMining;
      }
    | {
          event_type: 'RestartingPhases';
          payload: SetupPhase[];
      }
    | {
          event_type: 'AskForRestart';
          payload: undefined;
      }
    | {
          event_type: 'BackgroundNodeSyncUpdate';
          payload: BackgroundNodeSyncUpdatePayload;
      }
    | {
          event_type: 'InitWalletScanningProgress';
          payload: {
              scanned_height: number;
              total_height: number;
              progress: number;
          };
      }
    | {
          event_type: 'ConnectionStatus';
          payload: ConnectionStatusPayload;
      }
    | {
          event_type: 'ShowStageSecurityModal';
          payload: undefined;
      }
    | {
          event_type: 'MiningTime';
          payload: number;
      }
    | {
          event_type: 'PoolStatusUpdate';
          payload: PoolStatus;
      }
    | {
          event_type: 'ExchangeIdChanged';
          payload: string;
      }
    | {
          event_type: 'DisabledPhases';
          payload: DisabledPhasesPayload;
      }
    | {
          event_type: 'ExternalTariAddressChanged';
          payload?: TariAddressUpdatePayload;
      }
    | {
          event_type: 'BaseTariAddressChanged';
          payload: TariAddressUpdatePayload;
      }
    | {
          event_type: 'ShouldShowExchangeMinerModal';
          payload: undefined;
      };
