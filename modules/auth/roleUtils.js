const ROLE_ALIASES = {
  fleet_manager: 'fleet_manager',
  'fleet manager': 'fleet_manager',
  'fleet-manager': 'fleet_manager',
  'fleet_manager': 'fleet_manager',
  'fleetmanager': 'fleet_manager',
  fleet: 'fleet_manager',
  admin: 'fleet_manager',
  driver: 'driver',
  'driver portal': 'driver',
  safety_officer: 'safety_officer',
  'safety officer': 'safety_officer',
  'safety-officer': 'safety_officer',
  'safety_officer': 'safety_officer',
  safety: 'safety_officer',
  financial_analyst: 'financial_analyst',
  'financial analyst': 'financial_analyst',
  'financial-analyst': 'financial_analyst',
  finance: 'financial_analyst',
  analyst: 'financial_analyst',
};

function normalizeRole(role) {
  if (!role && role !== 0) return null;
  const normalized = String(role).trim().toLowerCase().replace(/\s+/g, '_');
  return ROLE_ALIASES[normalized] || ROLE_ALIASES[normalized.replace(/-+/g, '_')] || null;
}

function getRoleDisplayName(role) {
  const normalized = normalizeRole(role);
  const displayNames = {
    fleet_manager: 'Fleet Manager',
    driver: 'Driver',
    safety_officer: 'Safety Officer',
    financial_analyst: 'Financial Analyst',
  };
  return displayNames[normalized] || 'User';
}

function normalizeUser(user) {
  if (!user) return null;
  const normalizedRole = normalizeRole(user.role);
  return {
    ...user,
    role: normalizedRole || user.role,
    roleLabel: getRoleDisplayName(normalizedRole || user.role),
  };
}

module.exports = { normalizeRole, getRoleDisplayName, normalizeUser };