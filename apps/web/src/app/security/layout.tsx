import RequireAibStaff from '../RequireAibStaff';

// The Security Operations area is internal AiB-only — guarded against direct-URL
// access to match the hidden menu item.
export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return <RequireAibStaff>{children}</RequireAibStaff>;
}
