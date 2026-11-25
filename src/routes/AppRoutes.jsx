import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import UserLayout from '../layouts/UserLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute, { GuestOnlyRoute } from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import HomePage from '../pages/public/HomePage';

// Route-based code splitting: everything except the landing page loads on demand.
const ExplorePage = lazy(() => import('../pages/public/ExplorePage'));
const RecipeDetailPage = lazy(() => import('../pages/public/RecipeDetailPage'));
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));
const PrivacyPage = lazy(() => import('../pages/public/PrivacyPage'));
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));

const DashboardPage = lazy(() => import('../pages/user/DashboardPage'));
const FavoritesPage = lazy(() => import('../pages/user/FavoritesPage'));
const CollectionsPage = lazy(() => import('../pages/user/CollectionsPage'));
const CollectionDetailPage = lazy(() => import('../pages/user/CollectionDetailPage'));
const MyRecipesPage = lazy(() => import('../pages/user/MyRecipesPage'));
const RecipeEditorPage = lazy(() => import('../pages/user/RecipeEditorPage'));
const MealPlannerPage = lazy(() => import('../pages/user/MealPlannerPage'));
const ShoppingListPage = lazy(() => import('../pages/user/ShoppingListPage'));
const ProfilePage = lazy(() => import('../pages/user/ProfilePage'));

const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminRecipesPage = lazy(() => import('../pages/admin/AdminRecipesPage'));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage'));
const AdminReviewsPage = lazy(() => import('../pages/admin/AdminReviewsPage'));
const AdminActivityPage = lazy(() => import('../pages/admin/AdminActivityPage'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="recipes/:id" element={<RecipeDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route element={<GuestOnlyRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="user" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="collections/:id" element={<CollectionDetailPage />} />
        <Route path="recipes" element={<MyRecipesPage />} />
        <Route path="recipes/new" element={<RecipeEditorPage />} />
        <Route path="recipes/:id/edit" element={<RecipeEditorPage />} />
        <Route path="meal-planner" element={<MealPlannerPage />} />
        <Route path="shopping-list" element={<ShoppingListPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage inline />} />
      </Route>

      <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="recipes" element={<AdminRecipesPage />} />
        <Route path="recipes/:id/edit" element={<RecipeEditorPage admin />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="activity" element={<AdminActivityPage />} />
        <Route path="*" element={<NotFoundPage inline />} />
      </Route>
    </Routes>
  );
}
