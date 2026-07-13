import type { Device, OrganizationMembership, User } from "@prisma/client";
import { prisma } from "@/server/db/client";

type DeviceAccessDevice = Pick<Device, "ownerId" | "organizationId">;
type DeviceAccessMembership = Pick<OrganizationMembership, "organizationId" | "role" | "status">;
type DeviceAccessUser = Pick<User, "id" | "role">;

export function userCanManageDevice(
  user: DeviceAccessUser,
  device: DeviceAccessDevice,
  memberships: DeviceAccessMembership[] = [],
) {
  if (device.ownerId === user.id) return true;
  if (["ADMIN", "SUPER_ADMIN", "SUPPORT"].includes(user.role)) return true;
  if (!device.organizationId) return false;

  return memberships.some(
    (membership) =>
      membership.organizationId === device.organizationId &&
      membership.status === "ACTIVE" &&
      ["OWNER", "ADMIN", "STAFF"].includes(membership.role),
  );
}

export async function getDeviceWithManagePermission(user: User, deviceIdOrPublicCode: string) {
  const device = await prisma.device.findFirst({
    where: {
      OR: [{ id: deviceIdOrPublicCode }, { publicCode: deviceIdOrPublicCode.trim().toUpperCase() }],
      deletedAt: null,
    },
    include: {
      profile: true,
      owner: true,
      organization: true,
      _count: { select: { scanEvents: true } },
    },
  });
  if (!device) return null;

  const memberships = device.organizationId
    ? await prisma.organizationMembership.findMany({
        where: {
          userId: user.id,
          organizationId: device.organizationId,
          status: "ACTIVE",
        },
      })
    : [];

  if (!userCanManageDevice(user, device, memberships)) return null;
  return device;
}

export async function auditForbiddenDeviceManagementAttempt(user: User, deviceIdOrPublicCode: string) {
  const normalizedCode = deviceIdOrPublicCode.trim().toUpperCase();
  const device = await prisma.device.findFirst({
    where: {
      OR: [{ id: deviceIdOrPublicCode }, { publicCode: normalizedCode }],
      deletedAt: null,
    },
    select: { id: true, publicCode: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "DEVICE_MANAGEMENT_FORBIDDEN",
      entityType: "Device",
      entityId: device?.id,
      newData: JSON.stringify({
        publicCode: device?.publicCode ?? normalizedCode,
        reason: "not_owner_or_authorized",
      }),
    },
  });
}
