export class IdiomChar {
  position: number;
  char: string;
  pinyin: string;
  initial: string;
  final: string;
  tone: number;

  constructor(
    char: string,
    position: number,
    pinyin: string,
    initial: string,
    final: string,
    tone: number,
  ) {
    this.char = char;
    this.position = position;
    this.pinyin = pinyin;
    this.initial = initial;
    this.final = final;
    this.tone = tone;
  }
}
