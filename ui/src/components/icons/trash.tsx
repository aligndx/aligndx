import React from 'react';
import { TbTrash } from "react-icons/tb";
import BaseIcon from './base-icon';

const Trash: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbTrash} {...props} />;
};

export default Trash;
