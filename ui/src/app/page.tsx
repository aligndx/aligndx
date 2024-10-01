import { routes } from '@/routes';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  redirect(routes.marketing);
}
