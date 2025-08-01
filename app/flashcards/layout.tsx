'use client';

import AuthGuard from '../components/AuthGuard';

export default function FlashcardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
} 