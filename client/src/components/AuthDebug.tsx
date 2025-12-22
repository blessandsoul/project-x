import { useAuth } from '@/hooks/useAuth';

/**
 * Debug component to show current auth state
 * Remove this after debugging
 */
export function AuthDebug() {
    const { user, userRole, companyId, isAuthenticated } = useAuth();

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                background: '#000',
                color: '#0f0',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                zIndex: 9999,
                maxWidth: '300px',
            }}
        >
            <div><strong>Auth Debug:</strong></div>
            <div>isAuthenticated: {String(isAuthenticated)}</div>
            <div>userRole: {userRole ?? 'null'}</div>
            <div>companyId: {companyId ?? 'null'}</div>
            <div>user.id: {user?.id ?? 'null'}</div>
            <div>user.email: {user?.email ?? 'null'}</div>
        </div>
    );
}
