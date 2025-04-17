interface Props {
    stroke?: string;
    width?: string;
    height?: string;
}

export const CrossIcon = ({ stroke = '#000', width = '9', height = '9' }: Props) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 9 9">
            <path
                stroke={stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.538"
                d="M.818.819 4.08 4.082l3.1 3.1m-6.408.21L7.39.772"
            />
        </svg>
    );
};
