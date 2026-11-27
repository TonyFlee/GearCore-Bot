export type BotSettings = {
  supportChannelId: string;
  announceChannelId: string;
  welcomeChannelId: string;
  welcomeRoleId: string;
  supportEmail: string;
  telegramUsername: string;
  promoCode: string;
  preorderDays: string;
  supportEnabled: boolean;
  announcementsEnabled: boolean;
  welcomeEnabled: boolean;
  productCommandsEnabled: boolean;
};

export type BotStatus = {
  online: boolean;
  uptimeMs: number | null;
  pingMs: number | null;
  guilds: number;
  startedAt: string;
  commands: Array<{ name: string; description: string }>;
  openSupport: number;
  settings: BotSettings;
};

export type SupportRequest = {
  id: string;
  userTag: string;
  userId: string;
  guild: string;
  message: string;
  createdAt: string;
  status: "open" | "read";
};
