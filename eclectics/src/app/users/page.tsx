import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UsersAdminTable from '@/src/app/users/UsersAdminTable';

export default async function UsersPage() {
	const jar = await cookies();
	const raw = jar.get('session')?.value;
	let isAdmin = false;
	if (raw) {
		try {
			const parsed: { email?: string } = JSON.parse(decodeURIComponent(raw));
			if (parsed.email === 'jhu.eclectics@gmail.com') isAdmin = true;
		} catch {
			// ignore
		}
	}
	if (!isAdmin) redirect('/');
	return <UsersAdminTable />;
}
