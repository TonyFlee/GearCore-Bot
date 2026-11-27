import { guildMemberAddEvent } from "./guildMemberAdd";
import { interactionCreateEvent } from "./interactionCreate";
import { readyEvent } from "./ready";

export const events = [readyEvent, interactionCreateEvent, guildMemberAddEvent];
