import React from 'react';
import { Plus, X, Map as MapIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { ReportFormValues } from '../../hooks/useMapState';

type ReportLocation = {
  lat: number;
  lng: number;
};

type ReportModalProps = {
  isDark?: boolean;
  reportingLocation: ReportLocation;
  onSubmit: (data: ReportFormValues) => void;
  onClose: () => void;
};

export default function ReportModal({
  isDark,
  reportingLocation,
  onSubmit,
  onClose,
}: ReportModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormValues>({
    defaultValues: {
      incidentType: 'Suspicious Activity',
      description: '',
    },
  });

  const handleFormSubmit = (data: ReportFormValues) => {
    onSubmit(data);
  };

  return (
    <div className="absolute top-6 right-6 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-600 z-[1000] animate-in fade-in slide-in-from-right-8">
      <div className="p-5 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Report Incident
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Incident Type
          </label>
          <select
            {...register('incidentType')}
            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Suspicious Activity</option>
            <option>Theft</option>
            <option>Vandalism</option>
            <option>Assault</option>
            <option>Poor Lighting / Unsafe Area</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            {...register('description', {
              required: 'Description is required',
              minLength: {
                value: 10,
                message: 'Description must be at least 10 characters',
              },
            })}
            placeholder="Provide details..."
            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>
          )}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <MapIcon className="w-3 h-3" />
          {reportingLocation.lat.toFixed(4)}, {reportingLocation.lng.toFixed(4)}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors"
        >
          Submit Report
        </button>
      </form>
    </div>
  );
}

