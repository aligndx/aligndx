type Props = {
    children: React.ReactNode;
    sideContent: React.ReactNode;
    reverse?: boolean;
};

export default function AuthLayout({ children, sideContent, reverse = false}: Props) { 

    return (
        <div className="w-full lg:grid min-h-screen lg:grid-cols-3">
            <div className={`flex items-center justify-center py-12 col-span-1 ${reverse ? "order-last" : null}`}>
                {children}
            </div>
            <div className="hidden bg-muted lg:flex lg:col-span-2">
                {sideContent}
            </div>
        </div>
    );
}
