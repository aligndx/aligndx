import React from 'react';
import { PiEyeClosed } from 'react-icons/pi';
import BaseIcon from './base-icon';

const EyeClosed: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={PiEyeClosed} {...props} />;
};

export default EyeClosed;
