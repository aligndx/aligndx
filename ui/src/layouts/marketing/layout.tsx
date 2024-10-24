import { ReactNode } from 'react';
import Header from './header';
import Footer from './footer';

type Props = {
    children: ReactNode;
};

export default function MarketingLayout({ children }: Props) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="custom-bg"></div>
            <Header className="px-6 py-2"  />
            <main className="flex-grow z-10">
                {children}
            </main>
            <Footer className="flex items-center justify-between px-6 z-10" />
        </div>
    );
}
