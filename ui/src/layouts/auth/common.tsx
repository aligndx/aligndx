import Image from "next/image";

type Props = {
    children: React.ReactNode;
    sideContent: React.ReactNode;
    reverse?: boolean;
};

export default function AuthLayout({ children, sideContent, reverse = false}: Props) { 

    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className={`flex items-center justify-center py-12 ${reverse ? "order-last" : null}`}>
                {children}
            </div>
            <div className="hidden bg-muted lg:block">
                {sideContent}
            </div>
        </div>
    );
}
