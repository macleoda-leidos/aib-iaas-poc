'use client';
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const articles = [
  { id: 'art-1', title: 'DAS: What You Need to Know', category: 'product_guidance', status: 'published', version: '3.2', author: 'Karen MacLeod', lastUpdated: '2026-08-10', publishedAt: '2026-08-10', views: 1847, avgTime: '4m 12s', summary: 'Comprehensive guide to the Debt Arrangement Scheme...' },
  { id: 'art-2', title: 'PTD: A Guide for Advisers', category: 'product_guidance', status: 'published', version: '2.1', author: 'Sarah Mitchell', lastUpdated: '2026-07-22', publishedAt: '2026-07-22', views: 923, avgTime: '5m 34s', summary: 'Protected Trust Deeds explained for money advisers.' },
  { id: 'art-3', title: 'MAP Eligibility Criteria 2026', category: 'product_guidance', status: 'published', version: '1.4', author: 'James Wilson', lastUpdated: '2026-06-15', publishedAt: '2026-06-15', views: 1256, avgTime: '3m 18s', summary: 'Minimal Asset Process eligibility requirements.' },
  { id: 'art-4', title: 'Sequestration: Your Questions Answered', category: 'product_guidance', status: 'published', version: '2.0', author: 'Karen MacLeod', lastUpdated: '2026-05-30', publishedAt: '2026-05-30', views: 678, avgTime: '6m 45s', summary: 'FAQ guide covering sequestration process.' },
  { id: 'art-5', title: 'Moratorium: 6-Week Breathing Space', category: 'product_guidance', status: 'published', version: '1.2', author: 'Sarah Mitchell', lastUpdated: '2026-04-18', publishedAt: '2026-04-18', views: 542, avgTime: '2m 50s', summary: 'How the moratorium provides temporary debt relief.' },
  { id: 'art-6', title: 'Legislative Update: Bankruptcy Reform Act 2026', category: 'legislative_updates', status: 'under_review', version: '0.3', author: 'Robert Anderson', lastUpdated: '2026-08-19', publishedAt: null, views: 45, avgTime: '8m 20s', summary: 'Summary of proposed legislative changes.' },
  { id: 'art-7', title: 'New DAS Fast-Track Process', category: 'product_guidance', status: 'draft', version: '0.1', author: 'James Wilson', lastUpdated: '2026-08-18', publishedAt: null, views: 12, avgTime: '2m 10s', summary: 'Draft guidance for the expedited DAS pathway.' },
  { id: 'art-8', title: 'Staff Guide: Handling Complex Cases', category: 'staff_training', status: 'published', version: '4.1', author: 'Karen MacLeod', lastUpdated: '2026-07-05', publishedAt: '2026-07-05', views: 2103, avgTime: '7m 15s', summary: 'Training material for complex multi-product cases.' },
  { id: 'art-9', title: 'Common Financial Tool (CFT) Updates', category: 'operational_notices', status: 'published', version: '2.3', author: 'Sarah Mitchell', lastUpdated: '2026-08-01', publishedAt: '2026-08-01', views: 891, avgTime: '3m 40s', summary: 'Latest updates to the CFT calculation methodology.' },
  { id: 'art-10', title: 'Operational Notice: System Maintenance 25 Aug', category: 'operational_notices', status: 'published', version: '1.0', author: 'Robert Anderson', lastUpdated: '2026-08-20', publishedAt: '2026-08-20', views: 324, avgTime: '1m 05s', summary: 'Planned downtime for infrastructure upgrades.' },
];

