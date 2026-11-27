import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { announceCommand } from "./announce";
import { bundleCommand } from "./bundle";
import { catalogCommand } from "./catalog";
import { helpCommand } from "./help";
import { inviteCommand } from "./invite";
import { orderCommand } from "./order";
import { pingCommand } from "./ping";
import { productCommand } from "./product";
import { randomCommand } from "./random";
import { supportCommand } from "./support";

type CommandBuilder = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export type BotCommand = {
  data: CommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
};

export const commands: BotCommand[] = [
  productCommand,
  catalogCommand,
  randomCommand,
  bundleCommand,
  orderCommand,
  supportCommand,
  announceCommand,
  inviteCommand,
  helpCommand,
  pingCommand,
];
