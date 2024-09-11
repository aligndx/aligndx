import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "@/routes";
import Link from "next/link";

export function Breadcrumbs() {
    const pathname = usePathname();

    const generateBreadcrumbs = () => {
        const ogpathSegments = pathname.split("/").filter((segment) => segment);
        const pathSegments = ogpathSegments.slice(0); // Start after 'dashboard'

        const showEllipsis = pathSegments.length > 3;
        const breadcrumbs = [];


        // If we need to show ellipsis, we'll only show the first and last segments
        if (showEllipsis) {
            breadcrumbs.push(
                <BreadcrumbSeparator key="separator-1" />
            );

            breadcrumbs.push(
                <BreadcrumbItem key={pathSegments[0]}>
                    <Link href={`/${pathSegments[0]}`}>
                        {capitalize(pathSegments[0])}
                    </Link>
                </BreadcrumbItem>
            );

            breadcrumbs.push(
                <BreadcrumbEllipsis key="ellipsis" />
            );

            const lastSegment = pathSegments[pathSegments.length - 1];
            breadcrumbs.push(
                <BreadcrumbSeparator key="separator-2" />
            );

            breadcrumbs.push(
                <BreadcrumbItem key={lastSegment}>
                    <BreadcrumbPage>
                        {capitalize(lastSegment)}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            );
        } else {
            pathSegments.forEach((segment, index ) => {
                const href = "/" + pathSegments.slice(0, index + 1).join("/");
                if (index != 0) {
                    breadcrumbs.push(
                        <BreadcrumbSeparator key={`separator-${index}`} />
                    );
                }

                if (index === pathSegments.length - 1) {
                    breadcrumbs.push(
                        <BreadcrumbItem key={segment}>
                            <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                        </BreadcrumbItem>
                    );
                } else {
                    breadcrumbs.push(
                        <BreadcrumbItem key={segment}>
                                <Link href={href}>
                                    {capitalize(segment)}
                                </Link>
                        </BreadcrumbItem>
                    );
                }
            });
        }

        return breadcrumbs;
    };

    // Helper function to capitalize the first letter
    const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    return (
        <Breadcrumb>
            <BreadcrumbList>
                {generateBreadcrumbs()}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