const calendarEvents = [
  { date: '22 Aug 2026', title: 'MAP Eligibility Criteria — quarterly review', type: 'Review', assignee: 'James Wilson' },
  { date: '25 Aug 2026', title: 'System Maintenance Notice — publish', type: 'Publication', assignee: 'Robert Anderson' },
  { date: '28 Aug 2026', title: 'Bankruptcy Reform Act guidance — final review', type: 'Review', assignee: 'Karen MacLeod' },
  { date: '1 Sep 2026', title: 'DAS Fast-Track Process — target publish', type: 'Publication', assignee: 'James Wilson' },
  { date: '5 Sep 2026', title: 'PTD Guide — annual review', type: 'Review', assignee: 'Sarah Mitchell' },
  { date: '12 Sep 2026', title: 'CFT Updates v2.4 — publish', type: 'Publication', assignee: 'Sarah Mitchell' },
  { date: '15 Sep 2026', title: 'Staff Training: New AI Features — draft', type: 'Publication', assignee: 'Karen MacLeod' },
  { date: '30 Sep 2026', title: 'All product guides — quarterly review', type: 'Review', assignee: 'All' },
];

const categoryLabels: Record<string, string> = {
  product_guidance: 'Product Guidance',
  legislative_updates: 'Legislative Updates',
  operational_notices: 'Operational Notices',
  staff_training: 'Staff Training',
};

const categoryColors: Record<string, string> = {
  product_guidance: 'bg-blue-100 text-blue-800',
  legislative_updates: 'bg-indigo-100 text-indigo-800',
  operational_notices: 'bg-orange-100 text-orange-800',
  staff_training: 'bg-teal-100 text-teal-800',
};

const statusColors: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-amber-100 text-amber-800',
  under_review: 'bg-purple-100 text-purple-800',
  archived: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
  published: 'Published',
  draft: 'Draft',
  under_review: 'Under Review',
  archived: 'Archived',
};

const trendData: Record<string, string> = {
  'DAS: What You Need to Know': '↑',
  'Staff Guide: Handling Complex Cases': '↑',
  'MAP Eligibility Criteria 2026': '↓',
  'PTD: A Guide for Advisers': '→',
  'Common Financial Tool (CFT) Updates': '↑',
  'Sequestration: Your Questions Answered': '→',
  'Moratorium: 6-Week Breathing Space': '↓',
  'Operational Notice: System Maintenance 25 Aug': '↑',
};

