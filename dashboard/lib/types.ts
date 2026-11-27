export type AutoChannel = {
  guildId: string;
  channelId: string;
  enabled: boolean;
};

export type BotSettings = {
  supportChannelId: string;
  announceChannelId: string;
  welcomeChannelId: string;
  welcomeRoleId: string;
  supportEmail: string;
  telegramUsername: string;
  promoCode: string;
  preorderDays: string;
  statusText: string;
  statusType: "playing" | "streaming" | "listening" | "watching" | "competing";
  presenceStatus: "online" | "idle" | "dnd" | "invisible";
  statusUrl: string;
  supportEnabled: boolean;
  announcementsEnabled: boolean;
  welcomeEnabled: boolean;
  productCommandsEnabled: boolean;
  autoPostOnStart: boolean;
  autoChannels: AutoChannel[];
  voiceAutoJoinEnabled: boolean;
  voiceChannels: AutoChannel[];
};

export type BotStatus = {
  online: boolean;
  uptimeMs: number | null;
  pingMs: number | null;
  guilds: number;
  startedAt: string;
  commands: Array<{ name: string; description: string }>;
  openSupport: number;
  autoChannels: number;
  voiceChannels: number;
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
