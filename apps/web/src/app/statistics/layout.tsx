import RequireAibStaff from '../RequireAibStaff';

// Statistics & analytics are internal AiB-only — guarded against direct-URL
// access to match the hidden menu item.
export default function StatisticsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAibStaff>{children}</RequireAibStaff>;
}
