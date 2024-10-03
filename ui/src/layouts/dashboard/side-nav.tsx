import React from 'react';
import NavContent from './nav-content';
import Logo from '@/components/logo';
import { UserNav } from '../common/user-nav';
import { cn } from '@/lib/utils';
import { MobileSideNav } from '../common/mobile-nav';

interface SideNavProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  toggleMobileSideNav: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ open, toggleMobileSideNav, className, ...props }) => {
  const desktopContent = (
    <div
      className={cn('hidden md:flex flex-col gap-2 items-center justify-between px-2 pb-6 border-r-2 w-[150px]', className)}
      {...props}
    >
      <Logo full={false} className='w-[70px] ' />
      <NavContent />
      <UserNav />
    </div>
  )

  const mobileContent = (
    <div
      className={cn('flex flex-col h-full flex-start gap-6 justify-between')}
      {...props}
    >
      <div className='flex flex-col gap-6'>
        <Logo className='w-[60px]' />
        <NavContent isMobile={true} />
      </div>
      <UserNav />
    </div>
  )

  return (
    <>
      {desktopContent}
      <MobileSideNav showSideNav={open} toggleSideNav={toggleMobileSideNav}> {mobileContent} </MobileSideNav>
    </>
  );
}

export default SideNav;
