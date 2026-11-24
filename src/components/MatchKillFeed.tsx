import React, { useMemo, useState } from 'react';
import { Flame, Zap, Swords, Skull, TrendingUp, Award, ListFilter } from 'lucide-react';
import type { DuelFeedEventType, DuelKillFeedEvent } from '../game/duel';

interface MatchKillFeedProps {
  events: DuelKillFeedEvent[];
}

type FeedFilter = 'all' | 'streaks' | 'swings';

function getEventVisuals(type: DuelFeedEventType): {
  label: string;
  badgeClass: string;
  rowBorderClass: string;
  Icon: React.FC<{ className?: string }>;
} {
  switch (type) {
    case 'first_blood':
      return {
        label: 'FIRST BLOOD',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/50',
        rowBorderClass: 'border-rose-500/35',
        Icon: Flame,
      };
    case 'kill_streak':
      return {
        label: 'KILL STREAK',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
        rowBorderClass: 'border-amber-500/35',
        Icon: Award,
      };
    case 'cyber_momentum':
      return {
        label: 'MOMENTUM',
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
        rowBorderClass: 'border-cyan-500/35',
        Icon: Zap,
      };
    case 'pvp_takedown':
      return {
        label: 'PVP KO',
        badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-400/50',
        rowBorderClass: 'border-pink-500/35',
        Icon: Skull,
      };
    case 'comeback':
      return {
        label: 'COMEBACK',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
        rowBorderClass: 'border-emerald-500/45 bg-emerald-950/20',
        Icon: TrendingUp,
      };
    case 'lead_change':
      return {
        label: 'LEAD FLIP',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
        rowBorderClass: 'border-purple-500/35',
        Icon: Swords,
      };
  }
}

export const MatchKillFeed: React.FC<MatchKillFeedProps> = ({ events }) => {
  const [filter, setFilter] = useState<FeedFilter>('all');

  const filteredEvents = useMemo(() => {
    if (filter === 'streaks') {
      return events.filter((e) => e.type === 'kill_streak' || e.type === 'cyber_momentum');
    }
    if (filter === 'swings') {
      return events.filter(
        (e) =>
          e.type === 'comeback' ||
          e.type === 'lead_change' ||
          e.type === 'pvp_takedown' ||
          e.type === 'first_blood'
      );
    }
    return events;
  }, [events, filter]);

  return (
    <div
      data-testid="match-kill-feed"
      className="mb-3.5 rounded-lg bg-[#050a14] border border-cyan-500/30 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/90">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Match Kill Feed
          </h3>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono-numbers text-cyan-300">
            {events.length} {events.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Kill feed filter">
          {(
            [
              { id: 'all', label: 'All Events' },
              { id: 'streaks', label: 'Streaks & Momentum' },
              { id: 'swings', label: 'Comebacks & Leads' },
            ] as { id: FeedFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div
          data-testid="match-kill-feed-empty"
          className="py-4 text-center text-xs text-slate-500 font-mono"
        >
          {events.length === 0
            ? 'No major streaks, comebacks, or PvP takedowns were triggered in this duel.'
            : 'No events match this filter.'}
        </div>
      ) : (
        <ol className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {filteredEvents.map((ev) => {
            const { label, badgeClass, rowBorderClass, Icon } = getEventVisuals(ev.type);
            const isP1 = ev.slot === 'p1';
            return (
              <li
                key={ev.id}
                data-testid={`kill-feed-item-${ev.type}`}
                className={`flex items-start justify-between gap-2.5 px-2.5 py-2 rounded border bg-[#070e1b] ${rowBorderClass}`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="mt-0.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono-numbers text-slate-300 shrink-0 tabular-nums">
                    {ev.timeLabel}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold tracking-wider ${badgeClass}`}
                      >
                        <Icon className="w-2.5 h-2.5 shrink-0" />
                        <span>{label}</span>
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isP1 ? 'text-cyan-300' : 'text-pink-300'
                        }`}
                      >
                        {ev.actorName}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-200">
                        · {ev.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {ev.detail}
                    </p>
                  </div>
                </div>

                {typeof ev.pointsDelta === 'number' && ev.pointsDelta > 0 && (
                  <span className="text-[11px] font-bold font-mono-numbers text-amber-300 shrink-0 tabular-nums">
                    +{ev.pointsDelta.toLocaleString()}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
