import React from 'react';
import { TbSun } from "react-icons/tb";
import BaseIcon from './base-icon';

const Sun: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbSun} {...props} />;
};

export default Sun;
