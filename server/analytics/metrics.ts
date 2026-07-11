import { prisma } from "@/server/db/client";

export async function getAdminMetrics() {
  const [
    batches,
    devices,
    activatedDevices,
    profiles,
    scans,
    locations,
    calls,
    whatsapps,
    found,
    lostDevices,
    organizations,
    notifications,
  ] = await Promise.all([
    prisma.batch.count(),
    prisma.device.count(),
    prisma.device.count({ where: { status: { in: ["ACTIVATED", "LOST", "FOUND"] } } }),
    prisma.profile.count(),
    prisma.scanEvent.count(),
    prisma.scanEvent.count({ where: { locationPermission: true } }),
    prisma.contactAction.count({ where: { action: "CALL_CLICKED" } }),
    prisma.contactAction.count({ where: { action: "WHATSAPP_CLICKED" } }),
    prisma.contactAction.count({ where: { action: "FOUND_REPORTED" } }),
    prisma.device.count({ where: { status: "LOST" } }),
    prisma.organization.count({ where: { status: "ACTIVE" } }),
    prisma.notificationEvent.count(),
  ]);

  return {
    batches,
    devices,
    activatedDevices,
    activationRate: devices ? Math.round((activatedDevices / devices) * 100) : 0,
    profiles,
    scans,
    locations,
    calls,
    whatsapps,
    found,
    lostDevices,
    organizations,
    notifications,
  };
}

export async function getUserMetrics(userId: string) {
  const devices = await prisma.device.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const deviceIds = devices.map((device) => device.id);

  const [profiles, scans, locations, notifications] = await Promise.all([
    prisma.profile.count({ where: { ownerId: userId } }),
    prisma.scanEvent.count({ where: { deviceId: { in: deviceIds } } }),
    prisma.scanEvent.count({ where: { deviceId: { in: deviceIds }, locationPermission: true } }),
    prisma.notificationEvent.count({ where: { userId } }),
  ]);

  return {
    devices: devices.length,
    profiles,
    scans,
    locations,
    notifications,
  };
}
