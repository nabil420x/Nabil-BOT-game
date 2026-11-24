import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Swords,
  Users,
  Globe,
  Copy,
  Check,
  Play,
  X,
  Clock,
  ShieldAlert,
  Link2,
  RefreshCw,
  Send,
  Lock,
  Unlock,
  CheckCircle2,
  Eye,
  Trees,
  Shield,
} from 'lucide-react';
import type { DifficultyMode } from '../game/types';
import {
  buildDuelInviteUrl,
  buildDuelWatchUrl,
  formatDuelTimer,
  isPurePvpFormat,
  type DuelConfig,
  type DuelMatchFormat,
  type DuelModeType,
  type DuelSlotId,
  type DuelTeamId,
} from '../game/duel';
import {
  CYBER_FOREST_BACKDROP_SRC,
  type ArenaMapTheme,
} from '../game/arenaObstacles';
import {
  DuelClient,
  fetchDuelDirectory,
  fetchDuelRoomPreview,
  type DuelLobbyChatMessage,
  type DuelRoomPreview,
  type DuelRoomStatePayload,
  type LiveDuelMatchInfo,
  type OpenDuelRoomInfo,
  type SpectateJoinedPayload,
} from '../game/duelClient';
import { LEVELS, getLevelDef } from '../game/levels';

interface CyberDuelModalProps {
  isOpen: boolean;
  defaultDifficulty: DifficultyMode;
  defaultP1Name?: string;
  initialMode?: DuelModeType;
  initialRoomCode?: string | null;
  initialSpectate?: boolean;
  onClose: () => void;
  onStartDuel: (
    config: DuelConfig,
    onlineClient?: DuelClient,
    initialSpectateData?: SpectateJoinedPayload
  ) => void;
}

const FEATURED_DUEL_SECTORS = [1, 8, 15, 22, 29, 35, 41, 51, 61, 71, 81, 91];

