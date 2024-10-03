import React from 'react';
import BaseIcon from './base-icon';
import { TbBell } from "react-icons/tb";

const Bell: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbBell} {...props} />;
};

export default Bell
