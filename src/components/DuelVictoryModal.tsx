import React from 'react';
import { Trophy, RotateCcw, Home, Swords } from 'lucide-react';
import { formatDuelTimer, isPurePvpFormat, sortDuelRosterByScore, type DuelVictorySummary } from '../game/duel';
import { MatchKillFeed } from './MatchKillFeed';

interface DuelVictoryModalProps {
  summary: DuelVictorySummary;
  isSpectator?: boolean;
  onRematch: () => void;
  onTitle: () => void;
}

export const DuelVictoryModal: React.FC<DuelVictoryModalProps> = ({
  summary,
  isSpectator = false,
  onRematch,
  onTitle,
}) => {
  const matchFormat = summary.matchFormat || 'pvpve_1v1';
  const isPurePvp = isPurePvpFormat(matchFormat);
  const isTeamMode = matchFormat === 'pvp_team';
  const players = sortDuelRosterByScore(
    summary.players && summary.players.length > 0 ? summary.players : [summary.p1, summary.p2]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-start sm:items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duel-victory-heading"
    >
      <div className="my-auto bg-[#08101c] border-2 border-cyan-400/70 rounded-xl p-4 sm:p-5 max-w-2xl w-full shadow-[0_0_60px_rgba(0,243,255,0.3)]">
        {/* Header & Winner */}
        <div className="text-center mb-3.5">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-400/15 border border-amber-400/50 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>

          <h2 id="duel-victory-heading" className="text-xl sm:text-2xl font-black text-white tracking-wide">
            {isPurePvp ? 'Pure PvP Match Summary' : 'Cyber Duel Victory Summary'}
          </h2>

          <div className="mt-1 text-xs sm:text-sm text-slate-300 flex flex-wrap items-center justify-center gap-2">
            <span>
              {summary.mode === 'online' ? 'Online' : 'Local'}{' '}
              {isTeamMode ? 'Team Battle' : isPurePvp ? 'Pure PvP Solo' : '1v1 PvPvE'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {summary.mapTheme === 'cyber_forest_ruins' ? 'Crystal Conduit Ruins' : `Sector ${summary.level}`}
            </span>
            <span aria-hidden="true">·</span>
            <span>Duration {formatDuelTimer(summary.durationSeconds)}</span>
            {!isPurePvp && (
              <>
                <span aria-hidden="true">·</span>
                <span>Total Arena Kills: {summary.totalArenaKills}</span>
              </>
            )}
          </div>

          <div className="mt-2.5 py-2 px-3.5 rounded-lg bg-[#050a14] border border-amber-400/40 inline-flex items-center gap-2.5">
            <Swords className="w-4 h-4 text-amber-300" />
            <div className="text-left">
              <div className="text-[10px] text-amber-300 font-semibold leading-tight">
                {summary.isTie ? 'Match Result' : isTeamMode ? 'Winning Squad' : 'Duel Champion'}
              </div>
              <div className="text-lg font-black text-white leading-tight" data-testid="duel-winner-name">
                {summary.isTie ? 'Tie Match — Equal Combat Score' : summary.winnerName}
              </div>
            </div>
          </div>
        </div>

        {/* Team Standings Banner (when Team PvP) */}
        {isTeamMode && summary.teamScores && (
          <div className="grid grid-cols-2 gap-3 mb-3.5" data-testid="duel-team-summary">
            {[summary.teamScores.alpha, summary.teamScores.omega].map((ts) => {
              const isAlpha = ts.team === 'alpha';
              const isWinTeam = !summary.isTie && summary.winningTeam === ts.team;
              return (
                <div
                  key={ts.team}
                  className={`rounded-lg p-3 border ${
                    isWinTeam
                      ? 'bg-[#0b1729] border-amber-400/75'
                      : isAlpha
                      ? 'bg-[#060d18] border-cyan-500/40'
                      : 'bg-[#060d18] border-pink-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isAlpha ? 'text-cyan-300' : 'text-pink-300'}`}>
                      {ts.name}
                    </span>
                    <span className="text-base font-black font-mono-numbers text-white">
                      {ts.totalPoints.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-slate-300">
                    Team PvP KOs: <strong className="text-white">{ts.pvpKills}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Score Breakdown Cards for Players */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5 max-h-72 overflow-y-auto">
          {players.map((p, idx) => {
            const isWinner =
              !summary.isTie &&
              (isTeamMode ? summary.winningTeam === p.team : summary.winnerSlot === p.slot);
            const isP1 = p.team ? p.team === 'alpha' : p.slot === 'p1';
            return (
              <div
                key={p.slot}
                data-testid={`duel-summary-${p.slot}`}
                className={`rounded-lg p-3 border ${
                  isWinner
                    ? 'bg-[#0b1729] border-amber-400/70'
                    : isP1
                    ? 'bg-[#060d18] border-cyan-500/35'
                    : 'bg-[#060d18] border-pink-500/35'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
                  <div>
                    <div className="text-sm font-bold" style={{ color: p.color || (isP1 ? '#67e8f9' : '#f9a8d4') }}>
                      #{idx + 1} {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isWinner ? 'Winner' : summary.isTie ? 'Tied' : isTeamMode && p.team ? `Team ${p.team.toUpperCase()}` : 'Contender'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Total Score</div>
                    <div className="text-lg font-black font-mono-numbers text-white tabular-nums">
                      {p.totalPoints.toLocaleString()}
                    </div>
                  </div>
                </div>

                <dl className="space-y-1 text-xs font-mono-numbers">
                  {!isPurePvp && (
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Enemy Kills</dt>
                      <dd className="font-bold text-white">{p.kills}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-400">PvP Takedowns</dt>
                    <dd className="text-pink-300 font-bold">
                      {p.pvpKills} (+{p.pvpBonusPoints.toLocaleString()})
                    </dd>
                  </div>
                  {!isPurePvp && (
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Base Kill Points</dt>
                      <dd className="text-cyan-300">+{p.baseKillPoints.toLocaleString()}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Best Streak / Momentum</dt>
                    <dd className="text-slate-200">{p.bestCombo}x · {p.momentumActivations}x</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Damage / Respawns</dt>
                    <dd className="text-slate-200">{p.damageDealt.toLocaleString()} · {p.deaths}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        {/* Chronological Match Kill Feed */}
        <MatchKillFeed events={summary.killFeed || []} />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {isSpectator ? (
            <div className="flex-1 text-center sm:text-left text-xs font-mono text-cyan-300 px-3 py-2 rounded-lg bg-[#050a14] border border-cyan-500/30">
              Spectating Finished · Waiting for Host Rematch or Return Home
            </div>
          ) : (
            <button
              type="button"
              onClick={onRematch}
              className="flex-1 w-full py-2.5 px-5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rematch Duel</span>
            </button>
          )}
          <button
            type="button"
            onClick={onTitle}
            className="flex-1 w-full py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
