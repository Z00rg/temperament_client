import { cookies } from 'next/headers';

export async function getUserRole(): Promise<'admin' | 'student' | null> {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role');

    if (userRole?.value === 'admin' || userRole?.value === 'student') {
        return userRole.value;
    }

    return null;
}

export async function isAdmin(): Promise<boolean> {
    const role = await getUserRole();
    return role === 'admin';
}