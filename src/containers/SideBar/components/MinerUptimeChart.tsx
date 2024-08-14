import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@mui/material/styles';
import { Typography, Stack } from '@mui/material';

const MinerUptimeChart: React.FC = () => {
    const theme = useTheme();
    const chartHeight = 25;

    const uptime = [
        { status: 'on', time: '00:00:00' },
        { status: 'off', time: '01:00:00' },
        { status: 'off', time: '02:00:00' },
        { status: 'on', time: '03:00:00' },
        { status: 'on', time: '04:00:00' },
        { status: 'off', time: '05:00:00' },
        { status: 'on', time: '06:00:00' },
        { status: 'on', time: '07:00:00' },
        { status: 'on', time: '08:00:00' },
        { status: 'off', time: '09:00:00' },
        { status: 'on', time: '10:00:00' },
        { status: 'off', time: '11:00:00' },
        { status: 'on', time: '12:00:00' },
        { status: 'on', time: '13:00:00' },
        { status: 'on', time: '14:00:00' },
        { status: 'off', time: '15:00:00' },
        { status: 'on', time: '16:00:00' },
        { status: 'off', time: '17:00:00' },
        { status: 'on', time: '18:00:00' },
        { status: 'on', time: '19:00:00' },
        { status: 'off', time: '20:00:00' },
        { status: 'off', time: '21:00:00' },
        { status: 'on', time: '22:00:00' },
        { status: 'off', time: '23:00:00' },
    ];

    const data = uptime.map(({ status }) => ({
        value: 1,
        itemStyle: {
            color:
                status === 'on'
                    ? theme.palette.success.main
                    : theme.palette.divider,
        },
    }));

    const option = {
        height: chartHeight,
        xAxis: {
            type: 'category',
            data: uptime.map((_, index) => index + 1),
            show: false,
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 1,
            show: false,
        },
        series: [
            {
                data: data,
                type: 'bar',
                itemStyle: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    color: (params: any) =>
                        params.value === 'on'
                            ? theme.palette.success.main
                            : theme.palette.divider,
                    borderRadius: 3,
                },
            },
        ],
        grid: {
            left: '0',
            right: '0',
            bottom: '0',
            top: '0',
            containLabel: false,
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
                const { status, time } = uptime[params[0].dataIndex];
                const color =
                    status === 'on'
                        ? theme.palette.success.main
                        : theme.palette.divider;
                return `<span style="color: ${color};">&#9679;</span> <strong>${status === 'on' ? 'Online' : 'Offline'}</strong> <br />at ${time}`;
            },
        },
    };

    return (
        <Stack direction="column" spacing={0.5}>
            <Typography variant="body2">24h Miner Uptime</Typography>
            <ReactECharts style={{ height: chartHeight }} option={option} />
        </Stack>
    );
};

export default MinerUptimeChart;
