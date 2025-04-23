export const TariIcon = ({ width, fill = 'black' }: { width?: number | string; fill?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            fill="none"
            viewBox="0 0 14 15"
            style={{ maxHeight: '100%' }}
        >
            <path
                fill={fill}
                d="m12.561 5.22-.001 1.608-9.44-2.429 3.188-2.077 6.253 2.898Zm-5.725 6.764L6.833 6.72l5.034 1.296-5.031 3.967Zm-1.318-.505L2.058 7.6l-.003-2.118 3.458.9.005 5.098ZM.74 4.381v3.726l5.435 6.083 7.692-6.067.01-3.748L6.192.812.74 4.383Z"
            />
        </svg>
    );
};
