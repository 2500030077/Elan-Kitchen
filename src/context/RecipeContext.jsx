import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import recipeService from '../services/recipeService';
import storage from '../services/storageService';
import { getUsers } from '../services/userService';
import { RECIPE_STATUS, STORAGE_KEYS } from '../utils/constants';
import { useAuth } from './AuthContext';

const RecipeContext = createContext(null);

const WATCHED = new Set([
  STORAGE_KEYS.RECIPES,
  STORAGE_KEYS.REVIEWS,
  STORAGE_KEYS.FAVORITES,
  STORAGE_KEYS.COLLECTIONS,
  STORAGE_KEYS.CATEGORIES,
  STORAGE_KEYS.USERS,
]);

/**
 * Provides recipe-domain data derived from Local Storage. A version counter
 * bumps on every relevant storage write so derived data recomputes.
 */
export function RecipeProvider({ children }) {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const unsub = storage.subscribe((evt) => {
      if (evt.type === 'change' && WATCHED.has(evt.key)) bump();
    });
    const onStorage = (e) => {
      if (!e.key || WATCHED.has(e.key)) bump();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsub();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const data = useMemo(() => {
    const reviews = recipeService.getReviews();
    const favorites = storage.getAll(STORAGE_KEYS.FAVORITES);
    const users = getUsers();
    const categories = recipeService.getCategories();
    const allRecipes = recipeService.enrichRecipes(recipeService.getRecipes(), { reviews, favorites, users, categories });
    return {
      allRecipes,
      approvedRecipes: allRecipes.filter((r) => r.status === RECIPE_STATUS.APPROVED),
      reviews,
      users,
      categories,
      favorites,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const favoriteIds = useMemo(
    () => new Set(user ? data.favorites.filter((f) => f.userId === user.id).map((f) => f.recipeId) : []),
    [data.favorites, user],
  );

  const collections = useMemo(
    () => (user ? recipeService.getCollections(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, version],
  );

  const recipeMap = useMemo(() => new Map(data.allRecipes.map((r) => [r.id, r])), [data.allRecipes]);
  const getRecipe = useCallback((id) => recipeMap.get(id) || null, [recipeMap]);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo(
    () => ({ ...data, favoriteIds, collections, getRecipe, recipeMap, refresh, version }),
    [data, favoriteIds, collections, getRecipe, recipeMap, refresh, version],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export const useRecipes = () => {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipeProvider');
  return ctx;
};
