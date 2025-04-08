'use client';

import AuthGuard from '../components/AuthGuard';

export default function VideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
} 