import { cn } from '@/lib/utils';
import React from 'react';

const sharedStyles = 'h-5 w-5';

interface BaseIconProps extends React.SVGProps<SVGSVGElement> {
  IconComponent: React.ElementType;
  className?: string;
}

const BaseIcon: React.FC<BaseIconProps> = ({ IconComponent, className, ...props }) => {
  return <IconComponent className={cn(sharedStyles, className)} {...props} />;
};

export default BaseIcon;
