import { Analyze, Chart, DashboardIcon } from "@/components/icons";
import { routes } from "@/routes";
import Logo from "@/components/logo";

const commonStyles = "flex-shrink-0"
const links = [
  {
    label: "Dashboard",
    href: routes.dashboard.root,
    icon: (
      <DashboardIcon className={commonStyles} />
    ),
  },
  {
    label: "Analyze",
    href: routes.dashboard.analyze,
    icon: (
      <Analyze className={commonStyles} />
    ),
  },
  {
    label: "Visualize",
    href: routes.dashboard.visualize,
    icon: (
      <Chart className={commonStyles} />
    ),
  }

];