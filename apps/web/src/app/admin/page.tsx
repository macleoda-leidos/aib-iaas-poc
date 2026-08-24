'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '../AuthGuard';

const ADMIN_FEATURES = [
  {
    href: '/admin/rules',
    icon: '⚙️',
    name: 'Rules Engine',
    description: 'Configure and test recommendation rules. Interactive rule tester with version history.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/digital-mailroom',
    icon: '🤖',
    name: 'Digital Mailroom',
    description: 'AI-powered document processing pipeline. OCR, NER, classification, auto-routing, workflow triggers.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/ai-governance',
    icon: '🛡️',
    name: 'AI Governance',
    description: 'Oversight of AI decisions. Bias metrics, confidence tracking, override audit, model registry.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/knowledge-hub',
    icon: '📚',
    name: 'Knowledge Hub',
    description: 'Content management for guidance articles. Publish workflow, version control, usage analytics.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/policy-simulation',
    icon: '🔬',
    name: 'Policy Simulation',
    description: 'What-if analysis. Adjust rule thresholds and see impact on 100 historical cases in real-time.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/users',
    icon: '👥',
    name: 'Users & Roles',
    description: 'User management, role assignment, bulk actions. 500 users across 9 RBAC roles.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/organisations',
    icon: '🏢',
    name: 'Organisations',
    description: 'Organisation hierarchy, type management (AiB, Money Advisers, Creditors, Trustees, Suppliers).',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/export',
    icon: '📥',
    name: 'Data Export',
    description: 'Export applications and audit data as CSV or PDF for compliance and reporting.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/reports',
    icon: '📊',
    name: 'Report Builder',
    description: 'Custom reports with filters by product, status, date range, and region.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/activity',
    icon: '📈',
    name: 'Activity Heatmap',
    description: 'Visual calendar showing case processing activity over 12 months.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/system-health',
    icon: '💚',
    name: 'System Health',
    description: 'Service monitoring — uptime, latency, error rates, incident log.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/feature-flags',
    icon: '🚩',
    name: 'Feature Flags',
    description: 'Enable/disable features per role with instant propagation.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/notifications-hub',
    icon: '📧',
    name: 'Notifications Hub',
    description: 'GOV.UK Notify integration — templates, delivery tracking, SMS/email channels.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/open-banking',
    icon: '🏦',
    name: 'Open Banking',
    description: 'Automated income verification via bank connections. Transaction analysis and consent management.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/digital-signature',
    icon: '✍️',
    name: 'Digital Signature',
    description: 'E-signature capture for declarations. eIDAS-compliant electronic signing workflow.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/consent',
    icon: '🔒',
    name: 'Consent Management',
    description: 'GDPR consent tracking — preferences, history, data subject rights, privacy notices.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/data-retention',
    icon: '🗄️',
    name: 'Data Retention',
    description: 'Retention policies, auto-archival schedules, storage monitoring, and compliance deadlines.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/accessibility-checker',
    icon: '♿',
    name: 'Accessibility Checker',
    description: 'Live WCAG 2.1 AA compliance — page scores, issue tracking, fix suggestions.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/performance',
    icon: '⚡',
    name: 'Performance',
    description: 'Page load times, Core Web Vitals, Lighthouse scores, API latency monitoring.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/changelog',
    icon: '📋',
    name: 'Changelog',
    description: 'Release history — sprint-by-sprint feature notes from v0.1.0 to latest.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/voice-input',
    icon: '🎤',
    name: 'Voice Input',
    description: 'Speech-to-text for form filling.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/qr-login',
    icon: '📱',
    name: 'QR Login',
    description: 'Scan QR code with phone to authenticate instantly.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/biometric',
    icon: '👆',
    name: 'Biometric Auth',
    description: 'Fingerprint and Face ID authentication simulation.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/document-scanner',
    icon: '📷',
    name: 'Document Scanner',
    description: 'Camera-based document capture with OCR.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/collaboration',
    icon: '👥',
    name: 'Collaboration',
    description: 'Real-time multi-user case viewing and editing.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/ai-explainability',
    icon: '🧠',
    name: 'AI Explainability',
    description: 'Visual decision tree showing how AI reaches recommendations.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/carbon-tracker',
    icon: '🌱',
    name: 'Carbon Tracker',
    description: 'Digital-first sustainability metrics and savings.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/satisfaction',
    icon: '😊',
    name: 'Citizen Satisfaction',
    description: 'NPS survey results, feedback quotes, satisfaction trends.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/workflow-engine',
    icon: '🔄',
    name: 'Workflow Engine',
    description: 'Visual case lifecycle state machine with transition rules and SLA timers.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/mi-reports',
    icon: '📈',
    name: 'MI Reports',
    description: 'Management information — KPIs, SLA compliance, staff performance, trends.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/integration-monitor',
    icon: '🔗',
    name: 'Integration Monitor',
    description: 'Live health status of all 6 AiB system connections.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/correspondence-scheduler',
    icon: '📅',
    name: 'Correspondence Scheduler',
    description: 'Automated letter scheduling with rules and calendar view.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
  {
    href: '/admin/dev',
    icon: '📖',
    name: 'Documentation',
    description: 'Browse all 60 project documents inline with rendered Markdown and Mermaid diagrams.',
    status: 'Live',
    statusColour: 'bg-green-100 text-green-800',
  },
];

export default function AdminPortalPage() {
  const [currentUser, setCurrentUser] = useState({ name: 'Admin', roleLabel: 'System Admin' });

  useEffect(() => {
    const stored = sessionStorage.getItem('iaas-current-user') || localStorage.getItem('iaas-current-user');
    if (stored) {
      try { const u = JSON.parse(stored); setCurrentUser(u); } catch {}
    }
  }, []);

  return (
    <AuthGuard requiredRole="staff">
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Administration Portal</h1>
        <p className="text-gray-600 dark:text-gray-400">Platform administration, policy management, AI governance, and operational tools.</p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-green-700 dark:text-green-400 font-medium">All admin services operational</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 dark:text-gray-400">Logged in as: {currentUser.name} ({currentUser.roleLabel})</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADMIN_FEATURES.map(feature => (
          <Link
            key={feature.name}
            href={feature.href}
            className="block border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all no-underline text-inherit group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{feature.icon}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${feature.statusColour}`}>
                {feature.status}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-400">{feature.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>POC Note:</strong> In production, admin features would require Senior Officer or System Administrator role to access.
          Access is controlled via Keycloak RBAC with MFA enforcement for all administrative functions.
        </p>
      </div>
    </div>
    </AuthGuard>
  );
}
