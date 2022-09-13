import React from "react";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ChartDataLabels);   // FIXME


export type DataPoint = {
    label: string;
    value: number;
};
export type Dataset = {
    name: string;
    color: string;
    points: DataPoint[];
};
type ChartProps = {
    datasets: Dataset[];
    measure?: string;
    legend?: boolean;
};


const LineChart: React.FC<ChartProps> = ( { datasets, measure="", legend=true } ) => {
    
    console.log (datasets)
    console.log ("Displaying previously printed data..\n\n\n")

    const labels = datasets[0].points.map((point) => point.label);
    const data = {
        labels,
        datasets: datasets.map((dataset) => {
        return {
            label: dataset.name,
            backgroundColor: dataset.color,
            data: dataset.points.map((point) => point.value),
        };
        }),
    };

    const line_options = {
        responsive: true,
        plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Chart.js Line Chart'
        }
        }
    }

    const DATA_COUNT = 7;
    const NUMBER_CFG = {count: DATA_COUNT, min: -100, max: 100};

    const line_labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const line_data = {
        labels: line_labels,
        datasets: [
            {
                label: 'Dataset 1',
                data: [10, 20, 10, 40, 50, 32, -1],
                borderColor: 'red',
                backgroundColor: 'yellow',
            },
            {
                label: 'Dataset 2',
                data: [-1, 25, 30, 10, 48, 20, -5],
                borderColor: 'blue',
                backgroundColor: 'green',
            }
        ]
    };

    const options: any = {
        responsive: true,
        plugins: {
            legend: {
              display: legend
            },
            datalabels: {
              display: true,
              color: "black",
              align: "end",
              anchor: "end",
              clamp: true,
              clip: false,
              padding: {
                right: 2
              },
              labels: {
                padding: { top: 10 },
                title: {
                  font: {
                    weight: "bold"
                  }
                },
                value: {
                  color: "green"
                }
              },
              formatter: function (value: string) {
                return "\n" + value;
              }
            }
        },
        scales: {
            units: {
                display: true,
                grace: '10%',
                position: "left" as const,
                ticks: {
                  callback: (val: any) => {
                    return val + measure;
                  },
                },
            },
        }
      };

    return (
        <>
            <Line data={line_data} />
        </>
    )
}

export default LineChart