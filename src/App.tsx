import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Plus,
  Users, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft,
  Calendar, 
  Weight, 
  Syringe, 
  Baby, 
  Activity,
  ArrowLeft,
  Trash2,
  Edit2,
  MapPin,
  PieChart as PieChartIcon,
  BarChart3,
  MessageSquare,
  Heart,
  Share2,
  BookOpen,
  HelpCircle,
  Wifi,
  WifiOff,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Camera,
  Image as ImageIcon,
  Maximize2,
  X,
  DollarSign,
  HeartPulse,
  Skull,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format, parseISO, differenceInDays, subMonths, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth, db, googleProvider } from './firebase';
import { Animal, Record, Lot, Post, Comment, Feeding, HealthAlert, Article, ForumQuestion, FirestoreErrorInfo } from './types';

// Error Handling
function handleFirestoreError(error: unknown, operationType: any, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Components
const Button = ({ children, onClick, className = '', variant = 'primary', disabled = false, type = 'button' }: any) => {
  const variants: any = {
    primary: 'bg-brand-primary text-white hover:bg-brand-secondary card-shadow',
    secondary: 'bg-white text-brand-primary border border-brand-primary/20 hover:bg-surface-warm card-shadow',
    danger: 'bg-red-500 text-white hover:bg-red-600 card-shadow',
    ghost: 'bg-transparent text-ink-muted hover:bg-stone-100',
    accent: 'bg-brand-accent text-white hover:opacity-90 card-shadow'
  };
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick} 
      className={`px-6 py-3 rounded-2xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-[2.5rem] card-shadow border border-stone-100 p-8 ${className}`}>
    {children}
  </div>
);

const Input = ({ label, value, onChange, type = 'text', placeholder = '', required = false, name, defaultValue, step }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted ml-1">{label}</label>}
    <input 
      name={name}
      type={type}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      required={required}
      step={type === 'number' ? 'any' : step}
      className="px-5 py-3.5 bg-surface-cream border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all placeholder:text-stone-300 text-ink"
    />
  </div>
);

