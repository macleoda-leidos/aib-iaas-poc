import { Section } from '../page';

const STATUS_COLOURS: Record<string, string> = {
  'Submitted': 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-amber-100 text-amber-800',
  'Awaiting Info': 'bg-purple-100 text-purple-800',
  'Accepted': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Recommendation Issued': 'bg-teal-100 text-teal-800',
};

const APPLICATIONS = [
  { ref: 'IAAS-2024-00012', applicant: 'John Testerton', debt: '£12,700', status: 'Submitted', date: '28 Jun 2024', link: '#admin-app-detail' },
  { ref: 'IAAS-2024-00011', applicant: 'B. Campbell', debt: '£8,200', status: 'Under Review', date: '25 Jun 2024', link: '' },
  { ref: 'IAAS-2024-00010', applicant: 'C. Stewart', debt: '£15,400', status: 'Awaiting Info', date: '22 Jun 2024', link: '' },
  { ref: 'IAAS-2024-00009', applicant: 'D. Minimal', debt: '£3,800', status: 'Accepted', date: '20 Jun 2024', link: '' },
  { ref: 'IAAS-2024-00008', applicant: 'E. Mackenzie', debt: '£22,100', status: 'Recommendation Issued', date: '18 Jun 2024', link: '' },
  { ref: 'IAAS-2024-00007', applicant: 'F. Robertson', debt: '£7,600', status: 'Accepted', date: '15 Jun 2024', link: '' },
  { ref: 'IAAS-2024-00006', applicant: 'G. Hamilton', debt: '£31,200', status: 'Accepted', date: '12 Jun 2024', link: '' },
  { ref: 'IAAS-2024-00005', applicant: 'S. Lowdebt', debt: '£5,100', status: 'Accepted', date: '10 Jun 2024', link: '' },
];

const ORGANISATIONS = [
  { name: 'Accountant in Bankruptcy', type: 'AiB Internal', location: 'Kilwinning', status: 'Active', users: 55 },
  { name: 'AiB - Case Administration', type: 'AiB Internal', location: 'Kilwinning', status: 'Active', users: 45 },
  { name: 'CAS - Edinburgh Bureau', type: 'Money Adviser', location: 'Edinburgh', status: 'Active', users: 35 },
  { name: 'StepChange Scotland', type: 'Money Adviser', location: 'Glasgow', status: 'Active', users: 42 },
  { name: 'Royal Bank of Scotland', type: 'Creditor', location: 'Edinburgh', status: 'Active', users: 20 },
  { name: 'Barclays', type: 'Creditor', location: 'London', status: 'Active', users: 15 },
  { name: 'Sample Insolvency Practitioners', type: 'Trustee', location: 'Aberdeen', status: 'Active', users: 12 },
  { name: 'Highland Debt Solutions', type: 'Money Adviser', location: 'Inverness', status: 'Active', users: 18 },
];

const USERS = [
  { name: 'Admin User', email: 'admin@aib.example.gov.scot', role: 'System Admin', org: 'AiB', status: 'Active', lastLogin: 'Today' },
  { name: 'Karen MacLeod', email: 'senior.officer@aib.example.gov.scot', role: 'AiB Senior Officer', org: 'AiB', status: 'Active', lastLogin: 'Today' },
  { name: 'James Wilson', email: 'officer@aib.example.gov.scot', role: 'AiB Case Officer', org: 'AiB - Case Admin', status: 'Active', lastLogin: 'Yesterday' },
  { name: 'Fiona Campbell', email: 'adviser@cas.example.org.uk', role: 'Money Adviser', org: 'CAS Edinburgh', status: 'Active', lastLogin: 'Today' },
  { name: 'Sarah Mitchell', email: 'collections@rbs.example.co.uk', role: 'Creditor', org: 'RBS', status: 'Active', lastLogin: '3 days ago' },
  { name: 'Robert Henderson', email: 'trustee@sip.example.co.uk', role: 'Trustee', org: 'Sample IP', status: 'Active', lastLogin: '5 days ago' },
  { name: 'John Testerton', email: 'john.testerton@example.com', role: 'Debtor', org: '—', status: 'Active', lastLogin: '2 days ago' },
  { name: 'Margaret Fraser', email: 'margaret.fraser@stepchange.example.org', role: 'Money Adviser', org: 'StepChange', status: 'Active', lastLogin: 'Today' },
  { name: 'David Murray', email: 'david.murray@aib.example.gov.scot', role: 'AiB Case Officer', org: 'AiB - Case Admin', status: 'Active', lastLogin: 'Yesterday' },
  { name: 'Isla Thomson', email: 'isla.thomson@highland.example.co.uk', role: 'Money Adviser', org: 'Highland Debt', status: 'Active', lastLogin: '4 days ago' },
  { name: 'Angus McPherson', email: 'angus.mcpherson@barclays.example.co.uk', role: 'Creditor', org: 'Barclays', status: 'Active', lastLogin: '1 week ago' },
  { name: 'Morag Stewart', email: 'morag.stewart@cas.example.org.uk', role: 'Money Adviser', org: 'CAS Edinburgh', status: 'Active', lastLogin: 'Today' },
];

