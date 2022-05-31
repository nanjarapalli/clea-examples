import React from "react";

import Card from "./common/Card";

import "./AirMeasurementCard.css";

const getClassName = (value: number, thresholds: any): string => {
  if (value < thresholds.warning) {
    return "value mb-0 mt-3";
  } else if (value <= thresholds.danger) {
    return "value mb-0 mt-3 text-warning";
  } else {
    return "value mb-0 mt-3 text-danger";
  }
};

type AirMeasurementCardProps = {
  title: string;
  unit: string;
  value: number;
  thresholds?: {
    warning: number;
    danger: number;
  };
  className?: string;
};

const AirMeasurementCard: React.FC<AirMeasurementCardProps> = ({ title, unit, value, thresholds, className }) => {
  if (thresholds) {
    return (
      <Card className={className}>
        <div className="d-flex">
          <p className="title">{title}</p>
          <p className="unit ms-auto">{unit}</p>
        </div>
        <p className={getClassName(value, thresholds)}>{value.toFixed(2)}</p>
      </Card>
    );
  } else {
    return (
      <Card className={className}>
        <div className="d-flex">
          <p className="title">{title}</p>
          <p className="unit ms-auto">{unit}</p>
        </div>
        <p className="value mb-0 mt-3">{value.toFixed(2)}</p>
      </Card>
    );
  }
};

export default AirMeasurementCard;
