'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './wizard.module.css';

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
    <div className={styles.wrap}>
      <h1 className={styles.h1}>{t('create.title')}</h1>

      <div className={styles.steps}>
        {stepLabels.map((label, idx) => {
          const n = idx + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className={styles.step}>
              <div
                className={`${styles.dot} ${active ? styles.dotActive : ''} ${
                  done ? styles.dotDone : ''
                }`}
              >
                {done ? '✓' : n}
              </div>
              <span className={styles.stepLabel}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.panel}>
        {step === 1 && (
          <div className={styles.photoDrop}>
            <Camera size={36} />
            <p>Drag &amp; drop photos here, or click to browse (1–8 photos)</p>
          </div>
        )}
        {step === 2 && (
          <div className={styles.fields}>
            <input className={styles.input} placeholder="Title" />
            <textarea className={styles.textarea} placeholder="Description" />
            <select className={styles.select}>
              <option>Category</option>
            </select>
            <select className={styles.select}>
              <option>Condition</option>
            </select>
            <input className={styles.input} placeholder="District" />
          </div>
        )}
        {step === 3 && (
          <div className={styles.fields}>
            <label className={styles.label}>Price (EGP)</label>
            <input type="number" className={styles.input} placeholder="1,800" />
          </div>
        )}
        {step === 4 && (
          <div className={styles.review}>Review your listing before publishing.</div>
        )}
      </div>

      <div className={styles.nav}>
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className={styles.back}
        >
          <ChevronLeft size={16} />
          Back
        </button>
        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            className={styles.next}
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button type="button" className={styles.publish}>
            {t('create.publish')}
          </button>
        )}
      </div>
    </div>
  );
}
