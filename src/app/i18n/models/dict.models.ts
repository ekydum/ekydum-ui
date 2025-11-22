import { LANG_CODE } from './lang-code.enum';

export type I18nDictNode = Readonly<{
  [key in LANG_CODE]?: string;
} & { [LANG_CODE.en]: string }>;

export type I18nDict = Readonly<Record<string, I18nDictNode>>;

export type I18nLocalized = Readonly<Record<string, string>>;

export interface I18nMultilingual {
  readonly i18nDict: I18nDict;
  i18nStrings: I18nLocalized;
}
