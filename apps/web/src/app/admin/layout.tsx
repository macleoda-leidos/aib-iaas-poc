import RequireAibStaff from '../RequireAibStaff';

// All /admin pages are internal AiB tools — guarded so a non-AiB user who types
// the URL directly gets an unauthorised notice, matching the hidden menu item.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireAibStaff>{children}</RequireAibStaff>;
}
