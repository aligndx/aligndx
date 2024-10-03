import React from 'react';
import BaseIcon from './base-icon';
import { HiInformationCircle } from 'react-icons/hi';

const InformationCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={HiInformationCircle} {...props} />;
};

export default InformationCircle;
