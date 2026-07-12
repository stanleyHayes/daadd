import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';


// Layouts
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PublicLayout } from '@/layouts/PublicLayout';

// UI
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ScrollToTopOnRouteChange } from '@/components/ui/ScrollToTopOnRouteChange';
import { SplashScreen } from '@/components/layout/SplashScreen';

// Auth
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Public Pages
import { LandingPage } from '@/pages/public/LandingPage';
import { AdCatalogPage } from '@/pages/public/AdCatalogPage';
import { AdDetailPage } from '@/pages/public/AdDetailPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { BlogPage } from '@/pages/public/BlogPage';
import { BlogPostDetailPage } from '@/pages/public/BlogPostDetailPage';
import { CareersPage } from '@/pages/public/CareersPage';
import { PrivacyPage } from '@/pages/public/PrivacyPage';
import { TermsPage } from '@/pages/public/TermsPage';
import { CookiePolicyPage } from '@/pages/public/CookiePolicyPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { PartnersPage } from '@/pages/public/PartnersPage';
import { PartnerDetailPage } from '@/pages/public/PartnerDetailPage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';

// Dashboard Pages
import { DashboardHome } from '@/pages/dashboard/DashboardHome';
import { CampaignsListPage } from '@/pages/dashboard/CampaignsListPage';
import { CampaignCreatePage } from '@/pages/dashboard/CampaignCreatePage';
import { CampaignEditPage } from '@/pages/dashboard/CampaignEditPage';
import { CampaignDetailPage } from '@/pages/dashboard/CampaignDetailPage';
import { AnalyticsPage } from '@/pages/dashboard/AnalyticsPage';
import { HeatmapPage } from '@/pages/dashboard/HeatmapPage';
import { AIOptimizationPage } from '@/pages/dashboard/AIOptimizationPage';
import { AnomaliesPage } from '@/pages/dashboard/AnomaliesPage';
import { BenchmarkingPage } from '@/pages/dashboard/BenchmarkingPage';
import { StorytellerPage } from '@/pages/dashboard/StorytellerPage';
import { TeamPage } from '@/pages/dashboard/TeamPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTopOnRouteChange />
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" />
          ) : (
            <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/ads" element={<AdCatalogPage />} />
            <Route path="/ads/:id" element={<AdDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogPostDetailPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/partners/:slug" element={<PartnerDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Auth Routes (no layout wrapper) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/dashboard/campaigns" element={<CampaignsListPage />} />
              <Route path="/dashboard/campaigns/new" element={<CampaignCreatePage />} />
              <Route path="/dashboard/campaigns/:id/edit" element={<CampaignEditPage />} />
              <Route path="/dashboard/campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
              <Route path="/dashboard/heatmaps" element={<HeatmapPage />} />
              <Route element={<ProtectedRoute allowedRoles={['admin', 'advertiser']} />}>
                <Route path="/dashboard/ai-optimization" element={<AIOptimizationPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['admin', 'advertiser', 'campaign_manager']} />}>
                <Route path="/dashboard/anomalies" element={<AnomaliesPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['admin', 'advertiser', 'analyst']} />}>
                <Route path="/dashboard/benchmarking" element={<BenchmarkingPage />} />
                <Route path="/dashboard/storyteller" element={<StorytellerPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['admin', 'advertiser', 'campaign_manager']} />}>
                <Route path="/dashboard/team" element={<TeamPage />} />
              </Route>
              <Route path="/dashboard/profile" element={<ProfilePage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
          </Routes>
          )}
        </AnimatePresence>
      </ErrorBoundary>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-card-bg)',
            color: 'var(--color-text-primary)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1rem',
          },
          success: {
            iconTheme: { primary: 'var(--color-secondary-500)', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: 'var(--color-danger-500)', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
