import React from 'react';
import { PiArrowUp } from 'react-icons/pi';
import BaseIcon from './base-icon';

const ArrowUp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={PiArrowUp} {...props} />;
};

export default ArrowUp;
