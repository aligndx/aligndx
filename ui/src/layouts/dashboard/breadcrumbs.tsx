import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname, useSearchParams } from "@/routes";
import Link from "next/link";

export function Breadcrumbs() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const generateBreadcrumbs = () => {
        const ogpathSegments = pathname.split("/").filter((segment) => segment);
        const pathSegments = ogpathSegments.slice(0);

        const showEllipsis = pathSegments.length > 3;
        const breadcrumbs = [];

        const queryName = searchParams.get("name") || "";
        const isLastSegmentName = pathSegments[pathSegments.length - 1] === "workflows" && queryName;

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

            const lastSegment = isLastSegmentName ? queryName : pathSegments[pathSegments.length - 1];
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
            pathSegments.forEach((segment, index) => {
                const href = "/" + pathSegments.slice(0, index + 1).join("/");
                const isLastSegment = index === pathSegments.length - 1;

                if (index != 0) {
                    breadcrumbs.push(
                        <BreadcrumbSeparator key={`separator-${index}`} />
                    );
                }

                // Check if this is the "workflows" segment and add the name query param as the final breadcrumb
                if (segment === "workflows" && queryName) {
                    breadcrumbs.push(
                        <BreadcrumbItem key={segment}>
                            <Link href={href}>
                                {capitalize(segment)}
                            </Link>
                        </BreadcrumbItem>
                    );

                    breadcrumbs.push(
                        <BreadcrumbSeparator key={`separator-query-${index}`} />
                    );

                    breadcrumbs.push(
                        <BreadcrumbItem key={queryName}>
                            <BreadcrumbPage>{capitalize(queryName)}</BreadcrumbPage>
                        </BreadcrumbItem>
                    );
                } else if (isLastSegment && !isLastSegmentName) {
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
