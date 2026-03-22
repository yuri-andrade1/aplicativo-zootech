export interface Animal {
  id: string; // brinco
  docId?: string; // firestore id
  name?: string;
  breed: string;
  birthDate: string;
  weight: number;
  status: 'ativo' | 'vendido' | 'morto';
  gender: 'macho' | 'fêmea';
  photoUrl?: string;
  photoUrls?: string[];
  lotId?: string;
  motherId?: string;
  fatherId?: string;
  observations?: string;
  ownerUid: string;
  createdAt?: string;
}

export interface Record {
  docId?: string;
  animalId: string;
  type: 'pesagem' | 'vacina' | 'tratamento' | 'reprodução' | 'parto' | 'cobertura' | 'mortalidade' | 'venda';
  date: string;
  value: string;
  notes?: string;
  ownerUid: string;
}

export interface Lot {
  docId?: string;
  name: string;
  description?: string;
  ownerUid: string;
}

export interface Post {
  docId?: string;
  uid: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  imageUrl?: string;
  likes: string[]; // array of uids
  commentsCount: number;
  createdAt: string;
}

export interface Comment {
  docId?: string;
  postId: string;
  uid: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
}

export interface Feeding {
  docId?: string;
  lotId?: string;
  animalId?: string;
  type: 'volumoso' | 'concentrado' | 'suplemento';
  description: string;
  amount: number; // in kg
  date: string;
  ownerUid: string;
}

export interface HealthAlert {
  docId?: string;
  animalId?: string;
  lotId?: string;
  type: 'vacina' | 'verminose' | 'manejo';
  title: string;
  date: string;
  completed: boolean;
  ownerUid: string;
}

export interface Article {
  docId?: string;
  title: string;
  content: string;
  category: 'dica' | 'curiosidade' | 'prática' | 'artigo';
  imageUrl?: string;
  createdAt: string;
}

export interface ForumQuestion {
  docId?: string;
  uid: string;
  authorName: string;
  authorPhoto?: string;
  title: string;
  content: string;
  resolved: boolean;
  createdAt: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: any;
}