const Select = ({ label, value, onChange, options, required = false, name, defaultValue }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted ml-1">{label}</label>}
    <select 
      name={name}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(e.target.value)}
      required={required}
      className="px-5 py-3.5 bg-surface-cream border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all bg-white appearance-none text-ink"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const Textarea = ({ label, value, onChange, placeholder = '', required = false, name, defaultValue, rows = 3 }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted ml-1">{label}</label>}
    <textarea 
      name={name}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className="px-5 py-3.5 bg-surface-cream border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all placeholder:text-stone-300 text-ink resize-none"
    />
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 group"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95 ${color} card-shadow`}>
      <Icon size={24} className="text-white" />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted group-hover:text-brand-primary">{label}</span>
  </button>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [feeding, setFeeding] = useState<Feeding[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [forumQuestions, setForumQuestions] = useState<ForumQuestion[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Form States
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [showAddRecord, setShowAddRecord] = useState<string | null>(null); // animalId
  const [recordType, setRecordType] = useState<string>('pesagem');
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showPhotoLightbox, setShowPhotoLightbox] = useState<string | null>(null);
  const [postPhotoPreview, setPostPhotoPreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [animalStatusFilter, setAnimalStatusFilter] = useState<'ativo' | 'morto' | 'vendido' | 'todos'>('ativo');
  const [animalLotFilter, setAnimalLotFilter] = useState<string>('todos');
  const [showAddLot, setShowAddLot] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [showAddFeeding, setShowAddFeeding] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddHealthAlert, setShowAddHealthAlert] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({});

  // Report Stats
  const reportStats = useMemo(() => {
    const total = animals.length;
    const active = animals.filter(a => a.status === 'ativo').length;
    const sold = animals.filter(a => a.status === 'vendido').length;
    const dead = animals.filter(a => a.status === 'morto').length;
    
    const births = records.filter(r => r.type === 'parto').length;
    
    return {
      total,
      active,
      sold,
      dead,
      birthRate: total > 0 ? (births / total) * 100 : 0,
      mortalityRate: total > 0 ? (dead / total) * 100 : 0,
      productivity: 85, // Placeholder for now
    };
  }, [animals, records]);

  // Filtered Animals
  const filteredAnimals = useMemo(() => {
    return animals.filter(a => 
      (animalStatusFilter === 'todos' || a.status === animalStatusFilter) && 
      (animalLotFilter === 'todos' || a.lotId === animalLotFilter) && 
      (a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
       a.breed.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [animals, searchTerm, animalStatusFilter, animalLotFilter]);

  // Indicators Calculation
  const indicators = useMemo(() => {
    const active = animals.filter(a => a.status === 'ativo');
    const births = records.filter(r => r.type === 'parto');
    const deaths = animals.filter(a => a.status === 'morto');
    
    // Natalidade (simplified: births / active females)
    const females = active.filter(a => a.gender === 'fêmea').length;
    const birthRate = females > 0 ? (births.length / females) * 100 : 0;
    
    // Mortalidade (deaths / total)
    const deathRate = animals.length > 0 ? (deaths.length / animals.length) * 100 : 0;
    
    return {
      birthRate: {
        value: birthRate.toFixed(1),
        status: birthRate > 80 ? 'good' : birthRate > 50 ? 'warning' : 'danger'
      },
      deathRate: {
        value: deathRate.toFixed(1),
        status: deathRate < 5 ? 'good' : deathRate < 10 ? 'warning' : 'danger'
      },
      productivity: {
        value: active.length > 0 ? 'Alta' : 'N/A',
        status: active.length > 10 ? 'good' : 'warning'
      }
    };
  }, [animals, records]);

  const saveLot = async (lotData: Partial<Lot>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'lots'), {
        ...cleanFirestoreData(lotData),
        ownerUid: user.uid
      });
      setShowAddLot(false);
    } catch (err) {
      handleFirestoreError(err, 'write', 'lots');
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Connection Test
  useEffect(() => {
    if (isAuthReady && user) {
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      };
      testConnection();
    }
  }, [isAuthReady, user]);

  // Online Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const qAnimals = query(collection(db, 'animals'), where('ownerUid', '==', user.uid));
    const unsubAnimals = onSnapshot(qAnimals, (snap) => {
      setAnimals(snap.docs.map(d => ({ ...d.data(), docId: d.id } as Animal)));
    }, (err) => handleFirestoreError(err, 'get', 'animals'));

    const qRecords = query(collection(db, 'records'), where('ownerUid', '==', user.uid));
    const unsubRecords = onSnapshot(qRecords, (snap) => {
      setRecords(snap.docs.map(d => ({ ...d.data(), docId: d.id } as Record)));
    }, (err) => handleFirestoreError(err, 'get', 'records'));

    const qLots = query(collection(db, 'lots'), where('ownerUid', '==', user.uid));
    const unsubLots = onSnapshot(qLots, (snap) => {
      setLots(snap.docs.map(d => ({ ...d.data(), docId: d.id } as Lot)));
    }, (err) => handleFirestoreError(err, 'get', 'lots'));

    const qPosts = query(collection(db, 'posts'));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setPosts(snap.docs.map(d => ({ ...d.data(), docId: d.id } as Post)).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    }, (err) => handleFirestoreError(err, 'get', 'posts'));

    const qComments = query(collection(db, 'comments'));
    const unsubComments = onSnapshot(qComments, (snap) => {
      setComments(snap.docs.map(d => ({ ...d.data(), docId: d.id } as Comment)).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')));
    }, (err) => handleFirestoreError(err, 'get', 'comments'));

    const qFeeding = query(collection(db, 'feeding'), where('ownerUid', '==', user.uid));
    const unsubFeeding = onSnapshot(qFeeding, (snap) => {
      setFeeding(snap.docs.map(d => ({ ...d.data(), docId: d.id } as Feeding)));
    }, (err) => handleFirestoreError(err, 'get', 'feeding'));

    const qAlerts = query(collection(db, 'health_alerts'), where('ownerUid', '==', user.uid));
    const unsubAlerts = onSnapshot(qAlerts, (snap) => {
      setHealthAlerts(snap.docs.map(d => ({ ...d.data(), docId: d.id } as HealthAlert)));
    }, (err) => handleFirestoreError(err, 'get', 'health_alerts'));

    const qArticles = query(collection(db, 'articles'));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      setArticles(snap.docs.map(d => ({ ...d.data(), docId: d.id } as Article)));
    }, (err) => handleFirestoreError(err, 'get', 'articles'));

    const qQuestions = query(collection(db, 'forum_questions'));
    const unsubQuestions = onSnapshot(qQuestions, (snap) => {
      setForumQuestions(snap.docs.map(d => ({ ...d.data(), docId: d.id } as ForumQuestion)));
    }, (err) => handleFirestoreError(err, 'get', 'forum_questions'));

    return () => {
      unsubAnimals();
      unsubRecords();
      unsubLots();
      unsubPosts();
      unsubComments();
      unsubFeeding();
      unsubAlerts();
      unsubArticles();
      unsubQuestions();
    };
  }, [isAuthReady, user]);

  // Helper: File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper: Clean Firestore Data (remove undefined)
  const cleanFirestoreData = (data: any) => {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
  };

  const exportToCSV = () => {
    if (!animals || animals.length === 0) return;

    const animalHeaders = ['Brinco/ID', 'Nome', 'Raça', 'Data Nascimento', 'Sexo', 'Status', 'Peso (kg)', 'Lote', 'Observações'];
    const animalRows = animals.map(a => [
      a.id,
      a.name || '',
      a.breed,
      a.birthDate,
      a.gender,
      a.status,
      a.weight || '',
      lots.find(l => l.docId === a.lotId)?.name || '',
      a.observations || ''
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

    const animalCsv = [animalHeaders.join(','), ...animalRows].join('\n');

    const recordHeaders = ['Brinco/ID Animal', 'Nome Animal', 'Tipo de Registro', 'Data', 'Valor', 'Observações'];
    const recordRows = records.map(r => {
      const animal = animals.find(a => a.docId === r.animalId);
      return [
        animal?.id || '',
        animal?.name || '',
        r.type,
        r.date,
        r.value || '',
        r.notes || ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    const recordCsv = [recordHeaders.join(','), ...recordRows].join('\n');

    const combinedCsv = `ANIMAIS\n${animalCsv}\n\nREGISTROS ZOOTECNICOS\n${recordCsv}`;
    
    const blob = new Blob(['\uFEFF' + combinedCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `exportacao_rebanho_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  // CRUD Operations
  const saveAnimal = async (animalData: Partial<Animal>) => {
    if (!user) return;
    try {
      const cleanData = cleanFirestoreData(animalData);

      if (editingAnimal?.docId) {
        await updateDoc(doc(db, 'animals', editingAnimal.docId), cleanData);
      } else {
        await addDoc(collection(db, 'animals'), {
          ...cleanData,
          ownerUid: user.uid,
          createdAt: new Date().toISOString(),
          status: 'ativo'
        });
      }
      setShowAddAnimal(false);
      setEditingAnimal(null);
    } catch (err) {
      handleFirestoreError(err, 'write', 'animals');
    }
  };

  const deleteAnimal = async (docId: string) => {
    setDeleteConfirm({
      title: 'Excluir Animal',
      message: 'Tem certeza que deseja excluir este animal? Esta ação não pode ser desfeita e todos os registros associados também serão perdidos.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'animals', docId));
          setSelectedAnimal(null);
        } catch (err) {
          handleFirestoreError(err, 'delete', 'animals');
        }
      }
    });
  };

  const saveRecord = async (recordData: Partial<Record>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'records'), {
        ...cleanFirestoreData(recordData),
        ownerUid: user.uid
      });

      if (recordData.type === 'mortalidade' && recordData.animalId) {
        await updateDoc(doc(db, 'animals', recordData.animalId), { status: 'morto' });
        // Update selected animal if it's the current one
        if (selectedAnimal?.docId === recordData.animalId) {
          setSelectedAnimal({ ...selectedAnimal, status: 'morto' });
        }
      } else if (recordData.type === 'venda' && recordData.animalId) {
        await updateDoc(doc(db, 'animals', recordData.animalId), { status: 'vendido' });
        if (selectedAnimal?.docId === recordData.animalId) {
          setSelectedAnimal({ ...selectedAnimal, status: 'vendido' });
        }
      }

      setShowAddRecord(null);
    } catch (err) {
      handleFirestoreError(err, 'write', 'records');
    }
  };

  const likePost = async (postId: string, currentLikes: string[]) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'posts', postId);
      const hasLiked = currentLikes.includes(user.uid);
      const newLikes = hasLiked 
        ? currentLikes.filter(id => id !== user.uid)
        : [...currentLikes, user.uid];
      
      await updateDoc(postRef, { likes: newLikes });
    } catch (err) {
      handleFirestoreError(err, 'update', 'posts');
    }
  };

  const deletePost = async (postId: string) => {
    setDeleteConfirm({
      title: 'Excluir Postagem',
      message: 'Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'posts', postId));
        } catch (err) {
          handleFirestoreError(err, 'delete', 'posts');
        }
      }
    });
  };

  const addComment = async (postId: string, content: string) => {
    if (!user || !content.trim()) return;
    try {
      await addDoc(collection(db, 'comments'), {
        postId,
        uid: user.uid,
        authorName: user.displayName || 'Produtor',
        authorPhoto: user.photoURL || '',
        content: content.trim(),
        createdAt: new Date().toISOString()
      });
      
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.docId === postId);
      if (post) {
        await updateDoc(postRef, { commentsCount: (post.commentsCount || 0) + 1 });
      }
      
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      handleFirestoreError(err, 'write', 'comments');
    }
  };

  const deleteComment = async (commentId: string, postId: string) => {
    setDeleteConfirm({
      title: 'Excluir Comentário',
      message: 'Tem certeza que deseja excluir este comentário?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'comments', commentId));
          const postRef = doc(db, 'posts', postId);
          const post = posts.find(p => p.docId === postId);
          if (post && post.commentsCount > 0) {
            await updateDoc(postRef, { commentsCount: post.commentsCount - 1 });
          }
        } catch (err) {
          handleFirestoreError(err, 'delete', 'comments');
        }
      }
    });
  };

  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [selectedAnimal]);

  // Dashboard Stats
  const stats = useMemo(() => {
    const active = animals.filter(a => a.status === 'ativo');
    const births = records.filter(r => r.type === 'parto' && isAfter(parseISO(r.date), subMonths(new Date(), 1)));
    const deaths = records.filter(r => r.type === 'mortalidade' && isAfter(parseISO(r.date), subMonths(new Date(), 1)));
    
    const breedData = active.reduce((acc: any, a) => {
      acc[a.breed] = (acc[a.breed] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.keys(breedData).map(name => ({ name, value: breedData[name] }));

    return {
      total: active.length,
      births: births.length,
      deaths: deaths.length,
      pieData
    };
  }, [animals, records]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-emerald-50"><Activity className="animate-spin text-emerald-600" size={48} /></div>;

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--surface-cream)] p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-stone-200/50 max-w-sm w-full flex flex-col items-center gap-8 border border-stone-100"
        >
          <div className="w-24 h-24 bg-[var(--surface-warm)] rounded-full flex items-center justify-center shadow-inner">
            <Users className="text-[var(--brand-primary)]" size={48} />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-serif font-bold text-[var(--brand-primary)] tracking-tight">OviCapri</h1>
            <p className="text-stone-500 font-medium leading-relaxed">Gestão digital de rebanho simples, humana e eficiente.</p>
          </div>
          <Button onClick={handleLogin} className="w-full py-5 text-lg shadow-lg shadow-stone-200">
            Entrar com Google
          </Button>
          <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold">Versão Digital 2026</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-cream)] pb-40 font-sans text-stone-800">
      {/* Header */}
      <header className="glass px-8 py-6 sticky top-0 z-30 flex justify-between items-center rounded-b-[2rem] card-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center card-shadow">
            <Activity size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-brand-primary leading-none">OviCapri</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mt-1">Gestão de Rebanho</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3 bg-white/50 pl-1.5 pr-4 py-1.5 rounded-2xl border border-stone-100 card-shadow">
            <img src={user.photoURL || ''} className="w-8 h-8 rounded-xl shadow-sm border border-white" referrerPolicy="no-referrer" />
            <span className="text-xs font-bold text-ink hidden sm:inline">{user.displayName?.split(' ')[0]}</span>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-300 hover:text-red-500 transition-all card-shadow border border-stone-100">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="p-6 pb-20 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
            {/* Online Status & Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-serif font-bold text-ink tracking-tight">Olá, {user?.displayName?.split(' ')[0]}!</h1>
                <p className="text-ink-muted font-medium">Seu rebanho está {indicators.productivity.status === 'good' ? 'excelente' : 'precisando de atenção'}.</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>

            {/* Indicators Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-3xl card-shadow border border-stone-100 flex flex-col items-center text-center gap-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  indicators.birthRate.status === 'good' ? 'bg-green-100 text-green-600' : 
                  indicators.birthRate.status === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                }`}>
                  <Baby size={20} />
                </div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-ink-muted mt-1">Natalidade</p>
                <p className="text-sm font-bold text-ink">{indicators.birthRate.value}%</p>
              </div>
              <div className="bg-white p-4 rounded-3xl card-shadow border border-stone-100 flex flex-col items-center text-center gap-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  indicators.deathRate.status === 'good' ? 'bg-green-100 text-green-600' : 
                  indicators.deathRate.status === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                }`}>
                  <Activity size={20} />
                </div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-ink-muted mt-1">Mortalidade</p>
                <p className="text-sm font-bold text-ink">{indicators.deathRate.value}%</p>
              </div>
              <div className="bg-white p-4 rounded-3xl card-shadow border border-stone-100 flex flex-col items-center text-center gap-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  indicators.productivity.status === 'good' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  <BarChart3 size={20} />
                </div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-ink-muted mt-1">Produção</p>
                <p className="text-sm font-bold text-ink">{indicators.productivity.value}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] card-shadow border border-stone-100">
              <QuickAction icon={PlusCircle} label="Animal" onClick={() => setShowAddAnimal(true)} color="bg-brand-primary" />
              <QuickAction icon={Utensils} label="Trato" onClick={() => setActiveTab('feeding')} color="bg-amber-500" />
              <QuickAction icon={Syringe} label="Vacina" onClick={() => setActiveTab('health')} color="bg-brand-accent" />
              <QuickAction icon={MessageSquare} label="Postar" onClick={() => setActiveTab('feed')} color="bg-indigo-500" />
            </div>

            {/* Health Alerts Summary */}
            <Card className="!p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif font-bold text-ink tracking-tight">Alertas Sanitários</h3>
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {healthAlerts.filter(a => !a.completed).length} Pendentes
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {healthAlerts.filter(a => !a.completed).length > 0 ? (
                  healthAlerts.filter(a => !a.completed).slice(0, 2).map(alert => (
                    <div key={alert.docId} className="flex items-center justify-between p-4 bg-surface-cream rounded-2xl border border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 card-shadow">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-ink">{alert.title}</p>
                          <p className="text-xs text-ink-muted">{format(parseISO(alert.date), "dd 'de' MMM", { locale: ptBR })}</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="!p-2" onClick={() => setActiveTab('health')}>
                        <ChevronRight size={20} />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 size={32} className="mx-auto text-green-200 mb-2" />
                    <p className="text-xs text-ink-muted font-medium">Tudo em dia por aqui!</p>
                  </div>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] card-shadow border border-stone-100 flex flex-col gap-1 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-primary/5 rounded-full transition-transform group-hover:scale-150"></div>
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest relative z-10">Total Ativos</p>
                <p className="text-4xl sm:text-5xl font-serif font-bold text-brand-primary relative z-10">{stats.total}</p>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] card-shadow border border-stone-100 flex flex-col gap-1 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-secondary/5 rounded-full transition-transform group-hover:scale-150"></div>
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest relative z-10">Nascimentos</p>
                <p className="text-4xl sm:text-5xl font-serif font-bold text-brand-secondary relative z-10">{stats.births}</p>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] card-shadow border border-stone-100 flex flex-col gap-1 relative overflow-hidden group col-span-2 sm:col-span-1">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-red-500/5 rounded-full transition-transform group-hover:scale-150"></div>
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest relative z-10">Óbitos (Mês)</p>
                <p className="text-4xl sm:text-5xl font-serif font-bold text-red-500 relative z-10">{stats.deaths}</p>
              </div>
            </div>

            <Card>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-ink">Distribuição por Raça</h2>
                  <p className="text-sm text-ink-muted font-medium">Visão geral do seu rebanho</p>
                </div>
                <div className="w-12 h-12 bg-surface-warm rounded-2xl flex items-center justify-center">
                  <PieChartIcon size={20} className="text-brand-primary" />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3a5a40', '#5a7a60', '#d4a373', '#8B735B'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '12px 20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                {stats.pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#3a5a40', '#5a7a60', '#d4a373', '#8B735B'][index % 4] }}></div>
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">{entry.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="bg-brand-primary p-10 rounded-[3rem] text-white card-shadow flex justify-between items-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-110"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <h3 className="font-serif font-bold text-3xl mb-2">Relatórios Detalhados</h3>
                <p className="text-white/70 text-sm font-medium max-w-[200px]">Acompanhe o desempenho zootécnico completo.</p>
              </div>
              <button 
                onClick={() => setActiveTab('reports')}
                className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <ChevronRight size={32} />
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'feed' && (
          <motion.div 
            key="feed"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-ink">Comunidade</h2>
              <Button onClick={() => setShowAddPost(true)} className="!px-4 !py-2 rounded-xl flex items-center gap-2">
                <Plus size={18} /> Postar
              </Button>
            </div>
            {posts.map(post => {
              const hasLiked = user && post.likes?.includes(user.uid);
              const postComments = comments.filter(c => c.postId === post.docId);
              
              return (
              <Card key={post.docId} className="!p-0 overflow-hidden">
                <div className="p-6 flex items-center gap-3 relative">
                  <img src={post.authorPhoto || ''} className="w-10 h-10 rounded-full border border-stone-100" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-ink">{post.authorName}</p>
                    <p className="text-[10px] text-ink-muted uppercase tracking-widest">{format(parseISO(post.createdAt), "dd 'de' MMM", { locale: ptBR })}</p>
                  </div>
                  {user && post.uid === user.uid && (
                    <button 
                      onClick={() => deletePost(post.docId!)}
                      className="absolute top-6 right-6 text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                {post.imageUrl && <img src={post.imageUrl} className="w-full aspect-video object-cover" referrerPolicy="no-referrer" />}
                <div className="p-6">
                  <p className="text-ink leading-relaxed mb-6">{post.content}</p>
                  <div className="flex items-center gap-6 border-t border-stone-50 pt-6">
                    <button 
                      onClick={() => likePost(post.docId!, post.likes || [])}
                      className={`flex items-center gap-2 transition-colors ${hasLiked ? 'text-red-500' : 'text-ink-muted hover:text-red-500'}`}
                    >
                      <Heart size={20} className={hasLiked ? 'fill-current' : ''} />
                      <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                    </button>
                    <div className="flex items-center gap-2 text-ink-muted">
                      <MessageSquare size={20} />
                      <span className="text-xs font-bold">{post.commentsCount || 0}</span>
                    </div>
                  </div>
                  
                  {/* Comments Section */}
                  <div className="mt-6 space-y-4">
                    {postComments.map(comment => (
                      <div key={comment.docId} className="flex gap-3 relative group">
                        <img src={comment.authorPhoto || ''} className="w-8 h-8 rounded-full border border-stone-100" referrerPolicy="no-referrer" />
                        <div className="flex-1 bg-stone-50 rounded-2xl p-3">
                          <p className="text-xs font-bold text-ink mb-1">{comment.authorName}</p>
                          <p className="text-sm text-ink-muted">{comment.content}</p>
                        </div>
                        {user && comment.uid === user.uid && (
                          <button 
                            onClick={() => deleteComment(comment.docId!, post.docId!)}
                            className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 text-stone-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Add Comment */}
                    <div className="flex gap-3 mt-4 items-center">
                      <img src={user?.photoURL || ''} className="w-8 h-8 rounded-full border border-stone-100" referrerPolicy="no-referrer" />
                      <div className="flex-1 relative">
                        <input 
                          type="text"
                          placeholder="Adicione um comentário..."
                          value={newComment[post.docId!] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.docId!]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addComment(post.docId!, newComment[post.docId!] || '');
                            }
                          }}
                          className="w-full bg-stone-50 border-none rounded-full py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-brand-primary"
                        />
                        <button 
                          onClick={() => addComment(post.docId!, newComment[post.docId!] || '')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-primary hover:text-brand-secondary transition-colors"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )})}
          </motion.div>
        )}

        {activeTab === 'feeding' && (
          <motion.div 
            key="feeding"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-ink">Alimentação</h2>
              <Button onClick={() => setShowAddFeeding(true)} className="!px-4 !py-2 rounded-xl flex items-center gap-2">
                <Plus size={18} /> Registrar Trato
              </Button>
            </div>
            <Card className="flex flex-col gap-4">
              {feeding.length > 0 ? (
                feeding.map(f => (
                  <div key={f.docId} className="flex items-center justify-between p-4 bg-surface-cream rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 card-shadow">
                        <Utensils size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-ink">{f.description}</p>
                        <p className="text-xs text-ink-muted">{f.amount}kg • {f.type}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-ink-muted">{format(parseISO(f.date), "dd/MM")}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Utensils size={48} className="mx-auto text-stone-200 mb-4" />
                  <p className="text-ink-muted font-medium">Nenhum registro de trato ainda.</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === 'health' && (
          <motion.div 
            key="health"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-ink">Sanidade</h2>
              <div className="flex gap-2 items-center">
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">
                  {healthAlerts.filter(a => !a.completed).length} Alertas
                </span>
                <Button onClick={() => setShowAddHealthAlert(true)} className="!px-4 !py-2 rounded-xl flex items-center gap-2">
                  <Plus size={18} /> Novo
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {healthAlerts.map(alert => (
                <Card key={alert.docId} className={`!p-6 border-l-4 ${alert.completed ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center card-shadow ${alert.completed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {alert.type === 'vacina' ? <Syringe size={24} /> : alert.type === 'verminose' ? <Activity size={24} /> : <ClipboardList size={24} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-ink">{alert.title}</h4>
                        <p className="text-xs text-ink-muted flex items-center gap-1">
                          <Calendar size={12} /> {format(parseISO(alert.date), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={async () => {
                          if (!alert.docId) return;
                          await updateDoc(doc(db, 'health_alerts', alert.docId), { completed: !alert.completed });
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${alert.completed ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <button 
                        onClick={() => {
                          if (!alert.docId) return;
                          setDeleteConfirm({
                            title: 'Excluir Alerta',
                            message: 'Tem certeza que deseja excluir este alerta de sanidade?',
                            onConfirm: async () => {
                              try {
                                await deleteDoc(doc(db, 'health_alerts', alert.docId!));
                              } catch (err) {
                                handleFirestoreError(err, 'delete', 'health_alerts');
                              }
                            }
                          });
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-stone-100 text-stone-400 hover:bg-red-100 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'edu' && (
          <motion.div 
            key="edu"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-2xl font-serif font-bold text-ink">Conteúdo Educativo</h2>
            <div className="grid grid-cols-1 gap-6">
              {articles.map(article => (
                <Card key={article.docId} className="!p-0 overflow-hidden group cursor-pointer">
                  {article.imageUrl && <img src={article.imageUrl} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />}
                  <div className="p-6">
                    <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {article.category}
                    </span>
                    <h3 className="text-xl font-bold text-ink mt-3 mb-2">{article.title}</h3>
                    <p className="text-ink-muted text-sm line-clamp-2">{article.content}</p>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'support' && (
          <motion.div 
            key="support"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-ink">Suporte ao Produtor</h2>
              <Button onClick={() => setShowAddQuestion(true)} className="!px-4 !py-2 rounded-xl flex items-center gap-2">
                <HelpCircle size={18} /> Nova Dúvida
              </Button>
            </div>
            <Card className="bg-brand-primary text-white !p-8">
              <h3 className="text-xl font-bold mb-2">Precisa de ajuda técnica?</h3>
              <p className="text-white/80 text-sm mb-6">Nossa equipe de especialistas está pronta para te auxiliar no manejo do seu rebanho.</p>
              <Button variant="secondary" className="!bg-white !text-brand-primary border-none">Falar com Técnico</Button>
            </Card>
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted ml-1">Dúvidas da Comunidade</h4>
              {forumQuestions.map(q => (
                <Card key={q.docId} className="!p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <img src={q.authorPhoto || ''} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      <div>
                        <p className="text-xs font-bold text-ink">{q.authorName}</p>
                        <p className="text-[10px] text-ink-muted">{format(parseISO(q.createdAt), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                    {q.resolved && <span className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-[8px] font-bold uppercase tracking-widest">Resolvido</span>}
                  </div>
                  <h4 className="font-bold text-ink mb-2">{q.title}</h4>
                  <p className="text-sm text-ink-muted line-clamp-3">{q.content}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'animals' && !selectedAnimal && (
          <motion.div 
            key="animals-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-ink">Meus Animais</h2>
                <p className="text-sm text-ink-muted font-medium">{filteredAnimals.length} animais encontrados</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportToCSV} variant="secondary" className="flex items-center gap-2 px-4">
                  <Download size={20} className="sm:mr-1" /> <span className="hidden sm:inline">Exportar</span>
                </Button>
                <Button onClick={() => setShowAddAnimal(true)} className="flex items-center gap-2 px-6">
                  <Plus size={20} /> Novo
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 transition-colors group-focus-within:text-brand-primary" size={20} />
                <input 
                  placeholder="Buscar por brinco ou nome..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4.5 bg-white border border-stone-100 rounded-[1.5rem] card-shadow focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 outline-none transition-all text-ink placeholder:text-stone-300 font-medium"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-1 items-center">
                  {(['ativo', 'morto', 'vendido', 'todos'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setAnimalStatusFilter(status)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                        animalStatusFilter === status 
                          ? 'bg-brand-primary text-white shadow-md' 
                          : 'bg-white text-stone-400 border border-stone-100 hover:bg-stone-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="w-full sm:w-64">
                  <select
                    value={animalLotFilter}
                    onChange={(e) => setAnimalLotFilter(e.target.value)}
                    className="w-full px-5 py-2.5 bg-white border border-stone-100 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all text-sm font-medium text-ink-muted appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
                  >
                    <option value="todos">Todos os Lotes</option>
                    {lots.map(lot => (
                      <option key={lot.docId} value={lot.docId}>{lot.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {filteredAnimals.map(animal => (
                <motion.div 
                  key={animal.docId} 
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAnimal(animal)}
                  className="bg-white p-6 rounded-[2rem] border border-stone-100 card-shadow flex items-center justify-between cursor-pointer hover:border-brand-primary/20 transition-all"
                >
                  <div className="flex items-center gap-5">
                    {animal.photoUrl ? (
                      <img src={animal.photoUrl} className="w-16 h-16 rounded-2xl object-cover card-shadow border border-stone-100" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center card-shadow ${animal.gender === 'macho' ? 'bg-stone-100 text-ink-muted' : 'bg-surface-warm text-brand-primary'}`}>
                        <Activity size={32} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-serif font-bold text-ink">#{animal.id} {animal.name && <span className="text-ink-muted font-sans font-medium ml-1 text-base">| {animal.name}</span>}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted bg-stone-50 px-2 py-0.5 rounded-md border border-stone-100">{animal.breed}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted bg-stone-50 px-2 py-0.5 rounded-md border border-stone-100">{animal.gender}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-surface-cream rounded-full flex items-center justify-center text-stone-300 group-hover:text-brand-primary transition-colors">
                    <ChevronRight size={24} />
                  </div>
                </motion.div>
              ))}
              {filteredAnimals.length === 0 && (
                <div className="text-center py-24 bg-white/50 rounded-[3rem] border border-dashed border-stone-200">
                  <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={32} className="text-stone-300" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-ink mb-1">Nenhum animal encontrado</h3>
                  <p className="text-ink-muted font-medium">Tente buscar por outro termo ou adicione um novo animal.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {selectedAnimal && (
          <motion.div 
            key="animal-details"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
            <button 
              onClick={() => setSelectedAnimal(null)} 
              className="flex items-center gap-2 text-brand-primary font-bold group w-fit"
            >
              <div className="w-10 h-10 bg-surface-cream rounded-full flex items-center justify-center group-hover:-translate-x-1 transition-transform card-shadow border border-stone-100">
                <ArrowLeft size={20} />
              </div>
              <span className="text-sm uppercase tracking-widest">Voltar para lista</span>
            </button>

            <div className="bg-white p-10 rounded-[3rem] card-shadow border border-stone-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-surface-warm rounded-full -mr-24 -mt-24 opacity-50"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start relative z-10 gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-6">
                    {selectedAnimal.photoUrls && selectedAnimal.photoUrls.length > 1 ? (
                      <div className="relative group w-40 h-40">
                        <AnimatePresence mode="wait">
                          <motion.img 
                            key={currentPhotoIndex}
                            src={selectedAnimal.photoUrls[currentPhotoIndex]} 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => setShowPhotoLightbox(selectedAnimal.photoUrls![currentPhotoIndex])}
                            className="w-40 h-40 rounded-[2.5rem] object-cover card-shadow border-4 border-white cursor-zoom-in" 
                            referrerPolicy="no-referrer" 
                          />
                        </AnimatePresence>
                        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex((prev) => (prev === 0 ? selectedAnimal.photoUrls!.length - 1 : prev - 1)); }}
                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-brand-primary shadow-md pointer-events-auto hover:scale-110 transition-transform"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex((prev) => (prev === selectedAnimal.photoUrls!.length - 1 ? 0 : prev + 1)); }}
                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-brand-primary shadow-md pointer-events-auto hover:scale-110 transition-transform"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                        <button 
                          onClick={() => setShowPhotoLightbox(selectedAnimal.photoUrls![currentPhotoIndex])}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Maximize2 size={14} />
                        </button>
                      </div>
                    ) : selectedAnimal.photoUrl ? (
                      <div className="relative group w-40 h-40">
                        <img 
                          src={selectedAnimal.photoUrl} 
                          onClick={() => setShowPhotoLightbox(selectedAnimal.photoUrl!)}
                          className="w-40 h-40 rounded-[2.5rem] object-cover card-shadow border-4 border-white cursor-zoom-in" 
                          referrerPolicy="no-referrer" 
                        />
                        <button 
                          onClick={() => setShowPhotoLightbox(selectedAnimal.photoUrl!)}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Maximize2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className={`w-40 h-40 rounded-[2.5rem] flex items-center justify-center card-shadow ${selectedAnimal.gender === 'macho' ? 'bg-stone-100 text-ink-muted' : 'bg-surface-warm text-brand-primary'}`}>
                        <Activity size={64} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-5xl font-serif font-bold text-ink tracking-tight">#{selectedAnimal.id}</h2>
                        {selectedAnimal.status === 'morto' && (
                          <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest mt-2">Morto</span>
                        )}
                        {selectedAnimal.status === 'vendido' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest mt-2">Vendido</span>
                        )}
                      </div>
                      <p className="text-ink-muted font-medium text-xl mt-1">{selectedAnimal.name || 'Sem nome'}</p>
                    </div>
                  </div>
                  {selectedAnimal.photoUrls && selectedAnimal.photoUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide ml-2">
                      {selectedAnimal.photoUrls.map((url, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setCurrentPhotoIndex(idx)}
                          className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${idx === currentPhotoIndex ? 'border-brand-primary scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setEditingAnimal(selectedAnimal); setShowAddAnimal(true); }} className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 hover:text-brand-primary hover:bg-surface-warm transition-all card-shadow border border-stone-100">
                    <Edit2 size={20} />
                  </button>
                  <button onClick={() => deleteAnimal(selectedAnimal.docId!)} className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all card-shadow border border-stone-100">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-12 relative z-10">
                <div className="flex items-center gap-5 bg-surface-cream p-5 rounded-[1.5rem] border border-stone-100 card-shadow">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center card-shadow">
                    <Calendar size={24} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest">Nascimento</p>
                    <p className="text-base font-bold text-ink">{format(parseISO(selectedAnimal.birthDate), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 bg-surface-cream p-5 rounded-[1.5rem] border border-stone-100 card-shadow">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center card-shadow">
                    <Weight size={24} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest">Peso Atual</p>
                    <p className="text-base font-bold text-ink">{selectedAnimal.weight} kg</p>
                  </div>
                </div>
                {(selectedAnimal.motherId || selectedAnimal.fatherId) && (
                  <div className="flex items-center gap-5 bg-surface-cream p-5 rounded-[1.5rem] border border-stone-100 card-shadow col-span-2">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center card-shadow">
                      <Activity size={24} className="text-brand-primary" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-12">
                      {selectedAnimal.motherId && (
                        <div>
                          <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest">Mãe</p>
                          <p className="text-base font-bold text-ink">{selectedAnimal.motherId}</p>
                        </div>
                      )}
                      {selectedAnimal.fatherId && (
                        <div>
                          <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest">Pai</p>
                          <p className="text-base font-bold text-ink">{selectedAnimal.fatherId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-5 bg-surface-cream p-5 rounded-[1.5rem] border border-stone-100 card-shadow col-span-2">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center card-shadow">
                    <MapPin size={24} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest">Lote / Localização</p>
                    <p className="text-base font-bold text-ink">{lots.find(l => l.docId === selectedAnimal.lotId)?.name || 'Sem lote definido'}</p>
                  </div>
                </div>
              </div>

              {selectedAnimal.observations && (
                <div className="mt-12 p-6 bg-surface-warm rounded-[2rem] border border-brand-primary/10 relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity size={18} className="text-brand-primary" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Observações de Identificação</h3>
                  </div>
                  <p className="text-ink leading-relaxed font-medium">
                    {selectedAnimal.observations}
                  </p>
                </div>
              )}

              <div className="mt-16 relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-ink">Histórico Zootécnico</h3>
                    <p className="text-sm text-ink-muted font-medium">Acompanhamento de saúde e manejo</p>
                  </div>
                  <Button variant="secondary" className="text-xs py-2.5 px-6 rounded-full" onClick={() => { setShowAddRecord(selectedAnimal.docId!); setRecordType('pesagem'); }}>
                    + Novo Registro
                  </Button>
                </div>
                <div className="flex flex-col gap-0">
                  {records.filter(r => r.animalId === selectedAnimal.docId).sort((a,b) => b.date.localeCompare(a.date)).map((record, idx, arr) => (
                    <div key={record.docId} className="flex gap-8">
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center card-shadow border border-white relative z-10 ${
                          record.type === 'mortalidade' ? 'bg-red-50 text-red-500' :
                          record.type === 'venda' ? 'bg-green-50 text-green-600' :
                          record.type === 'cobertura' ? 'bg-pink-50 text-pink-500' :
                          'bg-surface-warm text-brand-primary'
                        }`}>
                          {record.type === 'pesagem' && <Weight size={20} />}
                          {record.type === 'vacina' && <Syringe size={20} />}
                          {record.type === 'parto' && <Baby size={20} />}
                          {record.type === 'tratamento' && <Activity size={20} />}
                          {record.type === 'reprodução' && <Users size={20} />}
                          {record.type === 'cobertura' && <HeartPulse size={20} />}
                          {record.type === 'mortalidade' && <Skull size={20} />}
                          {record.type === 'venda' && <DollarSign size={20} />}
                        </div>
                        {idx !== arr.length - 1 && <div className="w-0.5 h-full bg-stone-100 my-1"></div>}
                      </div>
                      <div className="pb-10 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest mb-1">{format(parseISO(record.date), 'dd MMM yyyy', { locale: ptBR })}</p>
                            <p className="text-xl font-serif font-bold text-ink capitalize">
                              {record.type === 'mortalidade' ? 'Óbito' : record.type}
                              {record.value && (
                                <>: <span className={
                                  record.type === 'mortalidade' ? 'text-red-500' :
                                  record.type === 'venda' ? 'text-green-600' :
                                  'text-brand-primary'
                                }>{record.value}</span></>
                              )}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              if (!record.docId) return;
                              setDeleteConfirm({
                                title: 'Excluir Registro',
                                message: 'Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.',
                                onConfirm: async () => {
                                  try {
                                    await deleteDoc(doc(db, 'records', record.docId!));
                                  } catch (err) {
                                    handleFirestoreError(err, 'delete', 'records');
                                  }
                                }
                              });
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {record.notes && (
                          <div className="mt-3 bg-surface-cream p-4 rounded-2xl border border-stone-100 italic text-ink-muted text-sm leading-relaxed relative">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                              record.type === 'mortalidade' ? 'bg-red-500/30' :
                              record.type === 'venda' ? 'bg-green-600/30' :
                              'bg-brand-accent/30'
                            }`}></div>
                            "{record.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {records.filter(r => r.animalId === selectedAnimal.docId).length === 0 && (
                    <div className="text-center py-12 bg-surface-cream rounded-[2rem] border border-dashed border-stone-200">
                      <p className="text-ink-muted font-medium italic">Nenhum registro encontrado para este animal.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'lots' && (
          <motion.div 
            key="lots"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
             <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-ink">Lotes / Pastos</h2>
                <p className="text-sm text-ink-muted font-medium">Gestão de áreas e grupos</p>
              </div>
              <Button onClick={() => setShowAddLot(true)} className="flex items-center gap-2 px-6">
                <Plus size={20} /> Novo
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {lots.map(lot => (
                <motion.div 
                  key={lot.docId} 
                  whileHover={{ y: -2 }}
                  className="bg-white p-10 rounded-[3rem] border border-stone-100 card-shadow group hover:border-brand-primary/20 transition-all"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-ink group-hover:text-brand-primary transition-colors">{lot.name}</h3>
                      <p className="text-ink-muted font-medium mt-2 leading-relaxed">{lot.description || 'Sem descrição'}</p>
                    </div>
                    <div className="w-16 h-16 bg-surface-warm rounded-[1.5rem] flex items-center justify-center text-brand-primary card-shadow">
                      <MapPin size={32} />
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-ink font-bold">
                      <div className="w-10 h-10 bg-surface-cream rounded-xl flex items-center justify-center card-shadow">
                        <Users size={20} className="text-brand-primary" />
                      </div>
                      <span className="text-lg">{animals.filter(a => a.lotId === lot.docId && a.status === 'ativo').length} <span className="text-ink-muted font-medium text-base">animais</span></span>
                    </div>
                    <button className="text-xs font-bold uppercase tracking-widest text-brand-accent hover:text-brand-primary transition-colors flex items-center gap-2">
                      Ver Detalhes <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
              {lots.length === 0 && (
                <div className="text-center py-24 bg-white/50 rounded-[3rem] border border-dashed border-stone-200">
                  <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin size={32} className="text-stone-300" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-ink mb-1">Nenhum lote cadastrado</h3>
                  <p className="text-ink-muted font-medium">Organize seu rebanho criando lotes ou pastos.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
            <div>
              <h2 className="text-3xl font-serif font-bold text-ink">Relatórios Mensais</h2>
              <p className="text-sm text-ink-muted font-medium">Análise de desempenho e saúde</p>
            </div>
            
            <Card>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-surface-warm rounded-2xl flex items-center justify-center text-brand-primary card-shadow">
                  <BarChart3 size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-ink">Resumo do Rebanho</h3>
                  <p className="text-xs text-ink-muted font-bold uppercase tracking-widest">Dados consolidados</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center p-6 bg-surface-cream rounded-[1.5rem] border border-stone-100 card-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(58,90,64,0.5)]"></div>
                    <span className="text-ink font-bold text-lg">Animais Ativos</span>
                  </div>
                  <span className="text-3xl font-serif font-bold text-brand-primary">{reportStats.active}</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-surface-cream rounded-[1.5rem] border border-stone-100 card-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                    <span className="text-ink font-bold text-lg">Animais Vendidos</span>
                  </div>
                  <span className="text-3xl font-serif font-bold text-blue-600">{reportStats.sold}</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-surface-cream rounded-[1.5rem] border border-stone-100 card-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                    <span className="text-ink font-bold text-lg">Mortalidade</span>
                  </div>
                  <span className="text-3xl font-serif font-bold text-red-600">{reportStats.dead}</span>
                </div>
                <div className="flex justify-between items-center pt-6 px-4 border-t border-stone-100">
                  <span className="text-ink-muted font-bold uppercase tracking-[0.2em] text-[10px]">Total Histórico</span>
                  <span className="text-4xl font-serif font-bold text-ink">{reportStats.total}</span>
                </div>
              </div>
            </Card>

            <div className="bg-surface-warm p-10 rounded-[3rem] border border-brand-primary/10 relative card-shadow">
              <div className="absolute -top-10 -right-10 p-4 opacity-5">
                <Activity size={160} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-brand-primary mb-4 flex items-center gap-3">
                <div className="w-2 h-8 bg-brand-primary rounded-full"></div>
                Dica Zootécnica
              </h3>
              <p className="text-ink font-medium text-lg leading-relaxed italic relative z-10">
                "Mantenha as pesagens em dia para identificar animais com baixo desempenho. 
                O ganho de peso médio é o principal indicador de lucro na ovinocultura."
              </p>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-100 px-8 py-5 z-40 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[2.5rem]">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
          { id: 'animals', icon: Users, label: 'Rebanho' },
          { id: 'feed', icon: MessageSquare, label: 'Feed' },
          { id: 'edu', icon: BookOpen, label: 'Educa' },
          { id: 'support', icon: HelpCircle, label: 'Ajuda' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSelectedAnimal(null); }}
            className={`flex flex-col items-center gap-1.5 transition-all relative group ${activeTab === tab.id ? 'text-brand-primary' : 'text-stone-300 hover:text-stone-400'}`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute -top-5 w-10 h-1.5 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(58,90,64,0.3)]"
              />
            )}
            <div className={`p-1 rounded-xl transition-all ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`}>
              <tab.icon size={26} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em]">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      <AnimatePresence>
      {showAddAnimal && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
        >
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 card-shadow border border-stone-100 my-auto"
          >
            <div className="w-12 h-1.5 bg-stone-100 rounded-full mx-auto mb-8 sm:hidden"></div>
            <h2 className="text-3xl font-serif font-bold text-ink mb-10">{editingAnimal ? 'Editar Animal' : 'Novo Animal'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const photoFiles = (e.currentTarget.elements.namedItem('photos') as HTMLInputElement).files;
              let photoUrls = editingAnimal?.photoUrls || (editingAnimal?.photoUrl ? [editingAnimal.photoUrl] : []);

              if (photoFiles && photoFiles.length > 0) {
                try {
                  const newUrls = await Promise.all(Array.from(photoFiles).map(file => fileToBase64(file)));
                  photoUrls = [...photoUrls, ...newUrls];
                } catch (err) {
                  console.error('Error converting photos:', err);
                }
              }

              saveAnimal({
                id: formData.get('id') as string,
                name: formData.get('name') as string,
                breed: formData.get('breed') as string,
                birthDate: formData.get('birthDate') as string,
                weight: Number(formData.get('weight')),
                gender: formData.get('gender') as any,
                lotId: formData.get('lotId') as string,
                motherId: formData.get('motherId') as string,
                fatherId: formData.get('fatherId') as string,
                photoUrl: photoUrls[0] || null,
                photoUrls: photoUrls,
                observations: formData.get('observations') as string
              });
            }} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {(editingAnimal?.photoUrls || (editingAnimal?.photoUrl ? [editingAnimal.photoUrl] : [])).map((url, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img src={url} className="w-20 h-20 rounded-2xl object-cover border-2 border-stone-100" />
                      <button 
                        type="button"
                        onClick={() => {
                          const newUrls = (editingAnimal?.photoUrls || [editingAnimal?.photoUrl!]).filter((_, i) => i !== idx);
                          setEditingAnimal({ ...editingAnimal!, photoUrls: newUrls, photoUrl: newUrls[0] || undefined });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="relative cursor-pointer group flex-shrink-0">
                    <div className="w-20 h-20 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 group-hover:border-brand-primary group-hover:text-brand-primary transition-all overflow-hidden">
                      <Plus size={24} />
                      <span className="text-[8px] font-bold uppercase mt-1">Add Foto</span>
                    </div>
                    <input 
                      type="file" 
                      name="photos" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          try {
                            const newUrls = await Promise.all(Array.from(files).map(file => fileToBase64(file)));
                            const currentUrls = editingAnimal?.photoUrls || (editingAnimal?.photoUrl ? [editingAnimal.photoUrl] : []);
                            setEditingAnimal({
                              ...(editingAnimal || {} as Animal),
                              photoUrls: [...currentUrls, ...newUrls],
                              photoUrl: currentUrls[0] || newUrls[0]
                            });
                          } catch (err) {
                            console.error('Error previewing photos:', err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <Input label="ID (Brinco)" name="id" defaultValue={editingAnimal?.id} required />
              <Input label="Nome (Opcional)" name="name" defaultValue={editingAnimal?.name} />
              <div className="grid grid-cols-2 gap-6">
                <Input label="Raça" name="breed" defaultValue={editingAnimal?.breed} required />
                <Input label="Peso Inicial (kg)" name="weight" type="number" defaultValue={editingAnimal?.weight} required />
              </div>
              <Input label="Data de Nascimento" name="birthDate" type="date" defaultValue={editingAnimal?.birthDate} required />
              <div className="grid grid-cols-2 gap-6">
                <Select label="Gênero" name="gender" defaultValue={editingAnimal?.gender} options={[
                  { label: 'Macho', value: 'macho' },
                  { label: 'Fêmea', value: 'fêmea' }
                ]} />
                <Select label="Lote" name="lotId" defaultValue={editingAnimal?.lotId} options={[
                  { label: 'Sem Lote', value: '' },
                  ...lots.map(l => ({ label: l.name, value: l.docId }))
                ]} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Input label="Brinco/Nome da Mãe" name="motherId" defaultValue={editingAnimal?.motherId} placeholder="Opcional" />
                <Input label="Brinco/Nome do Pai" name="fatherId" defaultValue={editingAnimal?.fatherId} placeholder="Opcional" />
              </div>
              <Textarea 
                label="Observações (Identificação)" 
                name="observations" 
                defaultValue={editingAnimal?.observations} 
                placeholder="Ex: Mancha preta no olho esquerdo, temperamento dócil..." 
              />
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => { setShowAddAnimal(false); setEditingAnimal(null); }}>Cancelar</Button>
                <Button type="submit" className="flex-1">Salvar</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showAddRecord && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
        >
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 card-shadow border border-stone-100 my-auto"
          >
            <div className="w-12 h-1.5 bg-stone-100 rounded-full mx-auto mb-8 sm:hidden"></div>
            <h2 className="text-3xl font-serif font-bold text-ink mb-10">Novo Registro</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              saveRecord({
                animalId: showAddRecord,
                type: formData.get('type') as any,
                date: formData.get('date') as string,
                value: formData.get('value') as string,
                notes: formData.get('notes') as string,
              });
            }} className="flex flex-col gap-6">
              <Select 
                label="Tipo de Evento" 
                name="type" 
                value={recordType}
                onChange={setRecordType}
                options={[
                { label: 'Pesagem', value: 'pesagem' },
                { label: 'Vacina', value: 'vacina' },
                { label: 'Tratamento', value: 'tratamento' },
                { label: 'Reprodução', value: 'reprodução' },
                { label: 'Parto', value: 'parto' },
                { label: 'Mortalidade', value: 'mortalidade' },
                { label: 'Venda', value: 'venda' }
              ]} />
              <Input label="Data" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
              <Input 
                label={
                  recordType === 'mortalidade' ? 'Causa da Morte (Opcional)' :
                  recordType === 'venda' ? 'Valor da Venda (R$)' :
                  recordType === 'pesagem' ? 'Peso (kg)' :
                  recordType === 'vacina' ? 'Nome da Vacina' :
                  recordType === 'parto' ? 'Detalhes do Parto' :
                  'Valor / Descrição'
                } 
                name="value" 
                placeholder={
                  recordType === 'mortalidade' ? 'Ex: Picada de cobra, Doença...' :
                  recordType === 'venda' ? 'Ex: 2500,00' :
                  recordType === 'pesagem' ? 'Ex: 250' :
                  recordType === 'vacina' ? 'Ex: Febre Aftosa' :
                  'Ex: Descrição do evento'
                } 
                required={recordType !== 'mortalidade'} 
              />
              <Input label="Observações" name="notes" />
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAddRecord(null)}>Cancelar</Button>
                <Button type="submit" className="flex-1">Salvar</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showAddPost && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
        >
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
            className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 card-shadow border border-stone-100 my-auto"
          >
            <h2 className="text-3xl font-serif font-bold text-ink mb-10">Nova Postagem</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (!user) return;

              const photoFile = (e.currentTarget.elements.namedItem('photo') as HTMLInputElement).files?.[0];
              let imageUrl = '';

              if (photoFile && photoFile.size > 0) {
                try {
                  imageUrl = await fileToBase64(photoFile);
                } catch (err) {
                  console.error('Error converting photo:', err);
                }
              }

              await addDoc(collection(db, 'posts'), cleanFirestoreData({
                uid: user.uid,
                authorName: user.displayName || 'Produtor',
                authorPhoto: user.photoURL || '',
                content: formData.get('content') as string,
                imageUrl: imageUrl || (formData.get('imageUrl') as string) || null,
                likes: [],
                commentsCount: 0,
                createdAt: new Date().toISOString(),
              }));
              setShowAddPost(false);
              setPostPhotoPreview(null);
            }} className="flex flex-col gap-6">
              <div className="flex justify-center mb-4">
                <label className="relative cursor-pointer group w-full">
                  <div className="w-full h-48 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 group-hover:border-brand-primary group-hover:text-brand-primary transition-all overflow-hidden relative">
                    {postPhotoPreview ? (
                      <img src={postPhotoPreview} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} />
                        <span className="text-[10px] font-bold uppercase mt-1">Adicionar Foto</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    name="photo" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const base64 = await fileToBase64(file);
                          setPostPhotoPreview(base64);
                        } catch (err) {
                          console.error('Error previewing post photo:', err);
                        }
                      }
                    }}
                  />
                </label>
              </div>
              <Input label="O que está acontecendo no campo?" name="content" required />
              <Input label="Ou link da Imagem" name="imageUrl" />
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => { setShowAddPost(false); setPostPhotoPreview(null); }}>Cancelar</Button>
                <Button type="submit" className="flex-1">Postar</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showAddFeeding && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
        >
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
            className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 card-shadow border border-stone-100 my-auto"
          >
            <h2 className="text-3xl font-serif font-bold text-ink mb-10">Registrar Trato</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (!user) return;
              await addDoc(collection(db, 'feeding'), cleanFirestoreData({
                ownerUid: user.uid,
                type: formData.get('type') as string,
                description: formData.get('description') as string,
                amount: Number(formData.get('amount')),
                date: formData.get('date') as string,
              }));
              setShowAddFeeding(false);
            }} className="flex flex-col gap-6">
              <Select label="Tipo de Alimento" name="type" options={[
                { label: 'Volumoso', value: 'volumoso' },
                { label: 'Concentrado', value: 'concentrado' },
                { label: 'Suplemento', value: 'suplemento' }
              ]} />
              <Input label="Descrição" name="description" placeholder="Ex: Milho moído" required />
              <Input label="Quantidade (kg)" name="amount" type="number" required />
              <Input label="Data" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAddFeeding(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1">Salvar</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showAddQuestion && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
        >
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
            className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 card-shadow border border-stone-100 my-auto"
          >
            <h2 className="text-3xl font-serif font-bold text-ink mb-10">Nova Dúvida</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (!user) return;
              await addDoc(collection(db, 'forum_questions'), cleanFirestoreData({
                uid: user.uid,
                authorName: user.displayName || 'Produtor',
                authorPhoto: user.photoURL || '',
                title: formData.get('title') as string,
                content: formData.get('content') as string,
                resolved: false,
                createdAt: new Date().toISOString(),
              }));
              setShowAddQuestion(false);
            }} className="flex flex-col gap-6">
              <Input label="Título da Dúvida" name="title" required />
              <Input label="Explique sua dúvida" name="content" required />
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAddQuestion(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1">Enviar</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showAddHealthAlert && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
        >
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
            className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 card-shadow border border-stone-100 my-auto"
          >
            <h2 className="text-3xl font-serif font-bold text-ink mb-10">Nova Vacina/Manejo</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (!user) return;
              
              const animalId = formData.get('animalId') as string;
              const lotId = formData.get('lotId') as string;
              
              await addDoc(collection(db, 'health_alerts'), cleanFirestoreData({
                type: formData.get('type') as string,
                title: formData.get('title') as string,
                date: formData.get('date') as string,
                completed: false,
                ownerUid: user.uid,
                ...(animalId && animalId !== 'todos' ? { animalId } : {}),
                ...(lotId && lotId !== 'todos' ? { lotId } : {})
              }));
              setShowAddHealthAlert(false);
            }} className="flex flex-col gap-6">
              <Select label="Tipo" name="type" options={[
                { value: 'vacina', label: 'Vacina' },
                { value: 'verminose', label: 'Vermífugo' },
                { value: 'manejo', label: 'Manejo Geral' }
              ]} required />
              <Input label="Título/Nome" name="title" placeholder="Ex: Vacina Clostridiose" required />
              <Input label="Data Programada" name="date" type="date" required />
              <Select label="Aplicar em Lote" name="lotId" options={[
                { value: 'todos', label: 'Todos os Lotes' },
                ...lots.map(l => ({ value: l.docId!, label: l.name }))
              ]} />
              <Select label="Ou Animal Específico" name="animalId" options={[
                { value: 'todos', label: 'Nenhum específico' },
                ...animals.map(a => ({ value: a.docId!, label: `${a.id} - ${a.name || a.breed}` }))
              ]} />
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAddHealthAlert(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1">Salvar</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showAddLot && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
        >
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 card-shadow border border-stone-100 my-auto"
          >
            <div className="w-12 h-1.5 bg-stone-100 rounded-full mx-auto mb-8 sm:hidden"></div>
            <h2 className="text-3xl font-serif font-bold text-ink mb-10">Novo Lote / Pasto</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              saveLot({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
              });
            }} className="flex flex-col gap-6">
              <Input label="Nome do Lote" name="name" required />
              <Input label="Descrição" name="description" placeholder="Ex: Pasto de Inverno" />
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAddLot(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1">Salvar</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      {showPhotoLightbox && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-10"
          onClick={() => setShowPhotoLightbox(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-5xl w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowPhotoLightbox(null)}
              className="absolute -top-12 right-0 sm:-right-12 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={24} />
            </button>
            <img 
              src={showPhotoLightbox} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
              referrerPolicy="no-referrer" 
            />
          </motion.div>
        </motion.div>
      )}

      {deleteConfirm && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-sm rounded-[2rem] p-8 card-shadow border border-stone-100"
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-ink text-center mb-2">{deleteConfirm.title}</h2>
            <p className="text-ink-muted text-center mb-8">{deleteConfirm.message}</p>
            <div className="flex gap-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button 
                className="flex-1 !bg-red-500 hover:!bg-red-600 !text-white" 
                onClick={() => {
                  deleteConfirm.onConfirm();
                  setDeleteConfirm(null);
                }}
              >
                Excluir
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
