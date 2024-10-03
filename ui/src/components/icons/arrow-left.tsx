import React from 'react';
import BaseIcon from './base-icon';
import { TbArrowLeft } from "react-icons/tb";

const ArrowLeft: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbArrowLeft} {...props} />;
};

export default ArrowLeft
