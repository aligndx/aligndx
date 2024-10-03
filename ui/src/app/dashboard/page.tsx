import { routes } from '@/routes';
import Overview from '@/sections/overview';
import { redirect } from 'next/navigation';

// export const metadata = {
//     title: 'Overview',
// };

export default function Page() {
    // return <Overview />
    redirect(routes.home);

}
