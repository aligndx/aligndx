import React from 'react';
import BaseIcon from './base-icon';
import { TbArrowRight } from "react-icons/tb";

const ArrowRight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbArrowRight} {...props} />;
};

export default ArrowRight
