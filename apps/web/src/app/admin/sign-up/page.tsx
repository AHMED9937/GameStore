import { notFound } from 'next/navigation';

/** Admin accounts are invite-only in Clerk no self-service sign-up. */
export default function AdminSignUpPage() {
  notFound();
}
