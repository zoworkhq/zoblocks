import { DemoGrid, Example } from "./_shared/shared";

export default function FramedByTheHost() {
  return (
    <Example>
      <DemoGrid masthead={false} footer={false} />
    </Example>
  );
}
