import type { NotificationChannel, NotificationEventType } from "@prisma/client";
import { OFFICIAL_CONTACT } from "@/lib/constants";
import { prisma } from "@/server/db/client";

export type NotificationPayload = {
  userId?: string | null;
  deviceId?: string | null;
  profileId?: string | null;
  scanEventId?: string | null;
  recipient?: string | null;
  eventType: NotificationEventType;
  payload: Record<string, unknown>;
};

export interface NotificationProvider {
  sendEmail(input: NotificationPayload): Promise<void>;
  sendSms(input: NotificationPayload): Promise<void>;
  sendWhatsApp(input: NotificationPayload): Promise<void>;
  sendPush(input: NotificationPayload): Promise<void>;
  sendWebhook(input: NotificationPayload): Promise<void>;
  sendLocal(input: NotificationPayload): Promise<void>;
}

async function createLocalNotification(input: NotificationPayload, channel: NotificationChannel) {
  await prisma.notificationEvent.create({
    data: {
      userId: input.userId ?? undefined,
      deviceId: input.deviceId ?? undefined,
      profileId: input.profileId ?? undefined,
      scanEventId: input.scanEventId ?? undefined,
      channel,
      eventType: input.eventType,
      recipient: input.recipient ?? OFFICIAL_CONTACT.email,
      status: "SIMULATED",
      payload: JSON.stringify(input.payload),
      sentAt: new Date(),
    },
  });
}

export class LocalNotificationProvider implements NotificationProvider {
  sendEmail(input: NotificationPayload) {
    return createLocalNotification(input, "EMAIL");
  }

  sendSms(input: NotificationPayload) {
    return createLocalNotification(input, "SMS");
  }

  sendWhatsApp(input: NotificationPayload) {
    return createLocalNotification(input, "WHATSAPP");
  }

  sendPush(input: NotificationPayload) {
    return createLocalNotification(input, "PUSH");
  }

  sendWebhook(input: NotificationPayload) {
    return createLocalNotification(input, "WEBHOOK");
  }

  sendLocal(input: NotificationPayload) {
    return createLocalNotification(input, "LOCAL");
  }
}

export const notificationProvider = new LocalNotificationProvider();
