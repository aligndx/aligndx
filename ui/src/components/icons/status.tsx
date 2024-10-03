import React from 'react';
import BaseIcon from './base-icon';
import { HiOutlineStatusOnline } from "react-icons/hi";

const Status: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={HiOutlineStatusOnline} {...props} />;
};

export default Status
