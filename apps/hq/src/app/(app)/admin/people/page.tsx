import { notFound, redirect } from "next/navigation";
import { PersonRow } from "@/components/person-row";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/client";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "People" };

function Group({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h2 className="mb-1.5 flex items-center gap-2 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
        {label}
        <span className="num font-normal text-faint">{count}</span>
      </h2>
      <div className="overflow-hidden rounded-lg border border-rule bg-paper">{children}</div>
    </section>
  );
}

export default async function PeoplePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  // Not a redirect: an admin-only route should not exist for a member, and a
  // redirect to /login would confirm the route is real.
  if (user.role !== "admin") notFound();

  const docs = await db().users.find({}).sort({ createdAt: 1 }).toArray();
  const everyone = docs.map((d) => ({
    id: d._id.toHexString(),
    name: d.name,
    email: d.email,
    role: d.role,
    status: d.status,
    createdAt: d.createdAt,
  }));

  const pending = everyone.filter((p) => p.status === "pending");
  const active = everyone.filter((p) => p.status === "active");
  const disabled = everyone.filter((p) => p.status === "disabled");

  return (
    <div className="hq-page mx-auto max-w-3xl px-5 py-6 sm:px-7">
      <PageHeader
        title="People"
        subtitle={`${active.length} active · ${pending.length} awaiting approval`}
      />

      <Group label="Awaiting approval" count={pending.length}>
        {pending.length === 0 ? (
          <p className="px-4 py-5 text-[0.75rem] text-muted">
            No one is waiting. New signups appear here until approved — until then they cannot sign
            in.
          </p>
        ) : (
          pending.map((person) => <PersonRow key={person.id} person={person} selfId={user.id} />)
        )}
      </Group>

      <Group label="Active" count={active.length}>
        {active.map((person) => (
          <PersonRow key={person.id} person={person} selfId={user.id} />
        ))}
      </Group>

      {disabled.length > 0 && (
        <Group label="Disabled" count={disabled.length}>
          {disabled.map((person) => (
            <PersonRow key={person.id} person={person} selfId={user.id} />
          ))}
        </Group>
      )}
    </div>
  );
}
