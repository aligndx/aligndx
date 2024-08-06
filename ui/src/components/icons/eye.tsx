import React from 'react';
import { PiEye } from 'react-icons/pi';
import BaseIcon from './base-icon';

const Eye: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={PiEye} {...props} />;
};

export default Eye;
