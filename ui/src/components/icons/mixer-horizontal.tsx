import React from 'react';
import { PiFadersHorizontal } from 'react-icons/pi';
import BaseIcon from './base-icon';

const MixerHorizontal: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={PiFadersHorizontal} {...props} />;
};

export default MixerHorizontal;
