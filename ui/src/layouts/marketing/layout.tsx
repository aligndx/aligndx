import { ReactNode } from 'react';
import Header from './header';
import Footer from './footer';

type Props = {
    children: ReactNode;
};

export default function MarketingLayout({ children }: Props) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header className="px-6 py-2" />
            <main className="flex-grow">{children}</main>
            <Footer className="flex  items-center  justify-between px-6" />
        </div>
    );
}