export function AdminScreens() {
  return (
    <>
      {/* Admin Dashboard */}
      <Section id="admin-dashboard" title="Admin — Applications Dashboard" screenNumber={29}>
        <h1 className="text-xl font-bold mb-4">Applications Dashboard</h1>

        {/* Status count cards */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          <div className="bg-gray-100 rounded p-2 text-center">
            <p className="text-lg font-bold">48</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
            <p className="text-lg font-bold text-blue-700">4</p>
            <p className="text-xs text-blue-600">Submitted</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded p-2 text-center">
            <p className="text-lg font-bold text-amber-700">3</p>
            <p className="text-xs text-amber-600">Under Review</p>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded p-2 text-center">
            <p className="text-lg font-bold text-teal-700">7</p>
            <p className="text-xs text-teal-600">Recommendation</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
            <p className="text-lg font-bold text-green-700">28</p>
            <p className="text-xs text-green-600">Accepted</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
            <p className="text-lg font-bold text-red-700">6</p>
            <p className="text-xs text-red-600">Rejected</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-bold">Status:</label>
          <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white">
            <option>All</option>
          </select>
        </div>

        {/* Applications table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 font-bold border-b">Reference</th>
                <th className="text-left p-2 font-bold border-b">Applicant</th>
                <th className="text-left p-2 font-bold border-b">Total Debt</th>
                <th className="text-left p-2 font-bold border-b">Status</th>
                <th className="text-left p-2 font-bold border-b">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {APPLICATIONS.map((app, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-blue-50">
                  <td className="p-2">
                    {app.link ? (
                      <a href={app.link} className="text-gov-blue font-medium">{app.ref}</a>
                    ) : (
                      <span className="font-medium">{app.ref}</span>
                    )}
                  </td>
                  <td className="p-2 text-gray-700">{app.applicant}</td>
                  <td className="p-2 text-gray-700">{app.debt}</td>
                  <td className="p-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${STATUS_COLOURS[app.status] || 'bg-gray-100'}`}>{app.status}</span>
                  </td>
                  <td className="p-2 text-gray-600">{app.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Application Detail */}
      <Section id="admin-app-detail" title="Admin — Application Detail" screenNumber={30}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Application Detail: IAAS-2024-00012</h1>
        </div>

        {/* Action bar */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button className="bg-green-700 text-white font-bold py-1.5 px-3 text-xs border-b-2 border-green-900 rounded">Approve</button>
          <button className="bg-red-700 text-white font-bold py-1.5 px-3 text-xs border-b-2 border-red-900 rounded">Reject</button>
          <button className="bg-blue-700 text-white font-bold py-1.5 px-3 text-xs border-b-2 border-blue-900 rounded">Request Info</button>
          <button className="bg-gray-500 text-white font-bold py-1.5 px-3 text-xs border-b-2 border-gray-700 rounded">Reassign</button>
          <button className="bg-gray-500 text-white font-bold py-1.5 px-3 text-xs border-b-2 border-gray-700 rounded">Export PDF</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <span className="px-4 py-2 text-sm font-bold text-blue-700 border-b-2 border-blue-700">Overview</span>
          <span className="px-4 py-2 text-sm text-gray-500">Financial</span>
          <span className="px-4 py-2 text-sm text-gray-500">Checks</span>
          <span className="px-4 py-2 text-sm text-gray-500">Documents</span>
          <span className="px-4 py-2 text-sm text-gray-500">Notes</span>
          <span className="px-4 py-2 text-sm text-gray-500">Audit</span>
        </div>

        {/* Overview tab content */}
        <div className="space-y-4">
          {/* Personal details */}
          <div className="border border-gray-200 rounded p-3">
            <h3 className="font-bold text-sm mb-2">Personal Details</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><span className="text-gray-500">Name:</span> John Testerton</div>
              <div><span className="text-gray-500">DOB:</span> 15/03/1985</div>
              <div><span className="text-gray-500">NI:</span> AB123456C</div>
              <div><span className="text-gray-500">Address:</span> 12 High St, Edinburgh</div>
              <div><span className="text-gray-500">Email:</span> john.testerton@example.com</div>
              <div><span className="text-gray-500">Phone:</span> 07700 900123</div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="border border-gray-200 rounded p-3">
            <h3 className="font-bold text-sm mb-2">Progress</h3>
            <div className="flex items-center gap-1 text-xs">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">Applied ✓</span>
              <span className="text-gray-400">→</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">System Checks ✓</span>
              <span className="text-gray-400">→</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">Credit Check ✓</span>
              <span className="text-gray-400">→</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">Recommendation ✓</span>
              <span className="text-gray-400">→</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">Decision ●</span>
            </div>
          </div>

          {/* Financial summary */}
          <div className="border border-gray-200 rounded p-3">
            <h3 className="font-bold text-sm mb-2">Financial Summary</h3>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div><span className="text-gray-500">Total Debt:</span> <strong>£12,700</strong></div>
              <div><span className="text-gray-500">Income:</span> <strong>£2,430</strong></div>
              <div><span className="text-gray-500">Expenditure:</span> <strong>£1,850</strong></div>
              <div><span className="text-gray-500">Disposable:</span> <strong className="text-green-700">£580</strong></div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm font-bold">Recommendation: <span className="text-blue-700">DAS — 94% confidence</span></p>
          </div>
        </div>

        <div className="mt-4">
          <a href="#admin-dashboard" className="text-sm text-gov-blue hover:underline">← Back to Applications</a>
        </div>
      </Section>

      {/* Organisations */}
      <Section id="admin-orgs" title="Admin — Organisations" screenNumber={31}>
        <h1 className="text-xl font-bold mb-4">Organisations</h1>

        {/* View toggle and filter */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <span className="px-3 py-1 text-sm font-bold bg-blue-700 text-white">List</span>
            <span className="px-3 py-1 text-sm text-gray-600 bg-white">Hierarchy</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold">Type:</label>
            <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white">
              <option>All Types</option>
            </select>
          </div>
        </div>

        {/* Organisations table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 font-bold border-b">Name</th>
                <th className="text-left p-2 font-bold border-b">Type</th>
                <th className="text-left p-2 font-bold border-b">Location</th>
                <th className="text-left p-2 font-bold border-b">Status</th>
                <th className="text-left p-2 font-bold border-b">Users</th>
              </tr>
            </thead>
            <tbody>
              {ORGANISATIONS.map((org, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-blue-50">
                  <td className="p-2 font-medium text-gray-900">{org.name}</td>
                  <td className="p-2 text-gray-700">{org.type}</td>
                  <td className="p-2 text-gray-600">{org.location}</td>
                  <td className="p-2"><span className="text-xs px-2 py-0.5 rounded font-bold bg-green-100 text-green-800">{org.status}</span></td>
                  <td className="p-2 text-gray-700">{org.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Users */}
      <Section id="admin-users" title="Admin — Users" screenNumber={32}>
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-bold">Users</h1>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-200 text-gray-700">500 total</span>
        </div>

        {/* Filters and actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white">
              <option>All Roles</option>
            </select>
            <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white">
              <option>All Organisations</option>
            </select>
            <input type="text" placeholder="Search users..." className="border border-gray-300 rounded px-3 py-1 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-green-700 text-white font-bold py-1.5 px-3 text-xs border-b-2 border-green-900 rounded">Add User</button>
            <select className="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
              <option>Bulk Actions</option>
            </select>
          </div>
        </div>

        {/* Users table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 font-bold border-b">Name</th>
                <th className="text-left p-2 font-bold border-b">Email</th>
                <th className="text-left p-2 font-bold border-b">Role</th>
                <th className="text-left p-2 font-bold border-b">Organisation</th>
                <th className="text-left p-2 font-bold border-b">Status</th>
                <th className="text-left p-2 font-bold border-b">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {USERS.map((user, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-blue-50">
                  <td className="p-2 font-medium text-gray-900">{user.name}</td>
                  <td className="p-2 text-gray-600">{user.email}</td>
                  <td className="p-2 text-gray-700">{user.role}</td>
                  <td className="p-2 text-gray-600">{user.org}</td>
                  <td className="p-2"><span className="text-xs px-2 py-0.5 rounded font-bold bg-green-100 text-green-800">{user.status}</span></td>
                  <td className="p-2 text-gray-600">{user.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
          <span>Showing 1–20 of 500</span>
          <div className="flex gap-1">
            <span className="px-2 py-1 bg-blue-700 text-white rounded text-xs font-bold">1</span>
            <a href="#admin-users" className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">2</a>
            <a href="#admin-users" className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">3</a>
            <span className="px-2 py-1 text-xs">...</span>
            <a href="#admin-users" className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">25</a>
          </div>
        </div>
      </Section>
    </>
  );
}
