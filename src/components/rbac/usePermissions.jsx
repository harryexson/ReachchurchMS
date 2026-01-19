import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Permission checking hook
export function usePermissions() {
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Super admin has all permissions
            if (user.role === 'admin' && (user.email === 'david@base44.app' || user.developer_access)) {
                setPermissions(getAllPermissions());
                setLoading(false);
                return;
            }

            // Legacy admin role - grant most permissions
            if (user.role === 'admin') {
                setPermissions(getAdminPermissions());
                setLoading(false);
                return;
            }

            // Load user's roles and merge permissions
            const userRoles = await base44.entities.UserRole.filter({
                user_email: user.email,
                is_active: true
            });

            if (userRoles.length === 0) {
                // Member with no custom roles - basic permissions
                setPermissions(getMemberPermissions());
                setLoading(false);
                return;
            }

            // Get all role details
            const roleIds = userRoles.map(ur => ur.role_id);
            const roles = await Promise.all(
                roleIds.map(id => base44.entities.Role.filter({ id }))
            );

            // Merge permissions from all roles (priority-based)
            const mergedPermissions = mergeRolePermissions(
                roles.flat().filter(r => r && r.is_active)
            );

            setPermissions(mergedPermissions);
        } catch (error) {
            console.error('Error loading permissions:', error);
            setPermissions(getMemberPermissions());
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (category, action) => {
        if (!permissions) return false;
        return permissions[category]?.[action] === true;
    };

    const hasAnyPermission = (category) => {
        if (!permissions || !permissions[category]) return false;
        return Object.values(permissions[category]).some(v => v === true);
    };

    const canAccessPage = (pageName) => {
        const pagePermissions = {
            'Members': () => hasPermission('members', 'view'),
            'Giving': () => hasPermission('giving', 'view'),
            'Events': () => hasPermission('events', 'view'),
            'Volunteers': () => hasPermission('volunteers', 'view'),
            'Communications': () => hasPermission('communications', 'view'),
            'Reports': () => hasAnyPermission('reports'),
            'Settings': () => hasPermission('settings', 'view'),
            'RoleManagement': () => hasPermission('settings', 'manage_roles'),
            'UserManagement': () => hasPermission('settings', 'manage_users')
        };

        return pagePermissions[pageName] ? pagePermissions[pageName]() : false;
    };

    return {
        permissions,
        loading,
        currentUser,
        hasPermission,
        hasAnyPermission,
        canAccessPage,
        refresh: loadPermissions
    };
}

// Merge permissions from multiple roles (highest priority wins)
function mergeRolePermissions(roles) {
    if (!roles || roles.length === 0) return getMemberPermissions();

    // Sort by priority (highest first)
    const sortedRoles = [...roles].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const merged = {
        members: {},
        giving: {},
        events: {},
        volunteers: {},
        communications: {},
        reports: {},
        settings: {}
    };

    // For each category and action, take the first true value (from highest priority role)
    Object.keys(merged).forEach(category => {
        const actions = Object.keys(sortedRoles[0]?.permissions?.[category] || {});
        actions.forEach(action => {
            for (const role of sortedRoles) {
                if (role.permissions?.[category]?.[action] === true) {
                    merged[category][action] = true;
                    break;
                }
            }
            if (merged[category][action] !== true) {
                merged[category][action] = false;
            }
        });
    });

    return merged;
}

// Full permissions for super admins
function getAllPermissions() {
    return {
        members: { view: true, create: true, edit: true, delete: true, export: true },
        giving: { view: true, create: true, edit: true, delete: true, export: true, view_reports: true },
        events: { view: true, create: true, edit: true, delete: true, manage_registrations: true },
        volunteers: { view: true, create: true, edit: true, delete: true, manage_hours: true },
        communications: { view: true, create: true, send: true, delete: true },
        reports: { view_financial: true, view_attendance: true, view_analytics: true, export: true },
        settings: { view: true, edit: true, manage_users: true, manage_roles: true }
    };
}

// Admin permissions - full access for all subscribed church admins
function getAdminPermissions() {
    return {
        members: { view: true, create: true, edit: true, delete: true, export: true },
        giving: { view: true, create: true, edit: true, delete: true, export: true, view_reports: true },
        events: { view: true, create: true, edit: true, delete: true, manage_registrations: true },
        volunteers: { view: true, create: true, edit: true, delete: true, manage_hours: true },
        communications: { view: true, create: true, send: true, delete: true },
        reports: { view_financial: true, view_attendance: true, view_analytics: true, export: true },
        settings: { view: true, edit: true, manage_users: true, manage_roles: true }
    };
}

// Basic member permissions
function getMemberPermissions() {
    return {
        members: { view: false, create: false, edit: false, delete: false, export: false },
        giving: { view: false, create: true, edit: false, delete: false, export: false, view_reports: false },
        events: { view: true, create: false, edit: false, delete: false, manage_registrations: false },
        volunteers: { view: true, create: false, edit: false, delete: false, manage_hours: false },
        communications: { view: true, create: false, send: false, delete: false },
        reports: { view_financial: false, view_attendance: false, view_analytics: false, export: false },
        settings: { view: false, edit: false, manage_users: false, manage_roles: false }
    };
}