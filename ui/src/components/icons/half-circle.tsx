import React from 'react';
import { TbCircleHalf } from "react-icons/tb";
import BaseIcon from './base-icon';

const HalfCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbCircleHalf} {...props} />;
};

export default HalfCircle;
