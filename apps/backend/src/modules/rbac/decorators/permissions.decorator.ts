import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface Permission {
  resource: string;
  action: string;
}

/**
 * Permissions decorator - restricts access based on specific permissions
 * @param permissions - Array of permission objects or strings in format "resource:action"
 * @example @Permissions({ resource: 'users', action: 'create' })
 * @example @Permissions('users:create', 'users:update')
 */
export const Permissions = (...permissions: (Permission | string)[]) => {
  const normalizedPermissions = permissions.map((perm) => {
    if (typeof perm === 'string') {
      const [resource, action] = perm.split(':');
      return { resource, action };
    }
    return perm;
  });
  return SetMetadata(PERMISSIONS_KEY, normalizedPermissions);
};
