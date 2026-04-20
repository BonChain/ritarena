export default function ExploreLoading() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div
          className="h-10 w-72 rounded mb-3 animate-pulse"
          style={{ background: "rgba(20, 241, 149, 0.06)" }}
        />
        <div
          className="h-5 w-96 rounded animate-pulse"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="glass-card h-48 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
