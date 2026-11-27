import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { announceCommand } from "./announce";
import { bundleCommand } from "./bundle";
import { helpCommand } from "./help";
import { orderCommand } from "./order";
import { pingCommand } from "./ping";
import { productCommand } from "./product";
import { supportCommand } from "./support";

type CommandBuilder = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export type BotCommand = {
  data: CommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export const commands: BotCommand[] = [
  productCommand,
  bundleCommand,
  orderCommand,
  supportCommand,
  announceCommand,
  helpCommand,
  pingCommand,
];
