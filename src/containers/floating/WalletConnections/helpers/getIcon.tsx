import EthereumIcon from '../icons/chains/ethereumIcon';
import { PolygonIcon } from '../icons/chains/polygonIcon';
import { TariIcon } from '../icons/chains/tariIcon';

interface Props {
    simbol: string;
    width?: string | number;
    fill?: string;
}
export const getCurrencyIcon = ({ simbol, width, fill }: Props) => {
    switch (simbol.toLowerCase()) {
        case 'pol':
            return <PolygonIcon width={width} fill={fill} />;
        case 'xtm':
        case 'wxtm':
        case 'dai':
            return <TariIcon size={width} fill={fill} />;
        case 'eth':
        default:
            return <EthereumIcon size={width} fill={fill} />;
    }
};
