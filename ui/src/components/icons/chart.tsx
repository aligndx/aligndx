import React from 'react';
import BaseIcon from './base-icon';
import { TbChartBar } from "react-icons/tb";

const Chart: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbChartBar} {...props} />;
};

export default Chart