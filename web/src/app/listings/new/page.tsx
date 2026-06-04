'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CreateListingPage() {
  const t = useTranslations();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const stepLabels = [
    t('create.stepPhotos'),
    t('create.stepDetails'),
    t('create.stepPrice'),
    t('create.stepReview'),
  ];

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">
        {t('create.title')}
      </h1>

      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {stepLabels.map((label, idx) => {
          const n = idx + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  done
                    ? 'bg-[var(--color-teal)] text-white'
                    : active
                    ? 'bg-[var(--color-kanto-coral)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                }`}
              >
                {done ? '✓' : n}
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
        {step === 1 && (
          <div className="flex flex-col items-center gap-4 py-12 text-[var(--color-text-muted)]">
            <Camera className="h-12 w-12" />
            <p>Drag & drop photos here, or click to browse (1–8 photos)</p>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <input
              placeholder="Title"
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-kanto-coral)]"
            />
            <textarea
              placeholder="Description"
              rows={4}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-kanto-coral)]"
            />
            <select className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none">
              <option>Category</option>
            </select>
            <select className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none">
              <option>Condition</option>
            </select>
            <input
              placeholder="District"
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-kanto-coral)]"
            />
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-[var(--color-text)]">
              Price (EGP)
            </label>
            <input
              type="number"
              placeholder="1,800"
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-kanto-coral)]"
            />
          </div>
        )}
        {step === 4 && (
          <div className="py-8 text-center text-[var(--color-text-muted)]">
            Review your listing before publishing.
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-1 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-[var(--color-text-soft)] disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        {step < totalSteps ? (
          <button
            onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            className="flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-kanto-coral)] px-6 py-2.5 text-sm font-semibold text-white"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button className="flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-kanto-coral)] px-6 py-2.5 text-sm font-semibold text-white">
            {t('create.publish')}
          </button>
        )}
      </div>
    </div>
  );
}
