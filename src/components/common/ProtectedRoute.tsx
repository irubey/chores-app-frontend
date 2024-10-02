// frontend/src/components/common/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isInitialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
    if (isInitialized && !isAuthenticated) {
        router.push('/');
    }
    }, [isInitialized, isAuthenticated, router]);

    if (!isInitialized) {
    return <LoadingSpinner />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;