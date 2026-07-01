import Image from "next/image";

export function LandingChatMockup() {
  return (
    <figure className="relative mx-auto w-full max-w-md">
      <div
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-primary/10 blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-2xl shadow-primary/10">
        <Image
          src="/pwa-screenshot-narrow.png"
          alt="Pratinjau tampilan chat IDA di ponsel dengan Worksheet, Web Search, Research, dan Map"
          width={540}
          height={720}
          sizes="(max-width: 1024px) 100vw, 28rem"
          priority
          className="h-auto w-full object-cover object-top"
        />
      </div>
      <figcaption className="sr-only">
        Mockup antarmuka chat IDA menampilkan percakapan dan tools utama.
      </figcaption>
    </figure>
  );
}