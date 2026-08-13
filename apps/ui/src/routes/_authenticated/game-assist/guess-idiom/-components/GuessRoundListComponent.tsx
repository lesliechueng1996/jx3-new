import type { GuessRoundState } from '../-lib/idiom-guess-schema';
import GuessRoundRowComponent from './GuessRoundRowComponent';

type GuessRoundListComponentProps = {
  rounds: GuessRoundState[];
  onChangeRound: (id: string, round: GuessRoundState) => void;
  onRemoveRound: (id: string) => void;
};

const GuessRoundListComponent = ({
  rounds,
  onChangeRound,
  onRemoveRound,
}: GuessRoundListComponentProps) => {
  if (rounds.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        还没有录入猜测。在下方输入 4 个汉字并提交，开始标注反馈。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rounds.map((round, index) => (
        <GuessRoundRowComponent
          key={round.id}
          round={round}
          index={index}
          onChange={(nextRound) => onChangeRound(round.id, nextRound)}
          onRemove={() => onRemoveRound(round.id)}
        />
      ))}
    </div>
  );
};

export default GuessRoundListComponent;
