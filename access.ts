import { list } from '@keystone-next/keystone/schema';
import { permissionsList } from './schemas/fields';
import { ListAccessArgs } from './types';

// At it simplest, the access control returns a yes or no value depending on the users session

export function isSignedIn({ session }: ListAccessArgs) {
  // A double bang creates true/false for non-boolean values
  return !!session;
}

const generatedPermissions = Object.fromEntries(
  permissionsList.map((permission) => [
    permission,
    function ({ session }: ListAccessArgs) {
      return !!session?.data.role?.[permission];
    },
  ])
);

// Permissions check if someone meets a criteria → yes or no
export const permissions = {
  ...generatedPermissions,
  // Adding additional, custom permissions
  isAwesome({ session }: ListAccessArgs): boolean {
    return session?.data.name.includes('maikel');
  },
};

// Rule based function
// Rules can return a boolean, or a filter which limits the products they can access
export const rules = {
  canManageProducts({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }

    // 1. Do they have the permission of canManageProducts
    if (permissions.canManageProducts({ session })) {
      return true;
    }

    // 2. If not, do they own this item?
    return { user: { id: session.itemId } };
  },
  canReadProducts({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }

    if (permissions.canManageProducts({ session })) {
      return true; // They can read anything
    }

    // The should only see available products (based on status field)
    return { status: 'AVAILABLE' };
  },
  canOrder({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }

    if (permissions.canManageCart({ session })) {
      return true;
    }
    return { user: { id: session.itemId } };
  },
  canManageOrderItems({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) {
      return false;
    }

    if (permissions.canManageCart({ session })) {
      return true;
    }
    return { order: { user: { id: session.itemId } } };
  },
  canManageUsers({ session }: ListAccessArgs) {
    if (!isSignedIn({ session })) return false;
    if (permissions.canManageUsers({ session })) return true;

    // Otherwise only update theirselves
    return { id: session.itemId };
  },
};
