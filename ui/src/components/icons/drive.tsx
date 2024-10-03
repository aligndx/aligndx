import React from 'react';
import { PiHardDrive } from 'react-icons/pi';
import BaseIcon from './base-icon';

const Drive: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={PiHardDrive} {...props} />;
};

export default Drive;
