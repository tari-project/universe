import EthereumIcon from '../icons/chains/ethereumIcon';
import { PolygonIcon } from '../icons/chains/polygonIcon';
import { TariIcon } from '../icons/chains/tariIcon';

interface Props {
    simbol: string;
    width?: string | number;
    fill?: string;
}
export const getIcon = ({ simbol, width, fill }: Props) => {
    switch (simbol.toLowerCase()) {
        case 'eth':
            return <EthereumIcon width={width} fill={fill} />;
        case 'pol':
            return <PolygonIcon width={width} fill={fill} />;
        case 'xtm':
            return <TariIcon width={width} fill={fill} />;
        default:
            return null;
    }
};
