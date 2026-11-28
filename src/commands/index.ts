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
import { featuredCommand, newestCommand } from "./discover";
import { giveawayCommand } from "./giveaway";
import { helpCommand } from "./help";
import { inviteCommand } from "./invite";
import { orderCommand } from "./order";
import { pingCommand } from "./ping";
import { pollCommand } from "./poll";
import { productCommand } from "./product";
import { randomCommand } from "./random";
import { remindCommand } from "./remind";
import { scheduleCommand } from "./schedule";
import { searchCommand } from "./search";
import { soundCommand } from "./sound";
import { supportCommand } from "./support";
import { ticketCommand } from "./ticket";
import { wishlistCommand } from "./wishlist";

type CommandBuilder = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export type BotCommand = {
  data: CommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
};

export const commands: BotCommand[] = [
  productCommand,
  searchCommand,
  catalogCommand,
  featuredCommand,
  newestCommand,
  randomCommand,
  bundleCommand,
  wishlistCommand,
  orderCommand,
  supportCommand,
  ticketCommand,
  announceCommand,
  scheduleCommand,
  pollCommand,
  giveawayCommand,
  remindCommand,
  soundCommand,
  inviteCommand,
  helpCommand,
  pingCommand,
];
