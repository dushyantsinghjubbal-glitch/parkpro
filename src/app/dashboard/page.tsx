'use client';

import { useUserRole } from '@/firebase/auth/use-user-role';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { StaffDashboard } from '@/components/dashboard/staff-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { role, isLoading } = useUserRole();

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
                <Skeleton className="flex-1" />
            </div>
        );
    }
    
    return role === 'admin' ? <AdminDashboard /> : <StaffDashboard />;
}
