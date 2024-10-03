import React from 'react';
import { TbMenu2 } from "react-icons/tb";
import BaseIcon from './base-icon';

const Menu: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={TbMenu2} {...props} />;
};

export default Menu;
