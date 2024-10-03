import React from 'react';
import { VscClose } from "react-icons/vsc";
import BaseIcon from './base-icon';

const X: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={VscClose} {...props} />;
};

export default X;
