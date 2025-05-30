interface Props {
    width?: string | number;
    height?: string | number;
    fill?: string;
    title?: string;
}
export const ChevronSVG = ({ width = '30', height = '30', title = 'Chevron' }: Props) => (
    <svg width={width} height={height} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {title && <title>{title}</title>}
        <path d="M20 13.6667L18.4375 12L15 15.6667L11.5625 12L10 13.6667L15 19L20 13.6667Z" fill="currentColor" />
    </svg>
);
