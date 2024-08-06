import { cn } from '@/lib/utils';
import React from 'react';
import { IconType } from 'react-icons';
import { FaBeer, FaCoffee } from 'react-icons/fa'; // Import only the icons you need

// Define a mapping of icon names to their respective components from react-icons
const iconMapping: { [key: string]: IconType } = {
  beer: FaBeer,
  coffee: FaCoffee,
  // Add other icons as needed
};

const sharedStyles = 'text-gray-700'; // Define your shared styles

interface IconProps {
  name: string;
  className?: string;
  [key: string]: any; // For other props like size, color, etc.
}

const Icon: React.FC<IconProps> = ({ name, className, ...props }) => {
  const IconComponent = iconMapping[name];

  if (!IconComponent) {
    console.warn(`Icon with name "${name}" does not exist.`);
    return null;
  }

  // Merge shared styles and additional class names
  const finalClassName = cn(sharedStyles, className);

  return (
    <IconComponent className={finalClassName} {...props} />
  );
};

export default Icon;
