
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Reference {
  uri: string;
  title: string;
}

export interface Message {
  role: Role;
  content: string;
  references?: Reference[];
}

export type Conversation = Message[];

export interface HistoryItem {
    id: string;
    title: string;
    conversation: Conversation;
}
