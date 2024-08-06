import React from 'react';
import { TbMoon } from "react-icons/tb";
import BaseIcon from './base-icon';

const Moon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbMoon} {...props} />;
};

export default Moon;
