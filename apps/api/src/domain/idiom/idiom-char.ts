export type IdiomCharConstructorParams = {
  id: string | null;
  char: string;
  position: number;
  pinyin: string;
  initial: string;
  final: string;
  tone: number;
};

export class IdiomChar {
  id: string | null = null;
  position: number;
  char: string;
  pinyin: string;
  initial: string;
  final: string;
  tone: number;

  constructor(props: IdiomCharConstructorParams) {
    this.id = props.id;
    this.char = props.char;
    this.position = props.position;
    this.pinyin = props.pinyin;
    this.initial = props.initial;
    this.final = props.final;
    this.tone = props.tone;
  }
}
