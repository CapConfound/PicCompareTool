import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SetupView } from './views/SetupView';
import { GroupingView } from './views/GroupingView';
import { ComparisonView } from './views/ComparisonView';
import { RankingView } from './views/RankingView';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/setup" element={<SetupView />} />
        <Route path="/group/:phone" element={<GroupingView />} />
        <Route path="/compare" element={<ComparisonView />} />
        <Route path="/rank" element={<RankingView />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    </HashRouter>
  );
}
