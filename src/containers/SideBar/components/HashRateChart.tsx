import ReactECharts from 'echarts-for-react';
import { useTheme } from '@mui/material/styles';
import { Typography, Stack } from '@mui/material';

interface TooltipParams {
    dataIndex: number;
}

function formatHash(number: number) {
    const suffixes = ['', 'K', 'M', 'G', 'T', 'P'];
    let suffixIndex = 0;
    while (number >= 1000 && suffixIndex < suffixes.length - 1) {
        number /= 1000;
        suffixIndex++;
    }
    return number.toFixed(1) + ' ' + suffixes[suffixIndex] + 'H';
}

const HashRateChartGannt = () => {
    const theme = useTheme();
    const chartHeight = 150;

    const data = [
        { hashRate: 2725148000, blockNo: 8703 },
        { hashRate: 2425148500, blockNo: 8704 },
        { hashRate: 2325149000, blockNo: 8705 },
        { hashRate: 2725149500, blockNo: 8706 },
        { hashRate: 2625150000, blockNo: 8707 },
        { hashRate: 2825150500, blockNo: 8708 },
        { hashRate: 2725151000, blockNo: 8709 },
        { hashRate: 2325151500, blockNo: 8710 },
        { hashRate: 2425152000, blockNo: 8711 },
        { hashRate: 2925152500, blockNo: 8712 },
        { hashRate: 2925153000, blockNo: 8713 },
        { hashRate: 3325153500, blockNo: 8714 },
        { hashRate: 3625154000, blockNo: 8715 },
        { hashRate: 3225154500, blockNo: 8716 },
        { hashRate: 3425155000, blockNo: 8717 },
        { hashRate: 3325155500, blockNo: 8718 },
        { hashRate: 2725156000, blockNo: 8719 },
        { hashRate: 3025156500, blockNo: 8720 },
        { hashRate: 3125157000, blockNo: 8721 },
    ];

    const option = {
        height: chartHeight,
        tooltip: {
            trigger: 'axis',
            formatter: (params: TooltipParams[]) => {
                const { hashRate, blockNo } = data[params[0].dataIndex];
                return `<strong>${formatHash(hashRate)}</strong> at <br />block <strong>${blockNo}</strong>`;
            },
        },
        xAxis: {
            type: 'category',
            data: data?.map((item) => item.blockNo),
            axisLabel: {
                show: false,
            },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: formatHash,
            },
        },
        grid: {
            left: '0',
            right: '0',
            bottom: '20',
            top: '10',
            containLabel: true,
        },
        series: [
            {
                name: 'Hash Rate',
                type: 'line',
                data: data?.map((item) => item.hashRate),
                smooth: false,
                itemStyle: {
                    color: '#F3B927',
                },
            },
        ],
    };

    return (
        <Stack direction="column" spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Network Hash Rate</Typography>
                <Typography variant="body2">
                    <span
                        style={{
                            color: theme.palette.text.primary,
                            fontFamily: 'PoppinsSemiBold',
                        }}
                    >
                        2M
                    </span>{' '}
                    AVG block time
                </Typography>
            </Stack>
            <ReactECharts style={{ height: chartHeight }} option={option} />
        </Stack>
    );
};

export default HashRateChartGannt;
