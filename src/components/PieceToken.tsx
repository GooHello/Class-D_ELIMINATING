import { User, Wrench, AlertTriangle, FlaskConical, Cog, HelpCircle, Zap, Bomb, Sparkles } from 'lucide-react';
import type { SpecialType } from '../game/MatchEngine';
import type { PieceColor } from '../data/missions';

const WORK_ICONS: Record<PieceColor, React.ReactNode> = {
  blue: <Wrench size={13} strokeWidth={2.5} />,
  red: <AlertTriangle size={13} strokeWidth={2.5} />,
  green: <FlaskConical size={13} strokeWidth={2.5} />,
  orange: <Cog size={13} strokeWidth={2.5} />,
  purple: <HelpCircle size={13} strokeWidth={2.5} />,
};

const SPECIAL_ICONS: Record<string, React.ReactNode> = {
  striped_h: <Zap size={14} strokeWidth={2.5} />,
  striped_v: <Zap size={14} strokeWidth={2.5} style={{ transform: 'rotate(90deg)' }} />,
  bomb: <Bomb size={14} strokeWidth={2.5} />,
  rainbow: <Sparkles size={14} strokeWidth={2.5} />,
};

const WORK_LABELS: Record<PieceColor, string> = {
  blue: '杂役',
  red: '危险',
  green: '生物',
  orange: '机械',
  purple: '异常',
};

interface PieceTokenProps {
  color: PieceColor;
  special: SpecialType;
  dClassId: string;
  isSelected: boolean;
  isRemoving: boolean;
  removeClass?: string; // 消除动画分级
  isDropping: boolean;
  isPlayerPiece?: boolean;
  isTargetColor: boolean;
  isHazard?: boolean;
  onClick: () => void;
  onHover: () => void;
  onHoverEnd?: () => void;
}

export default function PieceToken({
  color, special, dClassId, isSelected, isRemoving, removeClass, isDropping, isPlayerPiece, isTargetColor, isHazard, onClick, onHover, onHoverEnd
}: PieceTokenProps) {
  return (
    <div
      className={`piece-cell ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <div
        className={[
          'piece-token',
          color,
          isRemoving ? (removeClass || 'removing') : '',
          isDropping ? 'dropping' : '',
          isPlayerPiece ? 'player-piece' : '',
          isTargetColor ? 'bonus-glow' : '',
          isHazard ? 'hazard-zone' : '',
        ].filter(Boolean).join(' ')}
      >
        {/* Hazard overlay */}
        {isHazard && <div className="token-hazard-overlay" />}

        {/* Top stripe - classification */}
        <div className="token-stripe">
          <span className="token-class-label">{WORK_LABELS[color]}</span>
        </div>

        {/* Person icon - large and central */}
        <div className="token-person">
          <User size={22} strokeWidth={2} />
        </div>

        {/* Work type icon */}
        <div className="token-work">
          {special !== 'none' ? SPECIAL_ICONS[special] : WORK_ICONS[color]}
        </div>

        {/* D-class ID */}
        <div className="token-id">{dClassId}</div>


        {/* Special glow */}
        {special !== 'none' && <div className="token-special-glow" />}

        {/* Player marker */}
        {isPlayerPiece && <div className="token-player-mark">你</div>}
      </div>
    </div>
  );
}
