import { useMutation } from '@tanstack/react-query';
import { platform } from '@tauri-apps/plugin-os';
import { isMainNet } from '@app/utils/network.ts';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { SubmitSurveyRequest, SubmitSurveyResponse } from '@app/types/user/surveys.ts';
import {
    useAirdropStore,
    useConfigCoreStore,
    useConfigMiningStore,
    useConfigPoolsStore,
    useMiningMetricsStore,
} from '@app/store';
import { GpuDevice } from '@app/types/app-status.ts';

const universeVersion = import.meta.env.VITE_TARI_UNIVERSE_VERSION;
interface Args {
    slug: string;
    feedbackBody: SubmitSurveyRequest;
}

async function postFeedback({ slug, feedbackBody }: Args) {
    return await handleAirdropRequest<SubmitSurveyResponse, SubmitSurveyRequest>({
        path: `/survey/${slug}/response`,
        method: 'POST',
        publicRequest: true,
        body: feedbackBody,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

const gpusFormatted = (gpus: GpuDevice[]) =>
    gpus
        .map((g) =>
            Object.entries(g)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' | ')
        )
        .join(' -');

function useFeedbackMetadata() {
    const network = isMainNet() ? 'mainnet' : 'testnet';
    const operatingSystem = platform();
    const appId = useConfigCoreStore((s) => s.anon_id);
    const node_type = useConfigCoreStore((s) => s.node_type);
    const exchange_id = useConfigCoreStore((s) => s.exchange_id);
    const userId = useAirdropStore((s) => s.userDetails?.user.id);
    const gpus = useMiningMetricsStore((s) => s.gpu_devices);
    const miningMode = useConfigMiningStore((s) => s.getSelectedMiningMode());
    const gpu_pool_enabled = useConfigPoolsStore((s) => s.gpu_pool_enabled);
    const cpu_pool_enabled = useConfigPoolsStore((s) => s.cpu_pool_enabled);
    const selected_cpu_pool = useConfigPoolsStore((s) => s.selected_cpu_pool);
    const selected_gpu_pool = useConfigPoolsStore((s) => s.selected_gpu_pool);

    const gpuData = gpusFormatted(gpus);

    const extraData = {
        node_type,
        exchange_id,
        gpu_pool_enabled,
        cpu_pool_enabled,
        selected_cpu_pool,
        selected_gpu_pool,
        gpuData,
    };

    return {
        appId,
        userId,
        universeVersion,
        mode: miningMode?.mode_name,
        operatingSystem,
        network,
        extraData,
    };
}
export function useSendFeedback() {
    const metadata = useFeedbackMetadata();
    return useMutation({
        mutationFn: ({ slug, feedbackBody }: Args) =>
            postFeedback({ slug, feedbackBody: { ...feedbackBody, metadata } }),
    });
}
