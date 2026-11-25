import { motion } from 'framer-motion';
import RecipeCard from './RecipeCard';

export default function RecipeGrid({ recipes, columns = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', renderFooter }) {
  return (
    <ul className={`grid gap-6 ${columns}`}>
      {recipes.map((r, i) => (
        <motion.li key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}>
          <RecipeCard recipe={r} eager={i < 4} footer={renderFooter?.(r)} />
        </motion.li>
      ))}
    </ul>
  );
}
