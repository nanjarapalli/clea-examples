import React, { FunctionComponent } from "react";
//@ts-ignore
import ProgressBar from "react-customizable-progressbar";

interface ProgressBarProps {
  title: string;
  progress: number;
}

const ProgressBarBasic: FunctionComponent<ProgressBarProps> = ({
  title,
  progress,
}) => (
  <ProgressBar
    radius={100}
    progress={progress}
    strokeWidth={18}
    strokeColor="#5d9cec"
    strokeLinecap="round"
    trackStrokeWidth={18}
    initialAnimation={true}
    transition="1.5s ease 0.5s"
    trackTransition="0s ease"
  >
    <div className="indicator">
      <div>{progress}%</div>
    </div>
  </ProgressBar>
);

export default ProgressBarBasic;
