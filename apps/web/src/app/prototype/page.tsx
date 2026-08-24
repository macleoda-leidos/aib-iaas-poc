import { CoverPage } from './sections/CoverPage';
import { TableOfContents } from './sections/TableOfContents';
import { JourneyMap } from './sections/JourneyMap';
import { HomeScreen } from './sections/HomeScreen';
import { LoginScreens } from './sections/LoginScreens';
import { PortalScreens } from './sections/PortalScreens';
import { ApplySteps } from './sections/ApplySteps';
import { DashboardScreens } from './sections/DashboardScreens';
import { CaseDetailScreens } from './sections/CaseDetailScreens';
import { AdminScreens } from './sections/AdminScreens';

export default function PrototypePage() {
  return (
    <div className="prototype-container">
      <CoverPage />
      <TableOfContents />
      <JourneyMap />
      <HomeScreen />
      <LoginScreens />
      <PortalScreens />
      <ApplySteps />
      <DashboardScreens />
      <CaseDetailScreens />
      <AdminScreens />
    </div>
  );
}
