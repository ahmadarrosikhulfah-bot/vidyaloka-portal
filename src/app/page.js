"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function HomePublicAndLogin() {
  // ================= STATE DATA MATERI =================
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State untuk melacak folder yang sedang dibuka
  const [activeFolder, setActiveFolder] = useState(null); 

  // ================= STATE LOGIN MODAL =================
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginKode, setLoginKode] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [isClient, setIsClient] = useState(false); // <-- ANTI BLANK SCREEN (SSR Safe)
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    // Redirect otomatis jika sudah login (dengan Try-Catch agar tidak crash)
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const loggedUser = JSON.parse(userStr);
        if (loggedUser.role === 'admin') {
            router.push('/dashboard');
            return;
        }
        if (loggedUser.role === 'mahasiswa') {
            router.push('/portal');
            return;
        }
      }
    } catch (e) {
      console.warn("Sesi tidak valid, mengabaikan login otomatis.");
    }

    // Ambil data publik dari Firestore
    const unsubTasks = onSnapshot(collection(db, "master_tugas"), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSubs = onSnapshot(collection(db, "tugas_mahasiswa"), (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubTasks(); unsubSubs(); };
  }, [router]);

  // Jika user mengetik di kotak pencarian, otomatis kembali ke tampilan Grid Folder Utama
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      setActiveFolder(null);
    }
  }, [searchQuery]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginKode.trim()) return;
    
    setLoginLoading(true);
    setLoginError('');

    try {
      const q = query(collection(db, "users"), where("kode_akses", "==", loginKode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoginError('Kunci akses tidak ditemukan!');
        setLoginLoading(false);
        return;
      }

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        localStorage.setItem('user', JSON.stringify({ id: doc.id, ...userData }));
        
        if (userData.role === 'admin') {
          router.push('/dashboard');
        } else if (userData.role === 'mahasiswa') {
          router.push('/portal');
        } else {
          setShowLoginModal(false);
          setLoginLoading(false);
        }
      });
    } catch (err) {
      setLoginError('Terjadi kesalahan koneksi jaringan.');
      setLoginLoading(false);
    }
  };

  // Filter Anti-Crash (menggunakan || "" untuk mencegah error TypeError toLowerCase)
  const filteredTasks = tasks.filter(task => 
    (task.nama_tugas || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Disetujui': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Perlu Revisi': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // ================= LAYAR LOADING ANTI BLANK =================
  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7fb]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1e3366] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold text-sm animate-pulse">Menyiapkan Portal Vidyaloka...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] font-sans antialiased text-slate-800 selection:bg-[#fcd116] selection:text-[#1e3366]">
      
      {/* ========================================== */}
      {/* MODERN GLASSMORPHISM NAVBAR                */}
      {/* ========================================== */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-20 items-center justify-between">
            
            {/* Logo Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => {setActiveFolder(null); setSearchQuery('');}}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#1e3366] to-[#32529f] rounded-lg sm:rounded-xl flex items-center justify-center text-[#fcd116] shadow-md shadow-blue-900/20">
                <i className="fa-solid fa-graduation-cap text-sm sm:text-lg"></i>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="font-black text-slate-800 tracking-tight text-sm sm:text-lg leading-none">Vidyaloka</h1>
                <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 sm:mt-1 hidden sm:block">AM FITK UINMA x MAN 1 PASURUAN</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 sm:hidden">AM FITK UINMA x MAN 1 PASURUAN</p>
              </div>
            </div>

            {/* Tombol Login */}
            <button 
              onClick={() => setShowLoginModal(true)}
              className="group bg-white border border-slate-200 hover:border-[#32529f] text-[#32529f] hover:bg-blue-50 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md"
            >
              <i className="fa-solid fa-lock group-hover:scale-110 transition-transform"></i>
              <span className="hidden sm:inline">Login</span>
              <span className="sm:hidden">Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* ANIMATED HERO SECTION                      */}
      {/* ========================================== */}
      <header className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#1e3366]">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-64 h-64 sm:w-96 sm:h-96 bg-[#32529f] rounded-full mix-blend-screen filter blur-[80px] sm:blur-[100px] opacity-70 animate-[pulse_6s_ease-in-out_infinite]"></div>
          <div className="absolute top-10 -left-10 sm:top-20 sm:-left-20 w-48 h-48 sm:w-72 sm:h-72 bg-[#154c33] rounded-full mix-blend-screen filter blur-[60px] sm:blur-[80px] opacity-60 animate-[pulse_8s_ease-in-out_infinite_reverse]"></div>
          <div className="absolute -bottom-20 left-1/4 sm:-bottom-40 sm:left-1/2 w-56 h-56 sm:w-80 sm:h-80 bg-[#fcd116] rounded-full mix-blend-screen filter blur-[90px] sm:blur-[120px] opacity-30 animate-[pulse_5s_ease-in-out_infinite]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-[fadeIn_0.5s_ease-out]">
          <span className="inline-block py-1 px-2.5 sm:px-3 rounded-full bg-white/10 border border-white/20 text-blue-200 text-[9px] sm:text-xs font-bold tracking-widest uppercase mb-4 sm:mb-6 backdrop-blur-sm">
            <i className="fa-solid fa-globe mr-1 sm:mr-1.5"></i> Portal Akses Publik
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 sm:mb-6 leading-tight">
            Bahan Ajar Siap Pakai <br className="hidden sm:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fcd116] to-amber-300">
              Diseminasi AM Vidyaloka
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-blue-100 font-medium mb-6 sm:mb-10 leading-relaxed px-2 sm:px-0">
            Temukan, akses, dan manfaatkan perangkat ajar interaktif, presentasi, dan modul yang telah dirancang khusus untuk kemajuan pendidikan.
          </p>

          {/* Kotak Pencarian */}
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl blur group-hover:bg-white/30 transition duration-300 pointer-events-none"></div>
            <div className="relative flex items-center bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-2xl">
              <div className="pl-3 pr-2 sm:pl-4 sm:pr-3 text-slate-400">
                <i className="fa-solid fa-search text-base sm:text-lg"></i>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari materi..." 
                className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 font-medium py-2 sm:py-3 focus:outline-none focus:ring-0 text-xs sm:text-sm md:text-base"
              />
              <div className="hidden sm:block px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider">
                {submissions.length} Tautan
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* MAIN CONTENT: FILE EXPLORER STYLE          */}
      {/* ========================================== */}
      <main className="relative z-20 -mt-6 sm:-mt-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        
        {activeFolder ? (
          /* ================= INSIDE FOLDER VIEW (DRILL-DOWN) ================= */
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-4 sm:p-6 md:p-8 animate-[fadeIn_0.3s_ease-out]">
            
            {(() => {
              const task = tasks.find(t => t.id === activeFolder);
              const linksInThisTask = submissions.filter(s => s.id_tugas === activeFolder);
              
              return (
                <>
                  {/* Header Folder Aktif */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8 border-b border-slate-100 pb-4 sm:pb-5">
                    <div>
                      <button 
                        onClick={() => setActiveFolder(null)} 
                        className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-[#32529f] transition-colors mb-2 sm:mb-3 flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-arrow-left"></i> Kembali ke Kategori
                      </button>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <i className="fa-solid fa-folder-open text-3xl sm:text-4xl text-[#4a72c9]"></i>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 leading-tight">{task?.nama_tugas || "Folder Tanpa Nama"}</h2>
                      </div>
                    </div>
                    <div className="bg-blue-50 text-[#32529f] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border border-blue-100 flex items-center gap-1.5 sm:gap-2 w-fit">
                      <i className="fa-solid fa-file-lines"></i> {linksInThisTask.length} Dokumen
                    </div>
                  </div>

                  {/* Isi File dalam Folder */}
                  {linksInThisTask.length === 0 ? (
                    <div className="text-center py-10 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-slate-300 text-2xl sm:text-3xl">
                        <i className="fa-regular fa-folder-open"></i>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-700">Folder Masih Kosong</h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">Belum ada karya yang diunggah ke kategori ini.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                      {linksInThisTask.map(link => (
                        <div key={link.id} className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:border-[#32529f]/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full gap-3 sm:gap-4 relative group">
                          
                          {/* Garis Aksen */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1e3366] to-[#32529f] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl sm:rounded-t-2xl"></div>
                          
                          <div className="overflow-hidden">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                              <span className="bg-blue-50 text-[#32529f] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-blue-100 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                                <i className="fa-solid fa-tag mr-1 opacity-60"></i> {link.jenis_bahan_ajar || "Dokumen"}
                              </span>
                              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border ${getStatusStyle(link.status)}`}>
                                {link.status === "Disetujui" ? "✔ Tersedia Publik" : (link.status || 'Belum Diperiksa')}
                              </span>
                            </div>
                            
                            <h4 className="font-bold text-sm sm:text-base text-slate-800 leading-snug mb-2 line-clamp-2" title={link.materi || link.nama_file}>
                              {link.materi || link.nama_file}
                            </h4>
                            
                            <div className="flex items-center gap-2 mt-3 sm:mt-4">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-[9px] sm:text-[10px] font-black shrink-0">
                                {link.author?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Disusun Oleh</span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">{link.author || "Anonim"}</span>
                              </div>
                            </div>
                          </div>
                          
                          <a 
                            href={link.link_drive} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="mt-2 sm:mt-3 w-full text-[11px] sm:text-xs bg-slate-50 hover:bg-[#32529f] text-[#32529f] hover:text-white border border-slate-200 hover:border-[#32529f] font-bold px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 shadow-sm"
                          >
                            <span>Buka Dokumen</span>
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
          
        ) : (
          /* ================= ROOT GRID DIRECTORY VIEW ================= */
          <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-5 sm:mb-8 pb-3 sm:pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2">
                  <i className="fa-solid fa-hard-drive text-slate-400"></i> Direktori Bank Materi
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Pilih folder untuk melihat dan mengunduh berkas.</p>
              </div>
            </div>
            
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-slate-300 text-2xl sm:text-3xl">
                  <i className="fa-regular fa-folder-open"></i>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-700">Folder Tidak Ditemukan</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {filteredTasks.map(task => {
                  const count = submissions.filter(s => s.id_tugas === task.id).length;
                  
                  return (
                    <button 
                      key={task.id} 
                      onClick={() => setActiveFolder(task.id)}
                      className="group flex flex-col items-center justify-start text-center p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all duration-300 active:scale-95 cursor-pointer"
                    >
                      {/* Ikon Folder */}
                      <div className="relative mb-2 sm:mb-3 transform group-hover:-translate-y-1 transition-transform duration-300">
                        <i className="fa-solid fa-folder text-[55px] sm:text-[70px] lg:text-[80px] text-[#93addc] group-hover:text-[#4a72c9] drop-shadow-sm transition-colors"></i>
                        
                        {/* Badge Notifikasi */}
                        {count > 0 && (
                          <div className="absolute -bottom-1 -right-1 bg-[#1e3366] text-white text-[9px] sm:text-[10px] md:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full shadow-sm border-2 border-white">
                            {count}
                          </div>
                        )}
                      </div>
                      
                      {/* Nama Folder */}
                      <h4 className="font-bold text-[11px] sm:text-xs md:text-sm text-slate-700 group-hover:text-[#1e3366] line-clamp-3 leading-snug">
                        {task.nama_tugas || "Tanpa Nama"}
                      </h4>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* MODAL LOGIN POPUP UNTUK ADMIN/MAHASISWA      */}
      {/* ========================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[320px] sm:max-w-sm overflow-hidden flex flex-col relative transform transition-all animate-[slideUp_0.3s_ease-out]">
            
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors z-10"
            >
              <i className="fa-solid fa-times text-xs sm:text-sm"></i>
            </button>
            
            <div className="p-6 sm:p-8 pb-5 sm:pb-6 flex flex-col items-center bg-slate-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-100 rounded-full filter blur-2xl sm:blur-3xl opacity-50 translate-x-8 -translate-y-8 sm:translate-x-10 sm:-translate-y-10"></div>
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#1e3366] to-[#32529f] rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg shadow-blue-900/30 mb-4 sm:mb-5 relative z-10 rotate-3 hover:rotate-0 transition-transform duration-300">
                <i className="fa-solid fa-shield-halved -rotate-3"></i>
              </div>
              <h2 className="font-black text-xl sm:text-2xl text-slate-800 tracking-tight relative z-10">Ruang Internal</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2 text-center relative z-10 leading-relaxed">Otentikasi khusus akses Admin Vidyaloka.</p>
            </div>

            <form onSubmit={handleLogin} className="p-5 sm:p-6 pt-3 sm:pt-4 space-y-4 sm:space-y-5 bg-white">
              <div>
                <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 text-center">Kode Kredensial</label>
                <input 
                  type="text" required
                  value={loginKode}
                  onChange={(e) => setLoginKode(e.target.value)}
                  placeholder="Ketik kode di sini..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3.5 text-xs sm:text-sm font-mono font-bold text-center uppercase tracking-widest focus:ring-2 focus:ring-[#32529f] focus:border-transparent outline-none transition-all shadow-inner"
                />
              </div>

              {loginError && (
                <div className="bg-rose-50 text-rose-600 text-[10px] sm:text-xs font-bold text-center py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-rose-100 animate-[fadeIn_0.2s_ease]">
                  <i className="fa-solid fa-circle-exclamation mr-1"></i> {loginError}
                </div>
              )}

              <button 
                type="submit" disabled={loginLoading}
                className="w-full bg-gradient-to-r from-[#1e3366] to-[#32529f] hover:from-[#15244a] hover:to-[#1e3366] text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group"
              >
                {loginLoading ? (
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-right-to-bracket group-hover:translate-x-1 transition-transform"></i>
                )}
                <span>{loginLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}