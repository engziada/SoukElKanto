'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, ShieldQuestion, LogOut, Phone, ArrowLeft,
  User, Calendar, MapPin, Building, Home, Save, Check, Pencil,
  BadgeCheck,
} from 'lucide-react';
import { api, type KycStatus } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import { useToast } from '@/components/Toast';
import tabStyles from '../my.module.css';
import styles from './profile.module.css';

function formatPhone(phone: string): string {
  if (!phone) return '';
  const local = phone.replace(/^\+20/, '0');
  return local.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
}

export default function MyProfilePage() {
  const t = useTranslations('my.profile');
  const tc = useTranslations('create');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gateReason = searchParams?.get('reason');
  const gateNext = searchParams?.get('next') ?? null;
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);
  const toast = useToast();

  const [kyc, setKyc] = useState<KycStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [madinatyGroup, setMadinatyGroup] = useState('');
  const [buildingNo, setBuildingNo] = useState('');
  const [aptNo, setAptNo] = useState('');

  useEffect(() => {
    if (!user) return;
    api.users.kycStatus().then(setKyc).catch(() => setKyc(null));
    // Pre-fill form
    setFullName(user.fullName || '');
    setGender(user.gender || '');
    setBirthdate(user.birthdate || '');
    setMadinatyGroup(user.madinatyGroup || '');
    setBuildingNo(user.buildingNo || '');
    setAptNo(user.aptNo || '');
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.users.updateProfile({
        fullName: fullName.trim() || undefined,
        gender: gender || undefined,
        birthdate: birthdate || undefined,
        madinatyGroup: madinatyGroup.trim() || undefined,
        buildingNo: buildingNo.trim() || undefined,
        aptNo: aptNo.trim() || undefined,
      });
      setUser(updated);
      setEditing(false);
      toast.success(t('profileSaved'));
      // If the user arrived here from a gate-block (#1), bounce them back to
      // the original action once they've completed their profile.
      if (gateReason === 'profile-incomplete' && gateNext && updated.fullName && updated.gender && updated.birthdate) {
        router.push(gateNext);
      }
    } catch {
      toast.error(t('profileSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const is18Plus = (() => {
    if (!birthdate) return false;
    const b = new Date(birthdate);
    const now = new Date();
    const age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    return age > 18 || (age === 18 && m >= 0 && now.getDate() >= b.getDate());
  })();

  const hasCompleteProfile = !!(user.fullName && user.gender && user.birthdate && is18Plus);

  const kycLabelMap = {
    NOT_SUBMITTED: { label: t('kycNotSubmitted'), tone: 'unverified' as const, Icon: ShieldQuestion },
    PENDING: { label: t('kycPending'), tone: 'pending' as const, Icon: ShieldAlert },
    APPROVED: { label: t('kycApproved'), tone: 'verified' as const, Icon: ShieldCheck },
    REJECTED: { label: t('kycRejected'), tone: 'rejected' as const, Icon: ShieldAlert },
  } as const;
  const kycInfo = kyc ? kycLabelMap[kyc.status as keyof typeof kycLabelMap] ?? kycLabelMap.NOT_SUBMITTED : kycLabelMap.NOT_SUBMITTED;

  return (
    <section className={styles.wrap} aria-labelledby="profile-title">
      <h2 id="profile-title" className={tabStyles.panelTitle}>
        {t('title')}
      </h2>

      {gateReason === 'profile-incomplete' && (
        <div className={styles.gateBanner} role="alert">
          <ShieldAlert size={18} aria-hidden="true" />
          <span>{t('gateBanner')}</span>
        </div>
      )}

      {/* ── Identity Header ── */}
      <div className={styles.identity}>
        <div className={styles.avatar}>
          <User size={32} strokeWidth={1.5} />
        </div>
        <div className={styles.identityText}>
          <div className={styles.nameRow}>
            <span className={styles.displayName}>{user.fullName || t('unnamed')}</span>
            {user.isVerified && (
              <span className={styles.verifiedBadge} title={t('verified')}>
                <BadgeCheck size={16} />
              </span>
            )}
          </div>
          <span className={styles.phoneNum} dir="ltr">{formatPhone(user.phoneNumber)}</span>
        </div>
      </div>

      {/* ── Profile Fields ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{t('myInfo')}</h3>
          {!editing && (
            <button type="button" className={styles.editBtn} onClick={() => setEditing(true)}>
              <Pencil size={14} /> {t('edit')}
            </button>
          )}
        </div>

        {editing ? (
          <div className={styles.editForm}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('fullName')}</label>
              <input
                className={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tc('placeholderFullName')}
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>{t('gender')}</label>
                <select className={styles.select} value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">{t('selectGender')}</option>
                  <option value="MALE">{t('male')}</option>
                  <option value="FEMALE">{t('female')}</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>{t('birthdate')}</label>
                <input
                  type="date"
                  className={styles.input}
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
                {birthdate && !is18Plus && (
                  <span className={styles.fieldHint}>{t('mustBe18')}</span>
                )}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('madinatyAddress')}</label>
              <div className={styles.fieldRow}>
                <input
                  className={styles.input}
                  value={madinatyGroup}
                  onChange={(e) => setMadinatyGroup(e.target.value)}
                  placeholder={t('placeholderGroup')}
                />
                <input
                  className={styles.input}
                  value={buildingNo}
                  onChange={(e) => setBuildingNo(e.target.value)}
                  placeholder={t('placeholderBuilding')}
                />
                <input
                  className={styles.input}
                  value={aptNo}
                  onChange={(e) => setAptNo(e.target.value)}
                  placeholder={t('placeholderApt')}
                />
              </div>
            </div>
            <div className={styles.editActions}>
              <button type="button" className={styles.saveBtn} onClick={handleSaveProfile} disabled={saving}>
                {saving ? '…' : <><Save size={14} /> {t('save')}</>}
              </button>
              <button type="button" className={styles.cancelBtn} onClick={() => setEditing(false)}>
                <XIcon /> {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <dl className={styles.fields}>
            <div className={styles.field}>
              <dt className={styles.fieldLabel}>{t('fullName')}</dt>
              <dd className={styles.fieldValue}>
                <User size={14} aria-hidden="true" />
                {user.fullName || <span className={styles.empty}>{t('notProvided')}</span>}
              </dd>
            </div>
            <div className={styles.field}>
              <dt className={styles.fieldLabel}>{t('gender')}</dt>
              <dd className={styles.fieldValue}>
                {user.gender ? t(user.gender.toLowerCase()) : <span className={styles.empty}>{t('notProvided')}</span>}
              </dd>
            </div>
            <div className={styles.field}>
              <dt className={styles.fieldLabel}>{t('birthdate')}</dt>
              <dd className={styles.fieldValue}>
                <Calendar size={14} aria-hidden="true" />
                {user.birthdate || <span className={styles.empty}>{t('notProvided')}</span>}
              </dd>
            </div>
            <div className={styles.field}>
              <dt className={styles.fieldLabel}>{t('madinatyAddress')}</dt>
              <dd className={styles.fieldValue}>
                <MapPin size={14} aria-hidden="true" />
                {user.madinatyGroup || user.buildingNo || user.aptNo ? (
                  <span>
                    {user.madinatyGroup} / {t('building')} {user.buildingNo} / {t('apt')} {user.aptNo}
                  </span>
                ) : (
                  <span className={styles.empty}>{t('notProvided')}</span>
                )}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* ── Verification ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('verification')}</h3>
        <dl className={styles.fields}>
          <div className={styles.field}>
            <dt className={styles.fieldLabel}>{t('kycStatus')}</dt>
            <dd className={styles.fieldValue}>
              <span className={`${styles.kycChip} ${styles[`kyc_${kycInfo.tone}`]}`}>
                <kycInfo.Icon size={14} aria-hidden="true" />
                {kycInfo.label}
              </span>
            </dd>
          </div>
          {kyc?.fullName && (
            <div className={styles.field}>
              <dt className={styles.fieldLabel}>{t('kycName')}</dt>
              <dd className={styles.fieldValue}>{kyc.fullName}</dd>
            </div>
          )}
        </dl>

        {(kyc?.status === 'NOT_SUBMITTED' || kyc?.status === 'REJECTED') && (
          <div className={styles.verifyCta}>
            <Link href={`/${locale}/my/verify`} className={styles.verifyLink}>
              <ShieldCheck size={14} />
              {t('verifyNow')}
              <ArrowLeft size={14} className={styles.verifyArrow} />
            </Link>
          </div>
        )}
      </div>

      {/* ── Deal Readiness ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('dealReadiness')}</h3>
        <div className={styles.readinessList}>
          <div className={`${styles.readinessItem} ${hasCompleteProfile ? styles.ready : styles.missing}`}>
            {hasCompleteProfile ? <Check size={14} /> : <AlertIcon />}
            {hasCompleteProfile ? t('profileComplete') : t('profileIncomplete')}
          </div>
          <div className={`${styles.readinessItem} ${user.isVerified ? styles.ready : styles.missing}`}>
            {user.isVerified ? <Check size={14} /> : <AlertIcon />}
            {user.isVerified ? t('kycVerified') : t('kycOptional')}
          </div>
        </div>
        <p className={styles.readinessNote}>{t('dealNote')}</p>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={14} aria-hidden="true" />
          {t('logout')}
        </button>
      </div>
    </section>
  );
}

// Inline icon helpers to avoid extra imports
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
