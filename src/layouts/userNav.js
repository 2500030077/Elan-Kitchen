import { LayoutDashboard, Heart, FolderHeart, BookOpen, PlusCircle, CalendarDays, ShoppingBasket, UserCircle } from 'lucide-react';

export const USER_NAV = [
  { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/user/favorites', label: 'Favorites', icon: Heart },
  { to: '/user/collections', label: 'Collections', icon: FolderHeart },
  { to: '/user/recipes', label: 'My Recipes', icon: BookOpen, end: true },
  { to: '/user/recipes/new', label: 'Submit Recipe', icon: PlusCircle },
  { to: '/user/meal-planner', label: 'Meal Planner', icon: CalendarDays },
  { to: '/user/shopping-list', label: 'Shopping List', icon: ShoppingBasket },
  { to: '/user/profile', label: 'Profile & Settings', icon: UserCircle },
];
