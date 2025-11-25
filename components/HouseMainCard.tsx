import Image from "next/image";

type Props = {
  level: number;
};

export function HouseMainCard({ level }: Props) {
  const src = `/houses/level${level}.png`;
  return (
    <section className="flex flex-col items-center mt-3">
      <div className="relative w-64 h-64">
        <Image
          src={src}
          alt={`House level ${level}`}
          fill
          className="object-contain drop-shadow-xl"
        />
      </div>
      <div className="mt-2 px-4 py-1.5 rounded-full bg-primary text-bg text-xs font-semibold tracking-wide">
        LEVEL {level}
      </div>
    </section>
  );
}
