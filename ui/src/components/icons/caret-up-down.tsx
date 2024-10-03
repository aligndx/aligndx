import React from 'react';
import { PiCaretUpDown } from 'react-icons/pi';
import BaseIcon from './base-icon';

const CaretUpDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={PiCaretUpDown} {...props} />;
};

export default CaretUpDown;
