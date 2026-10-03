const words = [
  "Game Development",
  "Virtual Reality",
  "Augmented Reality",
  "Spatial Computing",
  "Interactive Installations",
  "Serious Games",
];

/** Decorative scrolling band of disciplines between the hero and the content. */
export function DisciplineMarquee() {
  return (
    <div className="vr-marquee" aria-hidden="true">
      <div className="track">
        {[...words, ...words].map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
    </div>
  );
}
