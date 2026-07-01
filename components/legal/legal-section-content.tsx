import type { LegalBlock } from "@/lib/legal/types";

export function LegalSectionContent({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return <p key={index}>{block.text}</p>;
        }

        if (block.type === "labeled") {
          return (
            <p key={index}>
              <strong className="text-foreground">{block.label}</strong>{" "}
              {block.text}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <div key={index} className="space-y-2">
            <p>
              <strong className="text-foreground">{block.label}</strong>
            </p>
            <ul className="list-disc space-y-2 pl-5">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}