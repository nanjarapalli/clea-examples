import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

import { DataType } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type DataPoint = {
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
  dataType: DataType;
};

const BarChart: React.FC<ChartProps> = ({ datasets, dataType }) => {
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

  const options = {
    responsive: true,
    scales: {
      units: {
        display: true,
        position: "left" as const,
        ticks: {
          callback: (val: any) => {
            if (dataType === DataType.UNITS) {
              return val + " U";
            }
            if (dataType === DataType.REVENUES) {
              return val + " €";
            }
          },
        },
      },
    },
  };

  return (
    <>
      <Bar options={options} data={data} />
    </>
  );
};

export default BarChart;