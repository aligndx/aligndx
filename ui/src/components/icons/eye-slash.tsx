import React from 'react';
import { PiEyeSlash } from 'react-icons/pi';
import BaseIcon from './base-icon';

const EyeSlash: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={PiEyeSlash} {...props} />;
};

export default EyeSlash;
