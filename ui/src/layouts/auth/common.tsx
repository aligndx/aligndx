type Props = {
    children: React.ReactNode;
    sideContent: React.ReactNode;
    reverse?: boolean;
};

export default function AuthLayout({ children, sideContent, reverse = false}: Props) { 

    return (
        <div className="w-full lg:grid min-h-screen lg:grid-cols-2">
            <div className={`flex items-center justify-center py-12 ${reverse ? "order-last" : null}`}>
                {children}
            </div>
            <div className="hidden bg-muted lg:block">
                {sideContent}
            </div>
        </div>
    );
}
