import { Button } from '@/components/ui/button';
import { RECOMMENDED_GUESSES } from '../-lib/idiom-guess-schema';

type RecommendedGuessesComponentProps = {
  onSelectIdiom: (text: string) => void;
};

const RecommendedGuessesComponent = ({
  onSelectIdiom,
}: RecommendedGuessesComponentProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">推荐尝试</p>
      <p className="text-xs text-muted-foreground">点击即可填入下方输入框</p>
      <div className="flex flex-wrap gap-2">
        {RECOMMENDED_GUESSES.map((text) => (
          <Button
            key={text}
            type="button"
            variant="outline"
            aria-label={`填入 ${text}`}
            onClick={() => onSelectIdiom(text)}
          >
            {text}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default RecommendedGuessesComponent;
