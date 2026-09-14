import { describe, it, expect } from 'vitest';

export interface TestMember {
  id: string;
  member_id?: string;
  name: string;
  phone: string;
  email: string;
  role: 'member' | 'trainer' | 'admin';
  center: 'Ranaghat' | 'Chakdah' | 'Madanpur';
  admission_type?: 'New Admission' | 'Re-admission';
  status: 'active' | 'expired' | 'pending' | 'refunded';
}

export function filterMembers(
  members: TestMember[],
  query: string,
  searchMode: 'all' | 'id' | 'name' | 'phone',
  selectedCenter: string,
  selectedRole: string
): TestMember[] {
  const q = query.trim().toLowerCase();

  return members.filter((m) => {
    // Branch Filter
    if (selectedCenter !== 'all' && m.center !== selectedCenter) return false;

    // Role Filter
    if (selectedRole !== 'all' && m.role !== selectedRole) return false;

    // If query is empty, return all matching filters
    if (!q) return true;

    // Search Mode filtering
    if (searchMode === 'id') {
      return (m.member_id || '').toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    }
    if (searchMode === 'name') {
      return m.name.toLowerCase().includes(q);
    }
    if (searchMode === 'phone') {
      return m.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
    }

    // Default: 'all'
    const idMatch = (m.member_id || '').toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    const nameMatch = m.name.toLowerCase().includes(q);
    const phoneMatch = m.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
    const emailMatch = m.email.toLowerCase().includes(q);

    return idMatch || nameMatch || phoneMatch || emailMatch;
  });
}

describe('Roster Search & ID Assignment Verification (Fix 2)', () => {
  const sampleRoster: TestMember[] = [
    {
      id: 'usr-1',
      member_id: 'HG-RAN-102',
      name: 'Rahul Sharma',
      phone: '+91 9830012345',
      email: 'rahul@gmail.com',
      role: 'member',
      center: 'Ranaghat',
      admission_type: 'New Admission',
      status: 'active',
    },
    {
      id: 'usr-2',
      member_id: 'HG-CHK-205',
      name: 'Sneha Roy',
      phone: '+91 9831122334',
      email: 'sneha@gmail.com',
      role: 'member',
      center: 'Chakdah',
      admission_type: 'Re-admission',
      status: 'active',
    },
    {
      id: 'usr-3',
      member_id: 'HG-MAD-301',
      name: 'Amit Kumar',
      phone: '+91 9832233445',
      email: 'amit.trainer@herculesgym.in',
      role: 'trainer',
      center: 'Madanpur',
      status: 'active',
    },
  ];

  it('should filter strictly by Member ID when searchMode is "id"', () => {
    const results = filterMembers(sampleRoster, 'HG-RAN-102', 'id', 'all', 'all');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Rahul Sharma');

    // Partial ID match
    const partialResults = filterMembers(sampleRoster, '205', 'id', 'all', 'all');
    expect(partialResults).toHaveLength(1);
    expect(partialResults[0].member_id).toBe('HG-CHK-205');

    // Name should NOT match in ID search mode
    const negativeResults = filterMembers(sampleRoster, 'Rahul', 'id', 'all', 'all');
    expect(negativeResults).toHaveLength(0);
  });

  it('should filter strictly by Member Name when searchMode is "name"', () => {
    const results = filterMembers(sampleRoster, 'Sneha', 'name', 'all', 'all');
    expect(results).toHaveLength(1);
    expect(results[0].member_id).toBe('HG-CHK-205');

    // ID should NOT match in Name search mode
    const negativeResults = filterMembers(sampleRoster, 'HG-RAN', 'name', 'all', 'all');
    expect(negativeResults).toHaveLength(0);
  });

  it('should filter strictly by Phone Number when searchMode is "phone"', () => {
    const results = filterMembers(sampleRoster, '9832233445', 'phone', 'all', 'all');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Amit Kumar');
  });

  it('should handle branch / center isolation accurately', () => {
    const ranaghatMembers = filterMembers(sampleRoster, '', 'all', 'Ranaghat', 'all');
    expect(ranaghatMembers).toHaveLength(1);
    expect(ranaghatMembers[0].center).toBe('Ranaghat');
  });
});
