export default function SkeletonLoader({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-card-hover rounded-lg animate-pulse ${className}`}
        />
      ))}
    </>
  )
}
