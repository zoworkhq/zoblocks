import { Disclosure } from "@/components/zoblocks/accordion";

export default function SingleDisclosureExample() {
  return (
    <div className="w-full">
      <Disclosure
        headingLevel={3}
        item={{
          key: "why",
          label: "Why are we asking this?",
          children: <p>Your answers help your care team spot changes early.</p>,
        }}
      />
    </div>
  );
}
