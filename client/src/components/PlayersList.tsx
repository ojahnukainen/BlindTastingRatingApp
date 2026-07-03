import type { PublicPlayer } from '@blind/shared';

export function PlayersList({ players }: { players: PublicPlayer[] }) {
  if (players.length === 0) {
    return <p className="text-sm text-slate-500">No players have joined yet.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {players.map((player) => (
        <li
          key={player.id}
          className={[
            'rounded-full px-3 py-1 text-sm',
            player.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400',
          ].join(' ')}
        >
          {player.nickname}
        </li>
      ))}
    </ul>
  );
}