export const CyberDuelModal: React.FC<CyberDuelModalProps> = ({
  isOpen,
  defaultDifficulty,
  defaultP1Name = 'Commander P1',
  initialMode = 'local',
  initialRoomCode = null,
  initialSpectate = false,
  onClose,
  onStartDuel,
}) => {
  const [mode, setMode] = useState<DuelModeType>(initialMode);
  const [matchFormat, setMatchFormat] = useState<DuelMatchFormat>(
    initialMode === 'online' ? 'pvp_solo' : 'pvpve_1v1'
  );
  const [mapTheme, setMapTheme] = useState<ArenaMapTheme>(
    initialMode === 'online' ? 'cyber_forest_ruins' : 'sector'
  );
  const [durationSeconds, setDurationSeconds] = useState<120 | 240>(120);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<DifficultyMode>(defaultDifficulty);
  const [freePointerMove, setFreePointerMove] = useState<boolean>(true);
  const [p1Name, setP1Name] = useState<string>(defaultP1Name);
  const [p2Name, setP2Name] = useState<string>('Challenger P2');

  // Online WebSocket Lobby state
  const [onlineName, setOnlineName] = useState<string>(defaultP1Name);
  const [isPublicRoom, setIsPublicRoom] = useState<boolean>(true);
  const [joinCodeInput, setJoinCodeInput] = useState<string>(initialRoomCode || '');
  const [roomPreview, setRoomPreview] = useState<DuelRoomPreview | null>(null);
  const [openRooms, setOpenRooms] = useState<OpenDuelRoomInfo[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveDuelMatchInfo[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

  const [roomState, setRoomState] = useState<DuelRoomStatePayload | null>(null);
  const [assignedSlot, setAssignedSlot] = useState<DuelSlotId | null>(null);
  const [isSpectatingLobby, setIsSpectatingLobby] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsBusy, setWsBusy] = useState<boolean>(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedWatchLink, setCopiedWatchLink] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<DuelLobbyChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');

  const clientRef = useRef<DuelClient | null>(null);
  const handedOffRef = useRef<boolean>(false);
  const assignedSlotRef = useRef<DuelSlotId | null>(null);
  const isSpectatingLobbyRef = useRef<boolean>(false);
  assignedSlotRef.current = assignedSlot;
  isSpectatingLobbyRef.current = isSpectatingLobby;

  const refreshOpenRooms = useCallback(async () => {
    setLoadingRooms(true);
    const dir = await fetchDuelDirectory();
    setOpenRooms(dir.rooms);
    setLiveMatches(dir.liveMatches);
    setLoadingRooms(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialRoomCode) {
        setMode('online');
        setJoinCodeInput(initialRoomCode.toUpperCase());
      } else {
        setMode(initialMode);
        if (initialMode === 'online') {
          setMatchFormat((prev) => (prev === 'pvpve_1v1' ? 'pvp_solo' : prev));
          setMapTheme('cyber_forest_ruins');
        } else {
          setMatchFormat('pvpve_1v1');
        }
      }
    } else {
      if (!handedOffRef.current && clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      handedOffRef.current = false;
      setRoomState(null);
      setAssignedSlot(null);
      setIsSpectatingLobby(false);
      setWsError(null);
      setWsBusy(false);
      setChatMessages([]);
      setChatInput('');
      setRoomPreview(null);
    }
  }, [isOpen, initialMode, initialRoomCode]);

  useEffect(() => {
    if (isOpen && mode === 'online' && !roomState) {
      refreshOpenRooms();
    }
  }, [isOpen, mode, roomState, refreshOpenRooms]);

  useEffect(() => {
    const cleaned = joinCodeInput.toUpperCase().trim();
    if (!isOpen || mode !== 'online' || roomState || cleaned.length < 4) {
      setRoomPreview(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const preview = await fetchDuelRoomPreview(cleaned);
      if (!cancelled) setRoomPreview(preview);
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, mode, roomState, joinCodeInput]);

  if (!isOpen) return null;

  const ensureClient = (): DuelClient => {
    if (!clientRef.current) {
      clientRef.current = new DuelClient();
    }
    const client = clientRef.current;
    client.setHandlers({
      onConnectionChange: (connected) => setWsConnected(connected),
      onRoomJoined: ({ slot, roomState: nextState }) => {
        setIsSpectatingLobby(false);
        setAssignedSlot(slot);
        setRoomState(nextState);
        setChatMessages(nextState.chatLog || []);
        setWsBusy(false);
        setWsError(null);
      },
      onSpectateJoined: (payload) => {
        setWsBusy(false);
        setWsError(null);
        if (payload.roomState.status === 'playing' || payload.summary) {
          handedOffRef.current = true;
          onStartDuel(
            {
              mode: 'online',
              matchFormat: payload.roomState.matchFormat || 'pvpve_1v1',
              mapTheme: payload.roomState.mapTheme || 'sector',
              durationSeconds: payload.roomState.durationSeconds,
              level: payload.roomState.level,
              difficulty: payload.roomState.difficulty,
              p1Name: payload.roomState.p1.name,
              p2Name: payload.roomState.p2.name,
              roomCode: payload.roomState.roomCode,
              localSlot: 'p1',
              isSpectator: true,
              players: payload.roomState.players,
            },
            client,
            payload
          );
          return;
        }
        setIsSpectatingLobby(true);
        setAssignedSlot(null);
        setRoomState(payload.roomState);
        setChatMessages(payload.roomState.chatLog || []);
      },
      onRoomState: (nextState) => {
        setRoomState(nextState);
        if (nextState.chatLog) setChatMessages(nextState.chatLog);
      },
      onLobbyChat: (entry) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === entry.id)) return prev;
          return [...prev, entry].slice(-20);
        });
      },
      onMatchStarted: (startedState) => {
        handedOffRef.current = true;
        const isSpec = client.isSpectator || isSpectatingLobbyRef.current;
        const slot = client.slot || assignedSlotRef.current || 'p1';
        onStartDuel(
          {
            mode: 'online',
            matchFormat: startedState.matchFormat || matchFormat,
            mapTheme: startedState.mapTheme || mapTheme,
            durationSeconds: startedState.durationSeconds,
            level: startedState.level,
            difficulty: startedState.difficulty,
            p1Name: startedState.p1.name,
            p2Name: startedState.p2.name,
            roomCode: startedState.roomCode,
            localSlot: isSpec ? 'p1' : slot,
            isSpectator: isSpec,
            freePointerMove,
            players: startedState.players,
          },
          client
        );
      },
      onError: (message) => {
        setWsBusy(false);
        setWsError(message);
      },
    });
    return client;
  };

  const handleSelectCombatFormat = (nextFormat: DuelMatchFormat) => {
    setMatchFormat(nextFormat);
    if (isPurePvpFormat(nextFormat)) {
      setMapTheme('cyber_forest_ruins');
    }
  };

  const handleStartLocal = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveFormat: DuelMatchFormat = matchFormat === 'pvp_team' ? 'pvp_solo' : matchFormat;
    onStartDuel({
      mode: 'local',
      matchFormat: effectiveFormat,
      mapTheme,
      durationSeconds,
      level: selectedLevel,
      difficulty,
      p1Name: p1Name.trim() || 'Commander P1',
      p2Name: p2Name.trim() || 'Challenger P2',
      localSlot: 'p1',
      freePointerMove,
    });
  };

  const handleCreateOnlineRoom = async () => {
    setWsError(null);
    setWsBusy(true);
    try {
      const client = ensureClient();
      await client.createRoom({
        playerName: onlineName.trim() || 'Commander P1',
        durationSeconds,
        level: selectedLevel,
        difficulty,
        isPublic: isPublicRoom,
        matchFormat,
        mapTheme,
      });
    } catch {
      setWsBusy(false);
      setWsError('Could not connect to Duel server.');
    }
  };

  const joinRoomByCode = async (codeToJoin: string) => {
    const cleaned = codeToJoin.toUpperCase().trim();
    if (!cleaned) {
      setWsError('Enter a valid 6-character room code.');
      return;
    }
    setWsError(null);
    setWsBusy(true);
    try {
      const client = ensureClient();
      await client.joinRoom(cleaned, onlineName.trim() || 'Challenger P2');
    } catch {
      setWsBusy(false);
      setWsError('Could not join Duel room.');
    }
  };

  const spectateRoomByCode = async (codeToWatch: string) => {
    const cleaned = codeToWatch.toUpperCase().trim();
    if (!cleaned) {
      setWsError('Enter a valid 6-character room code to spectate.');
      return;
    }
    setWsError(null);
    setWsBusy(true);
    try {
      const client = ensureClient();
      await client.spectateRoom(cleaned, onlineName.trim() || 'Spectator');
    } catch {
      setWsBusy(false);
      setWsError('Could not spectate Duel room.');
    }
  };

  const handleJoinOnlineRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialSpectate) {
      await spectateRoomByCode(joinCodeInput);
    } else {
      await joinRoomByCode(joinCodeInput);
    }
  };

  const handleStartOnlineMatch = () => {
    if (!clientRef.current || isSpectatingLobby) return;
    clientRef.current.startMatch();
  };

  const handleToggleReady = () => {
    if (!clientRef.current || !roomState || !assignedSlot || isSpectatingLobby) return;
    const roster = roomState.players && roomState.players.length > 0 ? roomState.players : [roomState.p1, roomState.p2];
    const current = roster.find((p) => p.slot === assignedSlot);
    const currentReady = current ? current.ready : assignedSlot === 'p1' ? roomState.p1.ready : roomState.p2.ready;
    clientRef.current.toggleReady(!currentReady);
  };

  const handleSwitchTeam = (team: DuelTeamId) => {
    if (!clientRef.current || !roomState || !assignedSlot || isSpectatingLobby) return;
    clientRef.current.switchTeam(team);
  };

  const handleSendChat = (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const text = (presetText ?? chatInput).trim();
    if (!text || !clientRef.current) return;
    clientRef.current.sendLobbyChat(text);
    if (!presetText) setChatInput('');
  };

  const handleLeaveRoom = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setRoomState(null);
    setAssignedSlot(null);
    setIsSpectatingLobby(false);
    setWsError(null);
    setWsConnected(false);
    setChatMessages([]);
  };

  const handleCopyCode = () => {
    if (!roomState?.roomCode) return;
    navigator.clipboard?.writeText(roomState.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleCopyInviteLink = () => {
    if (!roomState?.roomCode || typeof window === 'undefined') return;
    const inviteUrl = buildDuelInviteUrl(window.location.origin, roomState.roomCode);
    navigator.clipboard?.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyWatchLink = () => {
    if (!roomState?.roomCode || typeof window === 'undefined') return;
    const watchUrl = buildDuelWatchUrl(window.location.origin, roomState.roomCode);
    navigator.clipboard?.writeText(watchUrl);
    setCopiedWatchLink(true);
    setTimeout(() => setCopiedWatchLink(false), 2000);
  };

  const selectedLvlDef = LEVELS[selectedLevel - 1] || LEVELS[0];
  const lobbyLvlDef = roomState ? getLevelDef(roomState.level) : selectedLvlDef;
  const inviteUrl =
    roomState?.roomCode && typeof window !== 'undefined'
      ? buildDuelInviteUrl(window.location.origin, roomState.roomCode)
      : '';

  return (
    <div
      className="fixed inset-0 z-50 bg-[#04070e]/90 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cyber-duel-title"
    >
      <div className="w-full max-w-2xl bg-[#09111f] border border-cyan-500/40 rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#070d18]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cyber-duel-title" className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Cyber PvP &amp; Duel Arena
              </h2>
              <p className="text-xs text-slate-400">
                1v1 PvPvE · Pure PvP Solo / Team (Players Only) · Obstacle Cover Maps
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Cyber Duel setup"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Mode Segmented Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#050912] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => {
                handleLeaveRoom();
                setMode('local');
                if (matchFormat === 'pvp_team') setMatchFormat('pvp_solo');
              }}
              className={`py-2.5 px-4 rounded-md text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'local'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Local 1v1 (Same PC)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('online')}
              className={`py-2.5 px-4 rounded-md text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'online'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Online PvP / 1v1</span>
            </button>
          </div>

          {/* Match Format + Map Theme + Timer/Difficulty */}
          {!roomState && (
            <div className="space-y-3">
              {/* Combat Mode Selector */}
              <div className="bg-[#060b14] border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                  <span>Combat Mode</span>
                  <span className="text-cyan-300">
                    {isPurePvpFormat(matchFormat) ? 'Players Only · Zero AI Bots' : 'PvPvE · With AI Waves'}
                  </span>
                </div>
                <div className={`grid gap-2 ${mode === 'online' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  <button
                    type="button"
                    data-testid="format-pvp-solo"
                    onClick={() => handleSelectCombatFormat('pvp_solo')}
                    className={`px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      matchFormat === 'pvp_solo'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Pure PvP · Solo Fight</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {mode === 'online' ? '2-6 Players FFA · No Bots' : '1v1 Players Only · No Bots'}
                    </div>
                  </button>

                  {mode === 'online' && (
                    <button
                      type="button"
                      data-testid="format-pvp-team"
                      onClick={() => handleSelectCombatFormat('pvp_team')}
                      className={`px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        matchFormat === 'pvp_team'
                          ? 'bg-pink-500/20 border-pink-400 text-pink-200'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-pink-300" />
                        <span>Pure PvP · Team Battle</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Alpha vs Omega (Up to 3v3) · No Bots
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid="format-pvpve-1v1"
                    onClick={() => handleSelectCombatFormat('pvpve_1v1')}
                    className={`px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      matchFormat === 'pvpve_1v1'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-300" />
                      <span>1v1 Cyber Duel (PvPvE)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      1v1 + AI Hostile Waves
                    </div>
                  </button>
                </div>
              </div>

              {/* Arena Map Style (Crystal Conduit Ruins with Trees/Walls vs Classic Sector) */}
              <div className="bg-[#060b14] border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5 text-teal-400" />
                  <span>Arena Map &amp; Cover Obstacles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    data-testid="map-theme-cyber-forest"
                    onClick={() => setMapTheme('cyber_forest_ruins')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      mapTheme === 'cyber_forest_ruins'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-100'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={CYBER_FOREST_BACKDROP_SRC}
                      alt="Crystal Conduit Ruins"
                      className="w-16 h-11 rounded object-cover border border-purple-400/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Crystal Conduit Ruins</div>
                      <div className="text-[10px] text-slate-400">
                        Crystal Trees, Frosted Walls &amp; Crates Cover
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="map-theme-sector"
                    onClick={() => setMapTheme('sector')}
                    className={`p-2 rounded-lg border text-left flex flex-col justify-center transition-colors cursor-pointer ${
                      mapTheme === 'sector'
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-100'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold">Open Sector Grid</div>
                    <div className="text-[10px] text-slate-400">
                      Open Neon Arena · Zero Wall Cover
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Timer Duration */}
                <div className="bg-[#060b14] border border-slate-800 rounded-lg p-3">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Match Timer</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDurationSeconds(120)}
                      className={`py-1.5 px-2 rounded text-xs font-bold font-mono-numbers cursor-pointer transition-colors ${
                        durationSeconds === 120
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      2:00 (120s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationSeconds(240)}
                      className={`py-1.5 px-2 rounded text-xs font-bold font-mono-numbers cursor-pointer transition-colors ${
                        durationSeconds === 240
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      4:00 (240s)
                    </button>
                  </div>
                </div>

                {/* Sector Backdrop (shown for Open Sector) */}
                <div className="bg-[#060b14] border border-slate-800 rounded-lg p-3">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-2">
                    {mapTheme === 'cyber_forest_ruins' ? 'Selected Ruins Map' : 'Battleground Sector'}
                  </label>
                  {mapTheme === 'cyber_forest_ruins' ? (
                    <div className="text-xs font-bold text-purple-300 py-1">
                      Crystal Conduit Ruins · 16 Tactical Cover Obstacles
                    </div>
                  ) : (
                    <>
                      <select
                        aria-label="Battleground Map"
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-400"
                      >
                        {FEATURED_DUEL_SECTORS.map((lvlNum) => {
                          const def = LEVELS[lvlNum - 1];
                          return (
                            <option key={lvlNum} value={lvlNum}>
                              Sector {lvlNum}: {def.name}
                            </option>
                          );
                        })}
                        {LEVELS.filter((l) => !FEATURED_DUEL_SECTORS.includes(l.level)).map((l) => (
                          <option key={l.level} value={l.level}>
                            Sector {l.level}: {l.name}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-[11px] text-slate-400 truncate">
                        {selectedLvlDef.difficultyLabel}
                      </div>
                    </>
                  )}
                </div>

                {/* Difficulty Intensity (or Pure PvP status) */}
                <div className="bg-[#060b14] border border-slate-800 rounded-lg p-3">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isPurePvpFormat(matchFormat) ? 'Bot Waves' : 'Hostile Intensity'}</span>
                  </label>
                  {isPurePvpFormat(matchFormat) ? (
                    <div className="text-xs font-bold text-emerald-300 py-1">
                      Disabled · 100% Real Players Combat
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1">
                      {(['easy', 'normal', 'nightmare'] as DifficultyMode[]).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDifficulty(d)}
                          className={`py-1.5 px-1.5 rounded text-[11px] font-bold capitalize cursor-pointer transition-colors ${
                            difficulty === d
                              ? d === 'nightmare'
                                ? 'bg-rose-500/25 text-rose-300 border border-rose-400'
                                : d === 'easy'
                                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400'
                                : 'bg-cyan-500/25 text-cyan-300 border border-cyan-400'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Local 1v1 Setup */}
          {mode === 'local' && (
            <form onSubmit={handleStartLocal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#060b14] border border-cyan-500/35 rounded-lg p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">Player 1 (Left Flank)</span>
                    <span className="text-[11px] font-mono text-slate-400">Cyan Mech</span>
                  </div>
                  <input
                    type="text"
                    aria-label="Player 1 Name"
                    maxLength={18}
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    placeholder="Commander P1"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  <div className="text-xs text-slate-400 font-mono">
                    Move: WASD / Hold Pointer · Fire: Space / Click · Dash: L-Shift / Q
                  </div>
                </div>

                <div className="bg-[#060b14] border border-pink-500/35 rounded-lg p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-300">Player 2 (Right Flank)</span>
                    <span className="text-[11px] font-mono text-slate-400">Magenta Mech</span>
                  </div>
                  <input
                    type="text"
                    aria-label="Player 2 Name"
                    maxLength={18}
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    placeholder="Challenger P2"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-pink-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  <div className="text-xs text-slate-400 font-mono">
                    Move: Arrow Keys · Fire: Enter / Slash · Dash: R-Shift / L
                  </div>
                </div>
              </div>

              <div className="bg-[#060b14] border border-slate-800 rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-200">Free Gameplay Movement (Cursor / Touch Hold)</div>
                  <div className="text-[11px] text-slate-400">
                    Steer &amp; roam freely toward cursor/touch + WASD/Arrows, switch weapons (1-9, 0, X), &amp; toggle camera follow.
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="duel-free-move-toggle"
                  onClick={() => setFreePointerMove((v) => !v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                    freePointerMove
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  {freePointerMove ? 'Enabled' : 'Keyboard Only'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors shadow-[0_0_20px_rgba(0,243,255,0.35)]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>
                    {isPurePvpFormat(matchFormat) ? 'Start Local Pure PvP 1v1' : 'Start Local 1v1 Duel'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Online 1v1 WebSocket Lobby Setup */}
          {mode === 'online' && !roomState && (
            <div className="space-y-4">
              <div className="bg-[#060b14] border border-slate-800 rounded-lg p-4 space-y-2">
                <label htmlFor="online-pilot-name" className="text-xs font-semibold text-slate-300 block">
                  Your Pilot Name
                </label>
                <input
                  id="online-pilot-name"
                  type="text"
                  maxLength={18}
                  value={onlineName}
                  onChange={(e) => setOnlineName(e.target.value)}
                  placeholder="Enter your callsign"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              {wsError && (
                <div className="px-4 py-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200">
                  {wsError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Create Online Room */}
                <div className="bg-[#060b14] border border-cyan-500/30 rounded-lg p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-cyan-300">Host New Online Room</h3>
                    <p className="text-xs text-slate-400">
                      Create a live WebSocket room and send the invite link or code to your friend on another device.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsPublicRoom(true)}
                        className={`py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          isPublicRoom
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/70'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Open Lobby</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPublicRoom(false)}
                        className={`py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          !isPublicRoom
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/70'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Invite Only</span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={wsBusy}
                    onClick={handleCreateOnlineRoom}
                    className="w-full py-2.5 px-4 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                  >
                    {wsBusy ? 'Connecting...' : 'Create Duel Room'}
                  </button>
                </div>

                {/* Join or Spectate Friend's Room */}
                <form
                  onSubmit={handleJoinOnlineRoom}
                  className="bg-[#060b14] border border-pink-500/30 rounded-lg p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <h3 className="text-sm font-bold text-pink-300">
                      {initialSpectate ? 'Spectate Friend’s Match' : "Join or Watch Friend's Room"}
                    </h3>
                    <input
                      type="text"
                      aria-label="Room Code"
                      maxLength={8}
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter 6-char code"
                      className="mt-2 w-full bg-slate-900 border border-slate-700 focus:border-pink-400 rounded px-3 py-2 text-sm font-mono uppercase tracking-widest text-white focus:outline-none"
                    />
                    {roomPreview && (
                      <div
                        data-testid="duel-room-preview"
                        className={`mt-2 px-2.5 py-1.5 rounded text-[11px] border ${
                          roomPreview.exists && (roomPreview.canJoin || roomPreview.canSpectate)
                            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {roomPreview.exists
                          ? roomPreview.status === 'playing'
                            ? `LIVE (${
                                roomPreview.matchFormat === 'pvp_team'
                                  ? 'Team PvP'
                                  : roomPreview.matchFormat === 'pvp_solo'
                                  ? 'Solo PvP'
                                  : '1v1'
                              }): ${roomPreview.hostName} · ${roomPreview.playerCount ?? 2}/${
                                roomPreview.maxPlayers ?? 2
                              } Fighters · ${formatDuelTimer(roomPreview.timeRemaining ?? 0)} left · ${
                                roomPreview.spectatorCount ?? 0
                              } watching`
                            : roomPreview.canJoin
                            ? `Host: ${roomPreview.hostName} · ${
                                roomPreview.matchFormat === 'pvp_team'
                                  ? 'Team PvP'
                                  : roomPreview.matchFormat === 'pvp_solo'
                                  ? 'Solo PvP'
                                  : '1v1'
                              } (${roomPreview.playerCount ?? 1}/${roomPreview.maxPlayers ?? 2}) · ${
                                roomPreview.mapTheme === 'cyber_forest_ruins'
                                  ? 'Crystal Ruins'
                                  : `Sector ${roomPreview.level}`
                              }`
                            : `Room ${roomPreview.roomCode} full (${roomPreview.playerCount ?? 2}/${
                                roomPreview.maxPlayers ?? 2
                              }) · Spectate available`
                          : `No active room found for "${joinCodeInput}"`}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {!initialSpectate && (
                      <button
                        type="submit"
                        disabled={wsBusy || (roomPreview?.exists ? !roomPreview.canJoin : false)}
                        className="flex-1 py-2.5 px-3 rounded-lg bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition-colors"
                      >
                        {wsBusy ? 'Joining...' : 'Join Duel'}
                      </button>
                    )}
                    <button
                      type={initialSpectate ? 'submit' : 'button'}
                      disabled={wsBusy}
                      data-testid="spectate-duel-btn"
                      onClick={
                        initialSpectate
                          ? undefined
                          : () => {
                              spectateRoomByCode(joinCodeInput);
                            }
                      }
                      className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 ${
                        initialSpectate
                          ? 'flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{wsBusy ? 'Connecting...' : 'Watch Live'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Live Open Rooms & Live Matches Directory */}
              <div className="bg-[#060b14] border border-slate-800 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Open Rooms & Active Matches</span>
                  </span>
                  <button
                    type="button"
                    onClick={refreshOpenRooms}
                    disabled={loadingRooms}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingRooms ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {openRooms.length === 0 && liveMatches.length === 0 ? (
                  <div className="text-xs text-slate-500 py-1">
                    No open rooms or live matches right now. Create a room above or paste a friend&apos;s room code!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {openRooms.length > 0 && (
                      <div className="space-y-1.5" data-testid="open-duel-rooms-list">
                        {openRooms.map((r) => {
                          const rFormatLabel =
                            r.matchFormat === 'pvp_team'
                              ? 'Pure PvP Team'
                              : r.matchFormat === 'pvp_solo'
                              ? 'Pure PvP Solo'
                              : '1v1 PvPvE';
                          const rMapLabel =
                            r.mapTheme === 'cyber_forest_ruins' ? 'Crystal Ruins' : `Sector ${r.level}`;
                          return (
                            <div
                              key={r.roomCode}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-slate-900/90 border border-slate-800"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {r.hostName}&apos;s Arena{' '}
                                  <span className="font-mono text-cyan-300 ml-1">#{r.roomCode}</span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {rFormatLabel} · {rMapLabel} · {r.playerCount ?? 1}/{r.maxPlayers ?? 2} Players ·{' '}
                                  {formatDuelTimer(r.durationSeconds)}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={wsBusy}
                                  onClick={() => spectateRoomByCode(r.roomCode)}
                                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Watch</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={wsBusy}
                                  onClick={() => joinRoomByCode(r.roomCode)}
                                  className="px-3 py-1.5 rounded bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold cursor-pointer"
                                >
                                  Join
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {liveMatches.length > 0 && (
                      <div className="space-y-1.5" data-testid="live-spectate-matches-list">
                        {liveMatches.map((m) => (
                          <div
                            key={m.roomCode}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-cyan-950/20 border border-cyan-500/30"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                <span>
                                  {m.p1Name} vs {m.p2Name}
                                </span>
                                <span className="font-mono text-cyan-300">#{m.roomCode}</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Live · {formatDuelTimer(m.timeRemaining)} left · Sector {m.level} ·{' '}
                                {m.spectatorCount} watching
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={wsBusy}
                              onClick={() => spectateRoomByCode(m.roomCode)}
                              className="px-3 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Watch Live</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Online WebSocket Room Waiting Lobby */}
          {mode === 'online' && roomState && (
            <div className="space-y-4">
              {isSpectatingLobby && (
                <div
                  data-testid="spectating-lobby-banner"
                  className="px-4 py-2.5 rounded-lg bg-cyan-950/60 border border-cyan-400/50 text-xs font-bold text-cyan-200 flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-300" />
                    <span>Watching as Spectator · Match will appear live when Host starts</span>
                  </span>
                  <span className="font-mono text-cyan-300">
                    Spectators: {roomState.spectatorCount ?? 1}
                  </span>
                </div>
              )}

              <div className="bg-[#060b14] border border-cyan-500/40 rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400">
                      Share Player Invite Link or Spectator Watch Link
                    </div>
                    <div
                      className="text-2xl font-black font-mono tracking-widest text-cyan-300 mt-0.5"
                      data-testid="duel-room-code"
                    >
                      {roomState.roomCode}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-300 flex items-center gap-1.5 mr-1">
                      <span
                        className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      />
                      {wsConnected ? 'Live Sync' : 'Reconnecting'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode ? 'Copied' : 'Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      data-testid="copy-duel-invite-link"
                      className="px-2.5 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/50 text-xs font-bold text-pink-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedLink ? 'Invite Copied!' : 'Player Invite'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyWatchLink}
                      data-testid="copy-duel-watch-link"
                      className="px-2.5 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-xs font-bold text-cyan-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedWatchLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedWatchLink ? 'Watch Link Copied!' : 'Watch Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>
                    <strong className="text-purple-300">
                      {roomState.matchFormat === 'pvp_team'
                        ? 'Pure PvP · Team Battle'
                        : roomState.matchFormat === 'pvp_solo'
                        ? 'Pure PvP · Solo Fight'
                        : '1v1 PvPvE'}
                    </strong>{' '}
                    ·{' '}
                    <strong className="text-slate-200">
                      {roomState.mapTheme === 'cyber_forest_ruins'
                        ? 'Crystal Conduit Ruins'
                        : `Sector ${roomState.level}: ${lobbyLvlDef.name}`}
                    </strong>{' '}
                    · {formatDuelTimer(roomState.durationSeconds)} ·{' '}
                    <span className="text-cyan-300" data-testid="lobby-spectator-count">
                      Spectators: {roomState.spectatorCount ?? 0}
                    </span>
                  </span>
                  <span className="font-mono text-slate-500 truncate max-w-[240px]" title={inviteUrl}>
                    {inviteUrl}
                  </span>
                </div>
              </div>

              {wsError && (
                <div className="px-4 py-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200">
                  {wsError}
                </div>
              )}

              {/* Team Switcher (Only in Pure PvP Team Battle Lobby) */}
              {roomState.matchFormat === 'pvp_team' && !isSpectatingLobby && assignedSlot && (() => {
                const lobbyList = roomState.players && roomState.players.length > 0 ? roomState.players : [roomState.p1, roomState.p2];
                const myTeam = lobbyList.find((p) => p.slot === assignedSlot)?.team || 'alpha';
                return (
                  <div className="bg-[#060b14] border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      Your Team:{' '}
                      <strong className={myTeam === 'alpha' ? 'text-cyan-300' : 'text-pink-300'}>
                        {myTeam === 'alpha' ? 'Team Cyan (Alpha)' : 'Team Magenta (Omega)'}
                      </strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="switch-team-alpha"
                        onClick={() => handleSwitchTeam('alpha')}
                        className={`px-3 py-1.5 rounded border text-xs font-bold cursor-pointer transition-colors ${
                          myTeam === 'alpha'
                            ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/60 text-cyan-200'
                        }`}
                      >
                        Team Cyan (Alpha)
                      </button>
                      <button
                        type="button"
                        data-testid="switch-team-omega"
                        onClick={() => handleSwitchTeam('omega')}
                        className={`px-3 py-1.5 rounded border text-xs font-bold cursor-pointer transition-colors ${
                          myTeam === 'omega'
                            ? 'bg-pink-500 text-white border-pink-300'
                            : 'bg-pink-500/15 hover:bg-pink-500/25 border-pink-400/60 text-pink-200'
                        }`}
                      >
                        Team Magenta (Omega)
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Player Roster Slots (2-6 slots cleanly rendered) */}
              {(() => {
                const lobbyPlayers =
                  roomState.players && roomState.players.length > 0
                    ? roomState.players
                    : [roomState.p1, roomState.p2];
                const maxCap = roomState.maxPlayers || 2;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>
                        Connected Fighters: <strong className="text-white">{lobbyPlayers.filter((p) => p.connected).length}/{maxCap}</strong>
                      </span>
                      <span>
                        {isPurePvpFormat(roomState.matchFormat || 'pvpve_1v1')
                          ? 'No AI Bots · Players Fight Only'
                          : '1v1 + AI Bots'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="duel-lobby-roster">
                      {lobbyPlayers.map((lp, idx) => {
                        const isSelf = assignedSlot === lp.slot;
                        const isAlpha = lp.team === 'alpha' || (!lp.team && lp.slot === 'p1');
                        const isOmega = lp.team === 'omega' || (!lp.team && lp.slot === 'p2');
                        const cardBorder =
                          roomState.matchFormat === 'pvp_team'
                            ? isAlpha
                              ? 'border-cyan-500/45'
                              : 'border-pink-500/45'
                            : idx === 0
                            ? 'border-cyan-500/40'
                            : 'border-pink-500/35';
                        return (
                          <div key={lp.slot} className={`bg-[#060b14] border ${cardBorder} rounded-lg p-3.5`}>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="text-xs font-bold"
                                style={{ color: lp.color || (isAlpha ? '#00f3ff' : '#ff0077') }}
                              >
                                {lp.slot.toUpperCase()} {isSelf ? '(You)' : lp.slot === 'p1' ? '(Host)' : ''}
                                {roomState.matchFormat === 'pvp_team' && lp.team && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-900 text-[10px] border border-slate-700">
                                    {isAlpha ? 'ALPHA' : isOmega ? 'OMEGA' : lp.team.toUpperCase()}
                                  </span>
                                )}
                              </span>
                              {lp.connected && (
                                <span
                                  data-testid={lp.slot === 'p2' ? 'p2-ready-badge' : `ready-badge-${lp.slot}`}
                                  className={`text-[11px] font-bold flex items-center gap-1 ${
                                    lp.slot === 'p1' || lp.ready ? 'text-emerald-400' : 'text-amber-300'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{lp.slot === 'p1' ? 'Host Ready' : lp.ready ? 'Ready!' : 'Joined'}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-base font-bold text-white mt-1 truncate">{lp.name}</div>
                            <div className={`text-xs mt-0.5 ${lp.connected ? 'text-emerald-400' : 'text-amber-300'}`}>
                              {lp.connected ? 'Connected to Arena' : 'Waiting for fighter...'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Live Lobby Chat */}
              <div className="bg-[#060b14] border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Live Friend Chat</span>
                  <div className="flex items-center gap-1.5">
                    {(isSpectatingLobby ? ['Hype!', 'GLHF!', 'Watching Live!'] : ['Ready!', 'GLHF!', 'Let’s Duel!']).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSendChat(undefined, preset)}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300 cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="h-20 overflow-y-auto bg-[#04070e] border border-slate-800/80 rounded p-2 space-y-1 text-xs"
                  data-testid="duel-lobby-chat"
                >
                  {chatMessages.length === 0 ? (
                    <div className="text-slate-500 text-[11px]">
                      Say hi in lobby chat while waiting for match start...
                    </div>
                  ) : (
                    chatMessages.map((m) => (
                      <div key={m.id} className="leading-snug">
                        <span
                          className={`font-bold ${
                            m.slot === 'p1'
                              ? 'text-cyan-300'
                              : m.slot === 'p2'
                              ? 'text-pink-300'
                              : 'text-amber-300'
                          }`}
                        >
                          {m.slot === 'spectator' ? `[SPEC] ${m.sender}` : m.sender}:{' '}
                        </span>
                        <span className="text-slate-200">{m.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={(e) => handleSendChat(e)} className="flex gap-2">
                  <input
                    type="text"
                    aria-label="Lobby chat message"
                    maxLength={100}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Message lobby..."
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Send lobby message"
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold cursor-pointer"
                >
                  {isSpectatingLobby ? 'Stop Spectating' : 'Leave Room'}
                </button>

                {isSpectatingLobby ? (
                  <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Waiting for {roomState.p1.name} to start the match...</span>
                  </span>
                ) : assignedSlot === 'p1' ? (
                  (() => {
                    const lobbyPlayers =
                      roomState.players && roomState.players.length > 0
                        ? roomState.players
                        : [roomState.p1, roomState.p2];
                    const connectedFighters = lobbyPlayers.filter((p) => p.connected);
                    const hasEnoughPlayers = connectedFighters.length >= 2;
                    const isTeamMode = roomState.matchFormat === 'pvp_team';
                    const hasAlpha = connectedFighters.some((p) => p.team === 'alpha');
                    const hasOmega = connectedFighters.some((p) => p.team === 'omega');
                    const canStart = hasEnoughPlayers && (!isTeamMode || (hasAlpha && hasOmega));
                    return (
                      <button
                        type="button"
                        data-testid="start-online-match-btn"
                        disabled={!canStart}
                        onClick={handleStartOnlineMatch}
                        className="px-6 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>
                          {!hasEnoughPlayers
                            ? 'Waiting for Fighters...'
                            : isTeamMode && (!hasAlpha || !hasOmega)
                            ? 'Need Fighters on Both Teams'
                            : isPurePvpFormat(roomState.matchFormat || 'pvpve_1v1')
                            ? 'Start Pure PvP Match'
                            : roomState.p2.ready
                            ? 'Start Online 1v1 Duel (Ready!)'
                            : 'Start Online 1v1 Duel'}
                        </span>
                      </button>
                    );
                  })()
                ) : (
                  (() => {
                    const lobbyPlayers =
                      roomState.players && roomState.players.length > 0
                        ? roomState.players
                        : [roomState.p1, roomState.p2];
                    const selfPlayer = lobbyPlayers.find((p) => p.slot === assignedSlot) || roomState.p2;
                    return (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleToggleReady}
                          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            selfPlayer.ready
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                              : 'bg-pink-500 hover:bg-pink-400 text-white border-pink-400'
                          }`}
                        >
                          {selfPlayer.ready ? '✓ Ready (Click to Cancel)' : 'Mark Ready'}
                        </button>
                        <span className="text-xs font-semibold text-cyan-300">
                          Waiting for {roomState.p1.name} to start...
                        </span>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
