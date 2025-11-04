import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Announcements from "./pages/Announcements";
import Reservations from "./pages/Reservations";
import Occurrences from "./pages/Occurrences";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import Users from "./pages/Users";
import Residents from "./pages/Residents";
import Financial from "./pages/Financial";
import Condominiums from "./pages/Condominiums";
import Marketplace from "./pages/Marketplace";
import MyOrders from "./pages/MyOrders";
import ResidentsManagement from "./pages/ResidentsManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/residents" element={<Residents />} />
            <Route path="/financial" element={<Financial />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/occurrences" element={<Occurrences />} />
            <Route path="/messages" element={<Chat />} />
            <Route path="/condominiums" element={<Condominiums />} />
            <Route path="/users" element={<Users />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/orders-management" element={<MyOrders />} />
            <Route path="/residents-management" element={<ResidentsManagement />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
