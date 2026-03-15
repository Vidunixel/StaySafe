import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ToggleCardProps = {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
};

export default function ToggleCard({
  active,
  onClick,
  icon,
  title,
  description,
  colorClass,
}: ToggleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 group',
        active ? colorClass : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-600 hover:border-slate-200 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400',
      )}
    >
      <div
        className={cn(
          'p-2 rounded-lg transition-colors',
          active ? 'bg-white/50' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 text-slate-400 dark:text-slate-500',
        )}
      >
        {icon}
      </div>
      <div>
        <h3 className={cn('font-semibold text-sm', active ? '' : 'text-slate-800 dark:text-slate-200')}>{title}</h3>
        <p
          className={cn(
            'text-xs mt-0.5 opacity-80',
            active ? '' : 'text-slate-500 dark:text-slate-400',
          )}
        >
          {description}
        </p>
      </div>
      <div className="ml-auto mt-1">
        <div
          className={cn(
            'w-10 h-6 rounded-full flex items-center px-1 transition-colors',
            active ? 'bg-current' : 'bg-slate-200 dark:bg-slate-600',
          )}
        >
          <div
            className={cn(
              'w-4 h-4 rounded-full bg-white transition-transform',
              active ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </div>
      </div>
    </button>
  );
}

