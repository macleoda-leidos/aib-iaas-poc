'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';

// ─── Synthetic Security Event Data ───────────────────────────────────────────

const THREAT_IPS = [
  '185.220.101.42', '23.129.64.210', '104.244.76.13', '171.25.193.78',
  '192.42.116.16', '45.154.255.147', '89.234.157.254', '162.247.74.27',
  '51.15.43.205', '185.165.168.229', '103.251.167.10', '94.230.208.147',
];

const ATTACK_TYPES = ['Brute Force', 'SQL Injection', 'XSS Attempt', 'Path Traversal', 'Credential Stuffing', 'DDoS Probe', 'API Abuse', 'Session Hijack'];
const SOURCES = ['CloudWatch', 'Sophos', 'Sysmon', 'WAF', 'Tenable', 'Keycloak'];
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;

const EVENT_TEMPLATES = [
  { source: 'WAF', severity: 'high', msg: 'SQL injection blocked: %IP% → /api/applications?id=1 OR 1=1', type: 'SQL Injection' },
  { source: 'WAF', severity: 'medium', msg: 'XSS attempt blocked: %IP% → /api/postcode?q=<script>alert(1)</script>', type: 'XSS Attempt' },
  { source: 'WAF', severity: 'high', msg: 'Path traversal blocked: %IP% → /api/documents/../../../../etc/passwd', type: 'Path Traversal' },
  { source: 'Keycloak', severity: 'medium', msg: 'Failed MFA attempt: user f.macdonald@aib.gov.uk from %IP% (attempt 3/5)', type: 'Brute Force' },
  { source: 'Keycloak', severity: 'high', msg: 'Account locked: d.smith@external.org — 5 failed attempts in 2 minutes from %IP%', type: 'Brute Force' },
  { source: 'Keycloak', severity: 'low', msg: 'Unusual login time: k.macleod@aib.gov.uk at 02:47 from %IP% (normal: 08:30-18:00)', type: 'Credential Stuffing' },
  { source: 'CloudWatch', severity: 'info', msg: 'Rate limit triggered: %IP% — 150 requests/min to /api/applications (threshold: 100)', type: 'API Abuse' },
  { source: 'CloudWatch', severity: 'medium', msg: 'Elevated error rate: 5xx responses at 4.2% (threshold: 2%) — api-gateway service', type: 'DDoS Probe' },
  { source: 'CloudWatch', severity: 'low', msg: 'Lambda cold start spike: recommendation-service 12 concurrent invocations', type: 'API Abuse' },
  { source: 'Sophos', severity: 'critical', msg: 'Malware quarantined: Trojan.GenericKD.46789 on AIBWS-023 (user: temp-contractor)', type: 'Session Hijack' },
  { source: 'Sophos', severity: 'high', msg: 'Suspicious outbound connection: AIBSRV-API-01 → 185.220.101.42:4443 (C2 indicator)', type: 'Session Hijack' },
  { source: 'Sophos', severity: 'medium', msg: 'PUA detected: PUA/InstallCore on AIBWS-015 — auto-quarantined', type: 'DDoS Probe' },
  { source: 'Sysmon', severity: 'high', msg: 'Process creation: powershell.exe -enc [Base64] executed by svchost.exe on AIBSRV-DB-01', type: 'Path Traversal' },
  { source: 'Sysmon', severity: 'medium', msg: 'Registry modification: HKLM\\System\\CurrentControlSet\\Services\\WinDefend\\Start → 4 (disabled)', type: 'Path Traversal' },
  { source: 'Sysmon', severity: 'high', msg: 'Network connection: cmd.exe → 45.154.255.147:8080 (known C2) on AIBWS-023', type: 'Session Hijack' },
  { source: 'Sysmon', severity: 'low', msg: 'File created: C:\\Windows\\Temp\\svc_update.exe (unsigned, size: 2.4MB) on AIBWS-008', type: 'Path Traversal' },
  { source: 'Tenable', severity: 'critical', msg: 'CVE-2024-3094 (xz backdoor) — AIBSRV-BUILD-01 vulnerable — CVSS 10.0', type: 'SQL Injection' },
  { source: 'Tenable', severity: 'high', msg: 'CVE-2024-21762 (FortiOS RCE) — AIBFW-01 — patch available since Feb 2024', type: 'DDoS Probe' },
  { source: 'WAF', severity: 'medium', msg: 'Credential stuffing detected: 47 unique credentials tested from %IP% in 5 minutes', type: 'Credential Stuffing' },
  { source: 'CloudWatch', severity: 'info', msg: 'GuardDuty: Reconnaissance probe from %IP% — port scan on VPC subnet 10.0.1.0/24', type: 'DDoS Probe' },
];

