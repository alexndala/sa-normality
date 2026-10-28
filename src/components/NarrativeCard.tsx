'use client';

interface NarrativeCardProps {
  narrative: string;
}

export default function NarrativeCard({ narrative }: NarrativeCardProps) {
  return (
    <section className="narrative-card" aria-labelledby="narrative-heading">
      <h3 className="narrative-label" id="narrative-heading">
        What this means
      </h3>
      <p className="narrative-text">{narrative}</p>
    </section>
  );
}
