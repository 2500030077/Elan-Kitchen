import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center rounded-card border border-dashed border-ivory-300 bg-white/60 px-6 py-14 text-center ${className}`}
    >
      {Icon && (
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-forest-50 text-forest">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </motion.div>
  );
}
