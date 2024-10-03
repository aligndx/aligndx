import React from 'react';
import { TbUpload } from "react-icons/tb";
import BaseIcon from './base-icon';

const Upload: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbUpload} {...props} />;
};

export default Upload;
