import { approveUser, setUserRole, setUserStatus } from "@/lib/actions";
import type { UserRole } from "@/db/schema";
import { Avatar } from "./bits";
import { DisableAccount } from "./disable-account";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "pending" | "active" | "disabled";
  createdAt: Date;
}

export function PersonRow({ person, selfId }: { person: Person; selfId: string }) {
  const isSelf = person.id === selfId;

  return (
    <div
      className="list-row"
      style={{
        gridTemplateColumns: "auto minmax(0,1fr) auto",
        gridTemplateAreas: '"check title meta"',
      }}
    >
      <div className="lr-check">
        <Avatar id={person.id} name={person.name} size="md" />
      </div>

      <div className="lr-title min-w-0">
        <p className="truncate text-[0.8125rem] font-medium text-ink">
          {person.name}
          {isSelf && <span className="ml-1.5 text-[0.6875rem] font-normal text-faint">You</span>}
        </p>
        <p className="truncate text-[0.6875rem] text-muted">{person.email}</p>
      </div>

      <div className="lr-meta flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        {person.status === "active" && (
          <span className="px-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
            {person.role}
          </span>
        )}

        {person.status === "pending" && (
          /* Approving and setting the role are one act. Approving first and
             assigning later leaves a window where someone is active with a
             default role nobody chose. */
          <form action={approveUser} className="flex items-center gap-1.5">
            <input type="hidden" name="userId" value={person.id} />
            <label className="sr-only" htmlFor={`role-${person.id}`}>
              Role for {person.name}
            </label>
            <select
              id={`role-${person.id}`}
              name="role"
              defaultValue="member"
              className="field w-auto py-1"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn py-1">
              Approve
            </button>
          </form>
        )}

        {person.status === "active" && (
          <>
            <form action={setUserRole}>
              <input type="hidden" name="userId" value={person.id} />
              <input
                type="hidden"
                name="role"
                value={person.role === "admin" ? "member" : "admin"}
              />
              <button type="submit" className="btn-outline">
                Make {person.role === "admin" ? "member" : "admin"}
              </button>
            </form>

            {!isSelf && <DisableAccount userId={person.id} name={person.name} />}
          </>
        )}

        {person.status === "disabled" && (
          <>
            <span className="px-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-faint">
              Disabled
            </span>
            <form action={setUserStatus}>
              <input type="hidden" name="userId" value={person.id} />
              <input type="hidden" name="status" value="active" />
              <button type="submit" className="btn-outline">
                Re-enable
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
