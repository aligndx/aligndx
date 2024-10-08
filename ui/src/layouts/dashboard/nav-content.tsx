import { Analyze, Archive, MagnifyingGlass} from "@/components/icons";
import { routes, usePathname } from "@/routes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { cn } from "@/lib/utils";

const commonStyles = "w-[20px] h-[20px]"
const links = [
  // {
  //   label: "Dashboard",
  //   href: routes.dashboard.root,
  //   icon: (
  //     <DashboardIcon className={commonStyles} />
  //   ),
  // },
  {
    label: "Upload",
    href: routes.dashboard.upload.root,
    icon: (
      <Analyze className={commonStyles} />
    ),
  },
  {
    label: "Review",
    href: routes.dashboard.submissions.root,
    icon: (
      <Archive className={commonStyles} />
    ),
  },
  // {
  //   label: "Data",
  //   href: routes.dashboard.data,
  //   icon: (
  //     <Drive className={commonStyles} />
  //   ),
  // },
  {
    label: "Explore",
    href: routes.dashboard.explore,
    icon: (
      <MagnifyingGlass className={commonStyles} />
    ),
  },

];
type NavListProps = {
  title: string;
  route: string;
  icon?: any;
  highlighted?: boolean;
  isMobile?: boolean;
};

function isHighlighted(pathname: string, route: string) {
  if (pathname === route) {
    return true
  }
  return false
}

function capitalizeFirstLetter(word: string) {
  return word.toLowerCase().charAt(0).toUpperCase() + word.slice(1);
}

function NavItem({ title, route, icon, highlighted, isMobile }: NavListProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger>
          <Link href={route} className={
            cn("flex flex-row items-center rounded-md gap-2 text-sm px-2 py-2 hover:text-muted-foreground  hover:cursor-pointer",
              highlighted ? "border" : null,
              isMobile ? "gap-4" : null
            )}>
            {icon}
            <h3 className="scroll-m-20 tracking-tight">
              {capitalizeFirstLetter(title)}
              {/* {isMobile && capitalizeFirstLetter(title)} */}
            </h3>
          </Link>
        </TooltipTrigger>
        {/* {!isMobile ? <TooltipContent side="right">
          {capitalizeFirstLetter(title)}
        </TooltipContent> : null} */}
      </Tooltip>

    </TooltipProvider>
  )
}

interface NavContentProps {
  isMobile?: boolean
}

export default function NavContent({ isMobile }: NavContentProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex flex-col gap-5")}>
      {links.map((item, index) => (
        <NavItem key={index} route={item.href} icon={item.icon} highlighted={isHighlighted(pathname, item.href)} title={item.label} isMobile={isMobile} />))}
    </div>
  )
}