import { guildMemberAddEvent } from "./guildMemberAdd";
import { interactionCreateEvent } from "./interactionCreate";
import { readyEvent } from "./ready";
import { voiceStateUpdateEvent } from "./voiceStateUpdate";

export const events = [readyEvent, interactionCreateEvent, guildMemberAddEvent, voiceStateUpdateEvent];
