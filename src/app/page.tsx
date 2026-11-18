import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function IndexPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');
  const refreshToken = cookieStore.get('refresh_token');

  if (accessToken || refreshToken) {
    redirect('/home');
  } else {
    redirect('/login');
  }
}

