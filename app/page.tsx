import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'SUPER_ADMIN') {
    redirect('/admin');
  } else {
    redirect('/organizer');
  }
}
