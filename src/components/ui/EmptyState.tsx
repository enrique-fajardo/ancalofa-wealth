'use client';

import type { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
      <h3 className="text-lg font-semibold text-gray-800 mt-4">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-2 max-w-sm text-center">{description}</p>}
      {action && (
        <div className="mt-6">
          <Button variant="secondary" onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}
