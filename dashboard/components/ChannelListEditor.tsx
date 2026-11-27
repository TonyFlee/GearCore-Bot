"use client";

import type { AutoChannel } from "@/lib/types";

type Props = {
  title: string;
  description: string;
  idPrefix: string;
  values: AutoChannel[];
  onChange: (values: AutoChannel[]) => void;
};

const MAX = 3;

export default function ChannelListEditor({ title, description, idPrefix, values, onChange }: Props) {
  function update(index: number, patch: Partial<AutoChannel>) {
    onChange(values.map((entry, position) => position === index ? { ...entry, ...patch } : entry));
  }

  function add() {
    if (values.length >= MAX) return;
    onChange([...values, { guildId: "", channelId: "", enabled: true }]);
  }

  function remove(index: number) {
    onChange(values.filter((_, position) => position !== index));
  }

  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="muted">{description}</p>

      {values.map((entry, index) => (
        <div className="channel-row" key={`${idPrefix}-${index}`}>
          <div className="channel-grid">
            <div>
              <label htmlFor={`${idPrefix}-guild-${index}`}>Server ID</label>
              <input
                id={`${idPrefix}-guild-${index}`}
                value={entry.guildId}
                onChange={(event) => update(index, { guildId: event.target.value })}
                placeholder="Discord server ID"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-channel-${index}`}>Channel ID</label>
              <input
                id={`${idPrefix}-channel-${index}`}
                value={entry.channelId}
                onChange={(event) => update(index, { channelId: event.target.value })}
                placeholder="Discord channel ID"
              />
            </div>
          </div>
          <div className="actions">
            <label className="toggle" htmlFor={`${idPrefix}-enabled-${index}`}>
              <input
                id={`${idPrefix}-enabled-${index}`}
                type="checkbox"
                checked={entry.enabled}
                onChange={(event) => update(index, { enabled: event.target.checked })}
              />
              Enabled
            </label>
            <button className="danger small" type="button" onClick={() => remove(index)}>Remove</button>
          </div>
        </div>
      ))}

      {values.length < MAX ? (
        <div className="actions">
          <button className="secondary small" type="button" onClick={add}>Add channel</button>
        </div>
      ) : null}
    </div>
  );
}
