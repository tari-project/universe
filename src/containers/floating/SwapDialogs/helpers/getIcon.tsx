import EthereumIcon from '../icons/chains/ethereumIcon';
import { PolygonIcon } from '../icons/chains/polygonIcon';
import { TariIcon } from '../icons/chains/tariIcon';
import { USDCIcon } from '../icons/chains/usdcIcon';
import { USDTIcon } from '../icons/chains/usdtIcon';

interface Props {
    symbol: string;
    width?: string | number;
    fill?: string;
}
export const getCurrencyIcon = ({ symbol, width, fill }: Props) => {
    switch (symbol.toLowerCase()) {
        case 'pol':
            return <PolygonIcon width={width} fill={fill} />;
        case 'xtm':
        case 'wxtm':
        case 'dai':
            return <TariIcon size={width} fill={fill} />;
        case 'usdc':
            return <USDCIcon width={width} fill={fill} />;
        case 'usdt':
            return <USDTIcon width={width} fill={fill} />;
        case 'eth':
        default:
            return <EthereumIcon size={width} fill={fill} />;
    }
};
