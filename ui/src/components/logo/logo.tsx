import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { routes } from '@/routes';
import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

interface LogoProps extends Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'> {
    disabledLink?: boolean;
    className?: string;
    full?: boolean;
}

const Logo = forwardRef<HTMLDivElement, LogoProps>(
    ({ disabledLink = false, className, full = true, width = 35, height = 35, ...imageProps }, ref) => {
        const logoClasses = cn(className);

        const logo = (
            <Image
                src="/logo.svg"
                alt="Logo"
                className={logoClasses}
                width={width}
                height={height}
                {...imageProps} // Spread all Image component props
            />
        );

        if (disabledLink) {
            return <div className="flex items-center">
                {logo}
                <span className="ml-2 font-extrabold text-sm">{siteConfig.name}</span>
            </div>;
        }

        return (
            <Link href={routes.home}>
                <div className="flex items-center">
                    {logo}
                    {full ?
                        <span className="ml-2 font-extrabold text-sm">{siteConfig.name}</span>
                        :
                        null
                    }
                </div>
            </Link>
        );
    }
);

Logo.displayName = 'Logo'

export default Logo;