function generateEvent(index: number) {
  const template = EVENT_TEMPLATES[index % EVENT_TEMPLATES.length];
  const ip = THREAT_IPS[Math.floor(index * 7.3) % THREAT_IPS.length];
  const now = new Date();
  now.setMinutes(now.getMinutes() - Math.floor(index * 2.7));
  return {
    id: `EVT-${String(10000 - index).padStart(5, '0')}`,
    timestamp: now.toISOString(),
    time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    source: template.source,
    severity: template.severity as typeof SEVERITIES[number],
    message: template.msg.replace('%IP%', ip),
    type: template.type,
    ip,
  };
}

// Attack timeline (hourly data for last 24h)
const ATTACK_TIMELINE = Array.from({ length: 24 }, (_, i) => {
  const hour = (new Date().getHours() - 23 + i + 24) % 24;
  const base = Math.floor(Math.sin(i / 3) * 5 + 8);
  return {
    hour: `${String(hour).padStart(2, '0')}:00`,
    blocked: base + Math.floor(i * 0.7),
    detected: Math.max(0, Math.floor(base * 0.3)),
    investigating: i > 18 ? Math.floor(Math.random() * 3) : 0,
  };
});

// Vulnerability data
const VULN_DATA = [
  { severity: 'Critical', count: 3, color: '#d4351c' },
  { severity: 'High', count: 12, color: '#f47738' },
  { severity: 'Medium', count: 34, color: '#ffdd00' },
  { severity: 'Low', count: 67, color: '#00703c' },
  { severity: 'Info', count: 142, color: '#1d70b8' },
];

// Endpoint status
const ENDPOINTS = [
  { name: 'AIBSRV-API-01', type: 'Server', status: 'protected', lastScan: '14:23', threats: 0 },
  { name: 'AIBSRV-API-02', type: 'Server', status: 'protected', lastScan: '14:23', threats: 0 },
  { name: 'AIBSRV-DB-01', type: 'Server', status: 'warning', lastScan: '13:45', threats: 1 },
  { name: 'AIBSRV-BUILD-01', type: 'Server', status: 'critical', lastScan: '10:30', threats: 2 },
  { name: 'AIBSRV-KEYCLOAK', type: 'Server', status: 'protected', lastScan: '14:20', threats: 0 },
  { name: 'AIBWS-001 (K.MacLeod)', type: 'Workstation', status: 'protected', lastScan: '14:15', threats: 0 },
  { name: 'AIBWS-008 (S.Mitchell)', type: 'Workstation', status: 'warning', lastScan: '12:00', threats: 1 },
  { name: 'AIBWS-015 (J.Robertson)', type: 'Workstation', status: 'protected', lastScan: '14:10', threats: 0 },
  { name: 'AIBWS-023 (Contractor)', type: 'Workstation', status: 'critical', lastScan: '09:15', threats: 3 },
];

// Incidents
const INCIDENTS = [
  { id: 'INC-001', title: 'Malware detection on contractor workstation', severity: 'critical', status: 'investigating', assignee: 'R. MacIntyre', system: 'AIBWS-023', age: '2h 15m' },
  { id: 'INC-002', title: 'Suspicious outbound C2 connection', severity: 'high', status: 'investigating', assignee: 'R. MacIntyre', system: 'AIBSRV-API-01', age: '4h 30m' },
  { id: 'INC-003', title: 'Critical vulnerability on build server', severity: 'high', status: 'open', assignee: 'Unassigned', system: 'AIBSRV-BUILD-01', age: '6h' },
  { id: 'INC-004', title: 'Brute force attack on Keycloak (blocked)', severity: 'medium', status: 'resolved', assignee: 'R. MacIntyre', system: 'Keycloak', age: '12h' },
  { id: 'INC-005', title: 'WAF rule triggered — SQL injection campaign', severity: 'medium', status: 'resolved', assignee: 'Auto-resolved', system: 'WAF', age: '18h' },
];

