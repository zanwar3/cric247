'use client';
import { SessionProvider as Provider } from 'next-auth/react';

export function SessionProvider({ children }) {
  return <Provider>{children}</Provider>;
}