// app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
	// Redirect to dashboard immediately
	redirect('/dashboard');
}
