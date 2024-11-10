// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'llama3.1',
    label: 'LLAMA 3.1 8B',
    apiIdentifier: 'llama3.1',
    description: 'State-of-the-art model from Meta ',
  },
] as const;

export const DEFAULT_MODEL_ID: string = 'llama3.1';
