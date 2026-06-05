import styles from './ListingCardSkeleton.module.css';

export function ListingCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.photo} />
      <div className={styles.body}>
        <div className={styles.title} />
        <div className={styles.meta}>
          <div className={styles.district} />
          <div className={styles.fav} />
        </div>
      </div>
    </div>
  );
}