export default function KnowledgeHubPage() {
  const [activeTab, setActiveTab] = useState('articles');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [categoryFilter, statusFilter, searchQuery]);

  const chartData = useMemo(() => {
    return [...articles]
      .sort((a, b) => b.views - a.views)
      .slice(0, 8)
      .map((a) => ({ name: a.title.length > 30 ? a.title.slice(0, 30) + '...' : a.title, views: a.views }));
  }, []);

  const tabs = [
    { key: 'articles', label: 'Articles' },
    { key: 'calendar', label: 'Content Calendar' },
    { key: 'stats', label: 'Usage Stats' },
    { key: 'editor', label: 'Editor Preview' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Hub</h1>
          <p className="text-gray-600 mt-1">Manage guidance articles, policy content, and staff resources</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-600 text-blue-700 font-bold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB 1: Articles */}
        {activeTab === 'articles' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 mb-6">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="product_guidance">Product Guidance</option>
                <option value="legislative_updates">Legislative Updates</option>
                <option value="operational_notices">Operational Notices</option>
                <option value="staff_training">Staff Training</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="under_review">Under Review</option>
                <option value="archived">Archived</option>
              </select>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Articles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Version</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Author</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Updated</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Views</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{article.title}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${categoryColors[article.category]}`}>
                          {categoryLabels[article.category]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[article.status]}`}>
                          {statusLabels[article.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">v{article.version}</td>
                      <td className="py-3 px-4 text-gray-600">{article.author}</td>
                      <td className="py-3 px-4 text-gray-600">{article.lastUpdated}</td>
                      <td className="py-3 px-4 text-gray-600">{article.views.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredArticles.length === 0 && (
              <p className="text-center text-gray-500 py-8">No articles match the current filters.</p>
            )}
          </div>
        )}

        {/* TAB 2: Content Calendar */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Content Events</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {calendarEvents.map((event, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{event.date}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{event.title}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            event.type === 'Publication' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {event.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{event.assignee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Usage Stats */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Articles by Views</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Article Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Views</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Avg Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...articles]
                      .sort((a, b) => b.views - a.views)
                      .map((article) => (
                        <tr key={article.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{article.title}</td>
                          <td className="py-3 px-4 text-gray-600">{article.views.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-600">{article.avgTime}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-lg ${
                                trendData[article.title] === '↑'
                                  ? 'text-green-600'
                                  : trendData[article.title] === '↓'
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {trendData[article.title] || '→'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Editor Preview */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm p-3 flex flex-wrap gap-1">
              {['B', 'I', 'H', '• List', '1. List', 'Link', 'Image', 'Callout', 'Table'].map((btn) => (
                <button
                  key={btn}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                  disabled
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Two-column layout */}
            <div className="flex gap-6">
              {/* Left: Rendered Article */}
              <div className="w-[70%] bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">DAS: What You Need to Know</h2>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">What is DAS?</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The Debt Arrangement Scheme (DAS) is a Scottish Government-backed debt management tool that allows
                  people who are struggling with debt to repay what they owe through a single, affordable monthly payment.
                  It provides legal protection from creditor action while you make your repayments.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Who can apply?</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                  <li>You must be unable to pay your debts as they fall due</li>
                  <li>Your total debt must be between &pound;5,000 and &pound;25,000</li>
                  <li>You must have a regular income with disposable income over &pound;100/month</li>
                  <li>You must not have an active sequestration or trust deed</li>
                </ul>

                <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-3 my-6 rounded-r">
                  <p className="text-gray-800 font-medium">
                    <strong>Important</strong>: DAS provides legal protection from creditor action. Once a Debt Payment
                    Programme is approved, creditors cannot pursue you for the debts included in the programme.
                  </p>
                </blockquote>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">How the process works</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4 ml-4">
                  <li>Complete an application through IAAS or a money adviser</li>
                  <li>Our system assesses your eligibility</li>
                  <li>A Debt Payment Programme is created</li>
                  <li>Creditors are notified and cannot take action</li>
                </ol>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Key benefits</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                  <li>Legal protection from creditor action</li>
                  <li>Single affordable monthly payment</li>
                  <li>Interest and charges frozen</li>
                  <li>Managed by a certified money adviser</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Contact</h3>
                <p className="text-gray-700 leading-relaxed">
                  For more information, visit{' '}
                  <span className="text-blue-600 underline">aib.gov.uk</span> or call Citizens Advice Scotland on{' '}
                  <span className="font-medium">0800 028 1456</span>.
                </p>
              </div>

              {/* Right: Publishing Metadata */}
              <div className="w-[30%]">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Publishing Details</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        Published
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Version</span>
                      <span className="text-gray-900 font-medium">3.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Author</span>
                      <span className="text-gray-900">Karen MacLeod</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Published</span>
                      <span className="text-gray-900">10 Aug 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last edited</span>
                      <span className="text-gray-900">10 Aug 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category</span>
                      <span className="text-gray-900">Product Guidance</span>
                    </div>
                  </div>

                  {/* Workflow Progression */}
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Workflow</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white"></div>
                        <span className="text-xs text-gray-500 mt-1">Draft</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white"></div>
                        <span className="text-xs text-gray-500 mt-1">Review</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-blue-500 mx-2"></div>
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full border-2 border-blue-600 bg-blue-600"></div>
                        <span className="text-xs text-blue-700 font-medium mt-1">Published</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t space-y-2">
                    <button
                      className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                      disabled
                    >
                      Edit
                    </button>
                    <button
                      className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                      disabled
                    >
                      Unpublish
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* POC Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>POC Notice:</strong> In production, this would be a full WYSIWYG editor (TinyMCE/ProseMirror)
                with version control, approval workflows, scheduled publication, and multi-language support.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
