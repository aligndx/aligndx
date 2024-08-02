type Props = {
    children: React.ReactNode;
    sideContent: React.ReactNode;
    reverse?: boolean;
};

export default function AuthLayout({ children, sideContent, reverse = false}: Props) { 

    return (
        <div className={`flex flex-col md:flex-row  min-h-screen bg-background ${reverse ? "md:flex-row-reverse" : null}`}>
            <div className="flex-grow flex flex-col items-center justify-center p-12">
                {children}
            </div>
            <div className="hidden md:flex md:flex-grow">
                {sideContent}
            </div>
        </div>
    );
}
