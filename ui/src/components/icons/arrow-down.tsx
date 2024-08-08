import React from 'react';
import { PiArrowDown } from 'react-icons/pi';
import BaseIcon from './base-icon';

const ArrowDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={PiArrowDown} {...props} />;
};

export default ArrowDown;
