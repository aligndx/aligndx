import { routes } from '@/routes';
import { redirect } from 'next/navigation';

export default function Page() {
    redirect(routes.home);

}
