export const componentSettings = {
    shape: {
        borderRadius: {
            app: '10px',
            dialog: '20px',
            button: '30px',
            buttonBase: '50px',
            buttonSquared: '10px',
        },
    },
    typography: {
        fontFamily: '"Poppins", sans-serif',
        fontSize: '16px',
        fontWeight: 400,
        span: {
            lineHeight: 1.1,
            letterSpacing: '-0.1px',
            fontWeight: 'inherit',
        },
        p: {
            fontSize: '12px',
            lineHeight: 1.1,
            letterSpacing: '-0.1px',
            fontWeight: 400,
        },
        h1: {
            fontSize: '30px',
            lineHeight: 1.6,
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-0.4px',
            fontWeight: 600,
        },
        h2: {
            fontSize: '26px',
            lineHeight: 1.4,
            fontWeight: 600,
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-1.2px',
        },
        h3: {
            fontSize: '24px',
            lineHeight: 1.05,
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-0.5px',
            fontWeight: 600,
        },
        h4: {
            fontSize: '20px',
            lineHeight: 1.3,
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 600,
            letterSpacing: '-1.6px',
        },
        h5: {
            fontSize: '16px',
            lineHeight: 1.05,
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-0.4px',
            fontWeight: 600,
        },
        h6: {
            fontSize: '14px',
            lineHeight: 1.6,
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-0.4px',
            fontWeight: 500,
        },
    },
};

export type ThemeComponents = typeof componentSettings;
