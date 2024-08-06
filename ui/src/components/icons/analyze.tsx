import React from 'react';
import BaseIcon from './base-icon';
import { TbAnalyze } from "react-icons/tb";

const Analyze: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbAnalyze} {...props} />;
};

export default Analyze
