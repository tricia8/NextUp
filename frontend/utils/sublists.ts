import { Sublist } from "@/types/sublist";

function filterByOwner(sublist: Sublist, userId: string) {
  return sublist.ownerId === userId;
}

function filterByNotOwner(sublist: Sublist, userId: string) {
  return sublist.ownerId !== userId;
}

function filterByVisibility(
  sublist: Sublist,
  visibility: "private" | "friends" | "everyone"
) {
  return sublist.accessLevel === visibility;
}

function filterBySharedStatus(sublist: Sublist, shared: boolean) {
  return shared
    ? sublist.collaborators.length > 1
    : sublist.collaborators.length === 1;
}

function filterByProgressStatus(
  sublist: Sublist,
  status: "Completed" | "In Progress" | "Getting Started"
) {
  const [completed, total] = sublist.completionStatus;

  switch (status) {
    case "Completed":
      return completed === total && completed > 0 && total > 0;

    case "In Progress":
      return completed < total && completed > 0 && total > 0;

    case "Getting Started":
      return completed === 0;

    default:
      return false;
  }
}

// Generic filtering function
export function filterSublists(
  sublistData: Record<string, Sublist>,
  sublistOrder: string[],
  predicate: (sublist: Sublist) => boolean
): Sublist[] {
  return sublistOrder.map((id) => sublistData[id]).filter(predicate);
}

export function getOwnedSublists(
  sublistData: Record<string, Sublist>,
  sublistOrder: string[],
  userId: string
) {
  return filterSublists(sublistData, sublistOrder, (sublist) =>
    filterByOwner(sublist, userId)
  );
}

export function getUnownedSublists(
  sublistData: Record<string, Sublist>,
  sublistOrder: string[],
  userId: string
) {
  return filterSublists(sublistData, sublistOrder, (sublist) =>
    filterByNotOwner(sublist, userId)
  );
}

export function filterSublistsByVisibility(
  sublistData: Record<string, Sublist>,
  sublistOrder: string[],
  visibility: "private" | "friends" | "everyone"
) {
  return filterSublists(sublistData, sublistOrder, (sublist) =>
    filterByVisibility(sublist, visibility)
  );
}

export function filterSublistsBySharedStatus(
  sublistData: Record<string, Sublist>,
  sublistOrder: string[],
  shared: boolean
) {
  return filterSublists(sublistData, sublistOrder, (sublist) =>
    filterBySharedStatus(sublist, shared)
  );
}

export function filterSublistsByProgressStatus(
  sublistData: Record<string, Sublist>,
  sublistOrder: string[],
  status: "Completed" | "In Progress" | "Getting Started"
) {
  return filterSublists(sublistData, sublistOrder, (sublist) =>
    filterByProgressStatus(sublist, status)
  );
}
