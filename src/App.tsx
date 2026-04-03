import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { CriteriaPage } from '@/pages/CriteriaPage'
import { DashboardPage } from '@/pages/Dashboard'
import {
  AccountingModulePage,
  AdminModulePage,
  BudgetModulePage,
  LoansModulePage,
  OperationsModulePage,
  ReportsModulePage,
  TreasuryModulePage,
} from '@/pages/ModulePages'
import { MemberDetailPage } from '@/pages/MemberDetail'
import { MembersPage } from '@/pages/Members'
import { PatronagePage } from '@/pages/PatronagePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/modules/loans" element={<LoansModulePage />} />
          <Route path="/modules/treasury" element={<TreasuryModulePage />} />
          <Route path="/modules/accounting" element={<AccountingModulePage />} />
          <Route path="/modules/operations" element={<OperationsModulePage />} />
          <Route path="/modules/reports" element={<ReportsModulePage />} />
          <Route path="/modules/budget" element={<BudgetModulePage />} />
          <Route path="/modules/admin" element={<AdminModulePage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
          <Route path="/patronage" element={<PatronagePage />} />
          <Route path="/criteria" element={<CriteriaPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
