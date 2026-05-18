"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardAdmin() {
  // ================= STATE DATA =================
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]); // Master Kategori Folder
  const [submissions, setSubmissions] = useState([]); // Master Tautan Bahan Ajar
  
  const [newTask, setNewTask] = useState("");
  
  // State untuk Fitur Upload Admin
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState({ jenis_bahan_ajar: '', materi: '', link_drive: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState('kategori'); // kategori | unggah
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') return router.push('/');
    setCurrentUser(user);

    const unsubTasks = onSnapshot(collection(db, "master_tugas"), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSubs = onSnapshot(collection(db, "tugas_mahasiswa"), (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubTasks(); unsubSubs(); };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  // ================= FITUR MANAJEMEN FOLDER =================
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await addDoc(collection(db, "master_tugas"), { nama_tugas: newTask.trim(), timestamp: Date.now() });
    setNewTask("");
  };

  const handleDeleteTask = async (id) => {
    if(confirm("Yakin hapus kategori folder ini? Data di dalamnya akan ikut terdampak.")) {
      await deleteDoc(doc(db, "master_tugas", id));
    }
  };

  // ================= FITUR UNGGAH MATERI =================
  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setForm({ jenis_bahan_ajar: '', materi: '', link_drive: '' });
    setModalOpen(true);
  };

  const handleSubmitLink = async (e) => {
    e.preventDefault();
    if (!form.jenis_bahan_ajar || !form.materi.trim() || !form.link_drive.trim()) return;
    setLoading(true);
    
    try {
      await addDoc(collection(db, "tugas_mahasiswa"), {
        author: `Admin Vidyaloka`, // Di-set otomatis sebagai Admin
        id_tugas: selectedTask.id,
        nama_tugas: selectedTask.nama_tugas,
        jenis_bahan_ajar: form.jenis_bahan_ajar,
        materi: form.materi.trim(),
        link_drive: form.link_drive.trim(),
        status: "Disetujui", // Status otomatis disetujui agar langsung muncul di publik
        timestamp: Date.now()
      });
      setModalOpen(false);
    } catch (error) {
      alert("Gagal menyimpan tautan berkas.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (id) => {
    if (confirm("Hapus tautan materi ini secara permanen?")) {
      await deleteDoc(doc(db, "tugas_mahasiswa", id));
    }
  };

  const filteredTasksForUpload = tasks.filter(task => 
    task.nama_tugas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Disetujui': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Perlu Revisi': return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // Navigasi Dasbor Admin
  const navItems = [
    { id: 'kategori', label: 'Manajemen Folder', icon: 'fa-solid fa-folder-tree' },
    { id: 'unggah', label: 'Kelola Bahan Ajar', icon: 'fa-solid fa-cloud-arrow-up' },
  ];

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#f4f7fb] font-sans antialiased text-slate-800 flex flex-col md:flex-row selection:bg-[#fcd116] selection:text-[#1e3366]">
      
      {/* ========================================== */}
      {/* SIDEBAR NAVIGATION (Desktop/Tablet)        */}
      {/* ========================================== */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 bg-[#1e3366] text-white shadow-2xl">
        <div className="h-20 flex items-center px-6 border-b border-white/10 gap-3 bg-[#172852]">
          <div className="bg-white/10 p-2.5 rounded-xl text-[#fcd116] shadow-inner">
            <i className="fa-solid fa-shield-halved text-xl"></i>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-sm font-black tracking-tight text-white leading-none">Vidyaloka Hub</h1>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">Panel Administrator</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-[#fcd116] to-amber-400 text-[#1e3366] shadow-lg shadow-[#fcd116]/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <i className={`${item.icon} text-lg w-5 text-center`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-5 border-t border-white/10 bg-[#172852]">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-xl transition-all border border-transparent hover:border-rose-500/30"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-sm"></i>
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* BOTTOM NAVIGATION BAR (Mobile Android/iOS) */}
      {/* ========================================== */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around items-center h-16 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] px-2 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-300 ${
              activeTab === item.id 
                ? 'text-[#1e3366] font-black -translate-y-1' 
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <i className={`${item.icon} text-xl mb-1 transition-transform ${activeTab === item.id ? 'scale-110 drop-shadow-md' : ''}`}></i>
            <span className={`text-[10px] tracking-tight ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================== */}
      {/* MAIN CONTENT AREA                          */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col md:pl-64 pb-20 md:pb-0">
        
        {/* Top Navbar Header */}
        <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-30 shadow-sm">
          <div className="flex h-14 sm:h-20 px-4 sm:px-6 lg:px-8 justify-between items-center">
            
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1e3366] to-[#32529f] rounded-lg flex items-center justify-center text-[#fcd116]">
                <i className="fa-solid fa-shield-halved text-sm"></i>
              </div>
              <span className="font-black text-slate-800 tracking-tight text-sm">Panel Admin</span>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#32529f]">
                <i className={`${navItems.find(i => i.id === activeTab)?.icon} text-sm`}></i>
              </div>
              <h2 className="text-sm font-bold text-slate-500 capitalize">
                Navigasi / <span className="text-[#1e3366] font-black">{activeTab}</span>
              </h2>
            </div>

            <button 
              onClick={handleLogout} 
              className="md:hidden w-8 h-8 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center hover:bg-rose-100 transition-colors"
              title="Keluar"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8">
          
          {/* ========================================== */}
          {/* TAB 1: KATEGORI BAHAN AJAR (DIUBAH KE GRID)*/}
          {/* ========================================== */}
          {activeTab === 'kategori' && (
            <div className="space-y-5 sm:space-y-6 animate-[fadeIn_0.3s_ease-out]">
              
              <div className="bg-gradient-to-br from-[#1e3366] to-[#32529f] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-md border-b-4 border-[#fcd116] relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-white/10 text-[#fcd116] px-2.5 py-1 rounded-full border border-white/10">Sesi Admin Aktif</span>
                    <h2 className="text-xl sm:text-2xl font-black mt-3 tracking-tight">Halo, Administrator!</h2>
                    <p className="text-xs text-blue-200 mt-1 font-medium max-w-lg">Kelola direktori folder utama yang akan ditampilkan di portal publik untuk diakses oleh guru.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Total Direktori</p>
                      <h3 className="text-2xl font-black text-[#fcd116] mt-0.5">{tasks.length}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/40 p-5 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#32529f] flex items-center justify-center">
                    <i className="fa-solid fa-folder-plus"></i>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">Buat Direktori Folder Baru</h2>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-5 sm:mb-6 pl-11">Tentukan nama folder utama sebagai wadah pengelompokan materi (misal: Modul Ajar KBC, LKPD, Presentasi).</p>
                
                <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" required 
                    value={newTask} 
                    onChange={(e) => setNewTask(e.target.value)} 
                    placeholder="Ketik nama kategori folder..." 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-3.5 text-xs sm:text-sm focus:ring-2 focus:ring-[#32529f] outline-none transition-all shadow-inner" 
                  />
                  <button 
                    type="submit" 
                    className="bg-[#32529f] hover:bg-[#1e3366] text-white px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <i className="fa-solid fa-plus"></i> Tambah Folder
                  </button>
                </form>
              </div>

              {/* TAMPILAN KOTAK-KOTAK (GRID) BARU */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-4 sm:p-6 md:p-8">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-hard-drive text-slate-400"></i> Struktur Direktori
                </h3>

                {tasks.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-400 font-medium">Belum ada folder yang dibuat.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                    {tasks.map(t => {
                      const count = submissions.filter(s => s.id_tugas === t.id).length;
                      return (
                        <div 
                          key={t.id} 
                          className="group relative flex flex-col items-center justify-start text-center p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          {/* Tombol Hapus Tersembunyi (Muncul saat Hover) */}
                          <button 
                            onClick={() => handleDeleteTask(t.id)} 
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10"
                            title="Hapus Folder"
                          >
                            <i className="fa-regular fa-trash-can text-xs"></i>
                          </button>

                          {/* Ikon Folder */}
                          <div className="relative mb-3 transform group-hover:-translate-y-1 transition-transform duration-300">
                            <i className="fa-solid fa-folder text-[60px] sm:text-[70px] text-amber-400 group-hover:text-amber-500 drop-shadow-sm transition-colors"></i>
                            
                            {/* Badge Jumlah File di Sudut Folder */}
                            <div className="absolute -bottom-1 -right-1 bg-[#1e3366] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white">
                              {count}
                            </div>
                          </div>

                          {/* Nama Folder */}
                          <h4 className="font-bold text-xs sm:text-sm text-slate-700 group-hover:text-[#1e3366] line-clamp-3 leading-snug">
                            {t.nama_tugas}
                          </h4>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: UNGGAH MATERI ADMIN                 */}
          {/* ========================================== */}
          {activeTab === 'unggah' && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Kelola Bahan Ajar</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Unggah dan atur materi referensi Anda ke dalam folder yang sesuai.</p>
                </div>
                
                <div className="relative w-full sm:w-64">
                  <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input 
                    type="text" placeholder="Cari kategori..." 
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-[#32529f] outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredTasksForUpload.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-sm text-slate-400">
                    <i className="fa-regular fa-folder-open text-3xl mb-2 block text-slate-300"></i>
                    Kategori tidak ditemukan. Buat folder baru terlebih dahulu.
                  </div>
                ) : (
                  filteredTasksForUpload.map(task => {
                    const linksInThisTask = submissions.filter(s => s.id_tugas === task.id);
                    const isCompleted = linksInThisTask.length > 0;

                    return (
                      <div key={task.id} className={`bg-white rounded-2xl border transition-all shadow-sm ${isCompleted ? 'border-l-4 border-l-[#32529f]' : 'border-l-4 border-l-slate-300'}`}>
                        
                        <div className="p-4 sm:p-5 flex justify-between items-center border-b border-slate-50 bg-slate-50/20 rounded-t-2xl gap-2">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-blue-50 text-[#32529f]' : 'bg-slate-100 text-slate-400'}`}>
                              <i className={`fa-solid ${isCompleted ? 'fa-folder-check' : 'fa-folder'} text-sm`}></i>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <h3 className="font-bold text-sm text-slate-800 truncate">{task.nama_tugas}</h3>
                                <span className="text-[10px] text-slate-500">{linksInThisTask.length} Tautan Berkas</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleOpenModal(task)} 
                            className="bg-[#fcd116] text-[#1e3366] hover:bg-amber-400 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 shadow-sm"
                          >
                            <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">Unggah Materi</span>
                          </button>
                        </div>

                        <div className="p-4 sm:p-5">
                          {linksInThisTask.length === 0 ? (
                            <div className="text-xs text-slate-400 font-medium bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 flex items-center gap-2">
                              <i className="fa-solid fa-info-circle text-xs"></i>
                              <span>Folder ini belum memiliki materi. Silakan unggah bahan ajar Anda.</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {linksInThisTask.map(link => (
                                <div key={link.id} className="border border-slate-200/80 rounded-xl p-3 bg-white hover:border-[#32529f]/40 shadow-sm flex flex-col sm:flex-row justify-between sm:items-start group transition gap-3">
                                  
                                  <div className="overflow-hidden flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="bg-blue-100 text-[#32529f] px-2 py-0.5 rounded border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                                        {link.jenis_bahan_ajar}
                                      </span>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getStatusStyle(link.status)}`}>
                                        {link.status === "Disetujui" ? "✔ Tersedia Publik" : link.status}
                                      </span>
                                    </div>
                                    
                                    <p className="font-bold text-xs sm:text-sm text-slate-700 truncate" title={link.materi}>{link.materi}</p>
                                    
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold">
                                        {link.author?.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-[10px] text-slate-500 mr-2 truncate max-w-[100px]">{link.author}</span>

                                      <a href={link.link_drive} target="_blank" rel="noreferrer" className="text-[10px] sm:text-[11px] text-[#32529f] font-bold hover:underline bg-blue-50/50 border border-blue-100 px-2 py-1 rounded flex items-center gap-1.5 truncate transition">
                                        <i className="fa-solid fa-arrow-up-right-from-square"></i> Buka Tautan
                                      </a>
                                    </div>
                                  </div>

                                  <button onClick={() => handleDeleteLink(link.id)} className="text-slate-400 hover:text-rose-500 p-2 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-100 transition self-end sm:self-auto shrink-0" title="Hapus Tautan">
                                    <i className="fa-regular fa-trash-can text-xs"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL TAMBAH TAUTAN ADMIN                  */}
      {/* ========================================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-[fadeIn_0.2s_ease-in-out]">
          <form onSubmit={handleSubmitLink} className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div>
                <h3 className="font-black text-lg text-slate-900">Sematkan Bahan Ajar</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Kategori Target: <span className="font-bold text-slate-700">{selectedTask?.nama_tugas}</span></p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition">
                <i className="fa-solid fa-times text-sm"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jenis Bahan Ajar</label>
                <select 
                  required 
                  value={form.jenis_bahan_ajar} 
                  onChange={e => setForm({...form, jenis_bahan_ajar: e.target.value})} 
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#32529f] outline-none bg-white cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Jenis --</option>
                  <option value="Modul Ajar / RPM">Modul Ajar / RPM KBC</option>
                  <option value="PPT / Presentasi">PPT / Presentasi</option>
                  <option value="LKPD / Penugasan">LKPD / Penugasan</option>
                  <option value="Video Pembelajaran">Video Pembelajaran</option>
                  <option value="Materi Tambahan">Materi Tambahan</option>
                  <option value="Lainnya">Dokumen Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Judul Materi / Topik</label>
                <input 
                  type="text" required 
                  value={form.materi} 
                  onChange={e => setForm({...form, materi: e.target.value})} 
                  placeholder="Contoh: Bab 1 - Ekosistem" 
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#32529f] outline-none" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">URL Tautan Google Drive / Canva</label>
                <input 
                  type="url" required 
                  value={form.link_drive} 
                  onChange={e => setForm({...form, link_drive: e.target.value})} 
                  placeholder="https://drive.google.com/..." 
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-[#32529f] outline-none" 
                />
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-3 flex gap-2">
                  <i className="fa-solid fa-circle-info text-blue-500 text-xs mt-0.5 shrink-0"></i>
                  <p className="text-[10px] text-blue-800 leading-normal font-medium">
                    Pastikan akses tautan telah diset ke <span className="font-bold">"Siapa saja yang memiliki tautan"</span> agar dapat dilihat oleh publik/guru di halaman utama.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-100 flex gap-3 bg-white">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition">
                Batal
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#32529f] hover:bg-[#1e3366] text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2">
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                <span>{loading ? 'Menyimpan...' : 'Unggah Materi'}</span>
              </button>
            </div>
            
          </form>
        </div>
      )}

    </div>
  );
}