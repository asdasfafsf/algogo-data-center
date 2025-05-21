export type AcmicpcResponse = {
  html: string;
  key: string;
  title: string;
  level: number;
  levelText: string;
  typeList: string[];
  answerRate: number;
  submitCount: number;
  timeout: number;
  additionalTimeAllowed: boolean;
  memoryLimit: number;
  answerCount: number;
  answerPeopleCount: number;

  limit: string;
  sourceUrl: string;
  sourceId: string;
  source: string;
  hint: string;
  inputOutputList: AcmicpcInputOutput[];
  subTask: string;

  subTaskList: AcmicpcSubTask[];
  customExample: string;
  customImplementation: string;
  customGrader: string;
  customNotes: string;
  customAttachment: string;
  customSample: string;
  problemSource: string;
  languageLimitList: string[];
  input: string;
  output: string;
  style: string;

  content: string;
  protocol: string;
  etc: string;

  isSpecialJudge: boolean;
  isSubTask: boolean;
  isFunction: boolean;
  isInteractive: boolean;
  isTwoStep: boolean;
  isClass: boolean;
  isLanguageRestrict: boolean;
};

export type AcmicpcSubTask = {
  order: number;
  title: string;
  content: string;
};

export type AcmicpcInputOutput = {
  order: number;
  input: string;
  output: string;
  content: string;
};

export type AcmicpcRequest = {
  key: string;
  htmlUrl?: string;
  html?: string;
};
