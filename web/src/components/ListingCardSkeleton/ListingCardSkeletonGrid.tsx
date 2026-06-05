import { ListingCardSkeleton } from './ListingCardSkeleton';
import styles from './ListingCardSkeletonGrid.module.css';

export function ListingCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
