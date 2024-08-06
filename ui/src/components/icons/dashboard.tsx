import React from 'react';
import BaseIcon from './base-icon';
import { MdDashboard } from 'react-icons/md';

const DashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return <BaseIcon IconComponent={MdDashboard} {...props} />;
};

export default DashboardIcon
