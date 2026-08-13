import React, { useEffect, useRef } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useRecordPageView } from '@workspace/api-client-react';

import { Shell } from '@/components/layout/Shell';
import { AdminLayout } from '@/components/layout/AdminLayout';
import Home from '@/pages/Home';
import History from '@/pages/History';
import Distribution from '@/pages/Distribution';
import Sustainability from '@/pages/Sustainability';
import Catalog from '@/pages/Catalog';
import ProductDetail from '@/pages/ProductDetail';
import Contact from '@/pages/Contact';
import Unsubscribe from '@/pages/Unsubscribe';
import AdminLogin from '@/pages/admin/Login';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminCollections from '@/pages/admin/Collections';
import ProductForm from '@/pages/admin/ProductForm';
import AdminImport from '@/pages/admin/AdminImport';
import AdminBrochures from '@/pages/admin/AdminBrochures';
import AdminPriceLists from '@/pages/admin/AdminPriceLists';
import AdminOrderForms from '@/pages/admin/AdminOrderForms';
import Portal from '@/pages/Portal';
import Brochures from '@/pages/Brochures';
import PriceLists from '@/pages/PriceLists';
import OrderForms from '@/pages/OrderForms';
import OrderFormView from '@/pages/OrderFormView';
import NotFound from '@/pages/not-found';
import AdminApplications from '@/pages/admin/Applications';
import AdminUnsubscribeRequests from '@/pages/admin/UnsubscribeRequests';
import AdminPortalSettings from '@/pages/admin/PortalSettings';
import AdminAnalytics from '@/pages/admin/Analytics';
import AdminSecurity from '@/pages/admin/Security';
import AdminForgotPassword from '@/pages/admin/ForgotPassword';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

/** Fires a fire-and-forget pageview log whenever the public site's route changes. */
function PageViewTracker() {
  const [pathname] = useLocation();
  const recordPageView = useRecordPageView();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    recordPageView.mutate({ data: { path: pathname } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/forgot-password" component={AdminForgotPassword} />
      <Route path="/admin/brochures">
        {() => (
          <AdminLayout>
            <AdminBrochures />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/price-lists">
        {() => (
          <AdminLayout>
            <AdminPriceLists />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/order-forms">
        {() => (
          <AdminLayout>
            <AdminOrderForms />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/import">
        {() => (
          <AdminLayout>
            <AdminImport />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/applications">
        {() => (
          <AdminLayout>
            <AdminApplications />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/unsubscribe-requests">
        {() => (
          <AdminLayout>
            <AdminUnsubscribeRequests />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/portal-settings">
        {() => (
          <AdminLayout>
            <AdminPortalSettings />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/analytics">
        {() => (
          <AdminLayout>
            <AdminAnalytics />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/security">
        {() => (
          <AdminLayout>
            <AdminSecurity />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/collections">
        {() => (
          <AdminLayout>
            <AdminCollections />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/products/new">
        {() => (
          <AdminLayout>
            <ProductForm />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/products/:id/edit">
        {() => (
          <AdminLayout>
            <ProductForm />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        )}
      </Route>
      <Route>
        {() => (
          <Shell>
            <PageViewTracker />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/history" component={History} />
              <Route path="/distribution" component={Distribution} />
              <Route path="/sustainability" component={Sustainability} />
              <Route path="/catalog" component={Catalog} />
              <Route path="/product/:id" component={ProductDetail} />
              <Route path="/portal" component={Portal} />
              <Route path="/portal/brochures" component={Brochures} />
              <Route path="/portal/price-lists" component={PriceLists} />
              <Route path="/portal/order-forms/:id" component={OrderFormView} />
              <Route path="/portal/order-forms" component={OrderForms} />
              <Route path="/contact" component={Contact} />
              <Route path="/unsubscribe" component={Unsubscribe} />
              <Route component={NotFound} />
            </Switch>
          </Shell>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
