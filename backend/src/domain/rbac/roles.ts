import { Permission, RoleDefinition, RoleKey } from '../../types/domain';

const TENANT_ADMIN: Permission[] = [
  'tenant:manage',
  'tenant:billing',
  'members:manage',
  'integrations:manage',
  'integrations:read',
  'financials:read',
  'financials:write',
  'supplychain:read',
  'supplychain:write',
  'market:read',
  'simulations:run',
  'alerts:manage',
  'audit:read',
  'ingestion:write'
];

/**
 * Role catalogue. The same definitions are exported to the dashboard so UI
 * component visibility and API enforcement never drift apart.
 */
export const ROLE_DEFINITIONS: Record<RoleKey, RoleDefinition> = {
  owner_admin: {
    key: 'owner_admin',
    name: 'Owner / Admin',
    description: 'Full tenant control, billing, members and integrations.',
    permissions: TENANT_ADMIN,
    uiScopes: ['*']
  },
  cfo: {
    key: 'cfo',
    name: 'CFO',
    description: 'Complete financial analytics, simulations and audit visibility.',
    permissions: [
      'financials:read',
      'financials:write',
      'market:read',
      'simulations:run',
      'alerts:manage',
      'audit:read',
      'integrations:read',
      'supplychain:read'
    ],
    uiScopes: ['finance', 'simulations', 'executive-dashboard', 'audit']
  },
  procurement_manager: {
    key: 'procurement_manager',
    name: 'Procurement Manager',
    description: 'Supply chain, vendor and market data access; no financial ledgers.',
    permissions: [
      'supplychain:read',
      'supplychain:write',
      'market:read',
      'integrations:read',
      'ingestion:write'
    ],
    uiScopes: ['supplychain', 'procurement', 'market-intelligence']
  },
  logistics_specialist: {
    key: 'logistics_specialist',
    name: 'Logistics Specialist',
    description: 'Shipment tracking and inventory operations only.',
    permissions: ['supplychain:read', 'supplychain:write', 'market:read'],
    uiScopes: ['logistics', 'inventory']
  },
  auditor: {
    key: 'auditor',
    name: 'Auditor',
    description: 'Read-only access to financial, supply chain and audit records.',
    permissions: [
      'financials:read',
      'supplychain:read',
      'market:read',
      'integrations:read',
      'audit:read'
    ],
    uiScopes: ['finance', 'supplychain', 'audit']
  }
};

export const ROLE_KEYS = Object.keys(ROLE_DEFINITIONS) as RoleKey[];

export const permissionsForRole = (role: RoleKey): readonly Permission[] =>
  ROLE_DEFINITIONS[role].permissions;

export const roleHasPermission = (role: RoleKey, permission: Permission): boolean =>
  ROLE_DEFINITIONS[role].permissions.includes(permission);