// ─── Page Component ──────────────────────────────────────────────────────────

export default function SecurityPage() {
  const [events, setEvents] = useState(() => Array.from({ length: 30 }, (_, i) => generateEvent(i)));
  const [filter, setFilter] = useState<{ source: string; severity: string }>({ source: 'all', severity: 'all' });
  const [eventCount, setEventCount] = useState(30);
  const feedRef = useRef<HTMLDivElement>(null);

  // Simulate live event stream
  useEffect(() => {
    const interval = setInterval(() => {
      setEventCount(prev => prev + 1);
      setEvents(prev => [generateEvent(prev.length + Math.floor(Math.random() * 100)), ...prev].slice(0, 100));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(e =>
    (filter.source === 'all' || e.source === filter.source) &&
    (filter.severity === 'all' || e.severity === filter.severity)
  );

  const sevColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'text-red-400 bg-red-950 border-red-800';
      case 'high': return 'text-orange-400 bg-orange-950 border-orange-800';
      case 'medium': return 'text-yellow-400 bg-yellow-950 border-yellow-800';
      case 'low': return 'text-green-400 bg-green-950 border-green-800';
      default: return 'text-blue-400 bg-blue-950 border-blue-800';
    }
  };

  const sevBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'investigating': return 'bg-amber-600 text-white';
      case 'open': return 'bg-red-600 text-white';
      case 'resolved': return 'bg-green-700 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 -mt-0">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ─── Threat Level Banner ────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-amber-950 to-red-950 border border-amber-700 rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center animate-pulse">
              <span className="text-2xl font-black text-white">⚠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-200">THREAT LEVEL: ELEVATED</h1>
              <p className="text-sm text-amber-300">Active campaign detected — credential stuffing + malware delivery</p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div><p className="text-2xl font-bold text-red-400">2</p><p className="text-xs text-gray-400">Active Incidents</p></div>
            <div><p className="text-2xl font-bold text-amber-400">3</p><p className="text-xs text-gray-400">Under Investigation</p></div>
            <div><p className="text-2xl font-bold text-green-400">47</p><p className="text-xs text-gray-400">Blocked Today</p></div>
            <div><p className="text-2xl font-bold text-blue-400">99.2%</p><p className="text-xs text-gray-400">Uptime</p></div>
          </div>
        </div>

        {/* ─── Attack Timeline (24h) ──────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-gray-200">🛡️ Attack Attempts — Last 24 Hours</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ATTACK_TIMELINE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
              <Area type="monotone" dataKey="blocked" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Blocked" />
              <Area type="monotone" dataKey="detected" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Detected" />
              <Area type="monotone" dataKey="investigating" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Investigating" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* ─── Sophos Endpoint Status ─────────────────────────────── */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-200">🔒 Sophos Endpoint Protection</h2>
            <div className="space-y-2">
              {ENDPOINTS.map((ep, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-gray-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${ep.status === 'protected' ? 'bg-green-500' : ep.status === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                    <span className="font-mono">{ep.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{ep.lastScan}</span>
                    {ep.threats > 0 && <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">{ep.threats} threat{ep.threats > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
              <span>Definitions: 2026.08.14.002</span>
              <span>Next full scan: 18:00</span>
            </div>
          </div>

          {/* ─── Tenable Vulnerabilities ────────────────────────────── */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-200">🎯 Tenable Vulnerability Summary</h2>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={VULN_DATA} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis dataKey="severity" type="category" tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {VULN_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800 p-2 rounded">
                <p className="text-gray-400">Last Scan</p>
                <p className="font-bold">14 Aug 2026, 06:00</p>
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <p className="text-gray-400">Remediation Progress</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <span className="font-bold text-green-400">72%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Live Event Stream ───────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
              📡 Live Security Events
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </h2>
            <div className="flex gap-2">
              <select value={filter.source} onChange={e => setFilter(f => ({ ...f, source: e.target.value }))}
                className="bg-gray-800 border border-gray-700 text-sm rounded px-2 py-1 text-gray-300">
                <option value="all">All Sources</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))}
                className="bg-gray-800 border border-gray-700 text-sm rounded px-2 py-1 text-gray-300">
                <option value="all">All Severity</option>
                {SEVERITIES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <div ref={feedRef} className="h-64 overflow-y-auto space-y-1 font-mono text-xs">
            {filteredEvents.slice(0, 25).map((event, i) => (
              <div key={event.id + i} className={`p-2 rounded border ${sevColor(event.severity)} ${i === 0 ? 'animate-pulse' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-16 flex-shrink-0">{event.time}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold uppercase ${sevBadge(event.severity)}`}>{event.severity.slice(0, 4)}</span>
                  <span className="text-gray-400 w-20 flex-shrink-0">[{event.source}]</span>
                  <span className="flex-1 truncate">{event.message}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">{filteredEvents.length} events in view • Total processed today: 1,247</p>
        </div>

        {/* ─── Incident Timeline ───────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-gray-200">🚨 Active Incidents</h2>
          <div className="space-y-3">
            {INCIDENTS.map(inc => (
              <div key={inc.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded border border-gray-700">
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${sevBadge(inc.severity)}`}>{inc.severity}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{inc.title}</p>
                  <p className="text-xs text-gray-400">{inc.id} • {inc.system} • {inc.age} ago</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">{inc.assignee}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusBadge(inc.status)}`}>{inc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Access Anomalies + Sysmon ───────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Access Anomalies */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-200">👤 Access Anomalies</h2>
            <div className="space-y-3">
              {[
                { user: 'f.macdonald@aib.gov.uk', event: 'Failed MFA x3', time: '14:30', risk: 'high' },
                { user: 'd.smith@external.org', event: 'Account locked', time: '14:15', risk: 'critical' },
                { user: 'k.macleod@aib.gov.uk', event: 'Login at 02:47', time: '02:47', risk: 'medium' },
                { user: 'j.robertson@cas.org', event: 'Concurrent sessions (3)', time: '13:55', risk: 'low' },
                { user: 'contractor-temp-01', event: 'Privilege escalation attempt', time: '09:22', risk: 'critical' },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-800 rounded text-xs">
                  <div>
                    <p className="font-mono font-bold">{a.user}</p>
                    <p className="text-gray-500">{a.event}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{a.time}</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${sevBadge(a.risk)}`}>{a.risk}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sysmon Alerts */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-200">⚙️ Sysmon Process Alerts</h2>
            <div className="space-y-3">
              {[
                { process: 'powershell.exe -enc [B64]', host: 'AIBSRV-DB-01', parent: 'svchost.exe', risk: 'high' },
                { process: 'cmd.exe → 45.154.255.147:8080', host: 'AIBWS-023', parent: 'explorer.exe', risk: 'critical' },
                { process: 'reg.exe DELETE WinDefend', host: 'AIBWS-023', parent: 'cmd.exe', risk: 'high' },
                { process: 'certutil -urlcache -f http://...', host: 'AIBWS-023', parent: 'cmd.exe', risk: 'high' },
                { process: 'whoami /priv', host: 'AIBSRV-BUILD-01', parent: 'node.exe', risk: 'medium' },
              ].map((s, i) => (
                <div key={i} className="p-2 bg-gray-800 rounded text-xs border-l-2 border-l-red-600">
                  <p className="font-mono font-bold text-red-300">{s.process}</p>
                  <p className="text-gray-500">Host: {s.host} • Parent: {s.parent}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-600 text-center mt-6">
          AiB Security Operations Center • Synthetic demonstration data • OFFICIAL-SENSITIVE
        </p>
      </div>
    </div>
  );
}
