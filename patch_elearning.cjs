const fs = require('fs');

let code = fs.readFileSync('resources/js/components/pages/Elearning/ElearningPage.jsx', 'utf8');

// Find where `return (` starts for the workspace
const startMarker = `  return (
    <AppLayout title={selectedCourse?.title || 'E-Learning'}>
      <div className="max-w-7xl mx-auto pb-16">
        <button`;

const indexStart = code.indexOf(startMarker);
if (indexStart === -1) {
  console.log('Start marker not found');
  process.exit(1);
}

// We want to replace from indexStart to the end of the main `div` containing the Video Preview Modal.
// Actually, it's easier to replace everything from startMarker to the end of the file, then re-append the modals.

const headerTop = `  // ===== WORKSPACE VIEW =====
  const currentTab = view === 'catatan' ? 'catatan' : 'modul';

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
`;

const layoutTop = `
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">
      {/* ── TOP NAV ── */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20 relative shadow-sm">
        <button
          onClick={() => { setView('catalog'); setSelectedCourse(null); }}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <FontAwesomeIcon icon={['fas', 'arrow-left']} /> Kembali ke Katalog
        </button>
        <div className="flex items-center gap-4">
          <Badge color="blue" className="hidden sm:flex">Mode Belajar Fokus</Badge>
        </div>
      </div>

      {/* ── SPLIT LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-[320px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col h-full overflow-hidden z-10 shadow-sm hidden md:flex">
          
          {/* Course Info Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h2 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3 line-clamp-2">
              {selectedCourse.title}
            </h2>
            
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <Badge color="blue" className="text-[9px] px-2 py-0.5 mb-2 font-bold">{getLessonTypeLabel(selectedLesson?.type).toUpperCase()}</Badge>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 mb-4">
                {selectedLesson?.title || 'Pilih Materi'}
              </h3>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Progress Belajar</span>
                  <span className="text-slate-900 dark:text-white">{completedCount} / {totalLessons} modul</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: \`\${progressPercent}%\` }}></div>
                </div>
                <div className="text-right text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {progressPercent}% Selesai
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 px-2">
            <button
              onClick={() => setView('workspace')}
              className={\`flex-1 py-3 text-xs font-bold border-b-2 transition-colors \${currentTab === 'modul' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            >
              Daftar Modul
            </button>
            <button
              onClick={() => setView('catatan')}
              className={\`flex-1 py-3 text-xs font-bold border-b-2 transition-colors \${currentTab === 'catatan' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            >
              Catatan Belajar
            </button>
          </div>

          {/* Curriculum List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentTab === 'modul' ? modules.map((module, mIdx) => {
              const moduleLessons = module.lessons || [];
              const modCompleted = moduleLessons.filter(l => progress[l.id]).length;
              const isLocked = lockedModuleIds.includes(module.id);
              
              return (
                <div key={module.id} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-2">
                    <span className="uppercase tracking-wider truncate mr-2">{module.title}</span>
                    <span className="shrink-0">{modCompleted}/{moduleLessons.length}</span>
                  </div>
                  
                  <div className="space-y-1">
                    {moduleLessons.map((lesson, lIdx) => {
                      const isActive = selectedLesson?.id === lesson.id;
                      const isCompleted = progress[lesson.id];
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (!isLocked) {
                              selectModule(module);
                              selectLesson(lesson);
                            }
                          }}
                          disabled={isLocked}
                          className={\`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-colors \${
                            isLocked 
                              ? 'opacity-50 cursor-not-allowed'
                              : isActive 
                                ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
                          }\`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">
                                <FontAwesomeIcon icon={['fas', 'check']} />
                              </div>
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[8px] border border-blue-200 dark:border-blue-800">
                                <FontAwesomeIcon icon={['fas', 'play']} className="ml-0.5" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={\`text-sm font-bold truncate leading-tight mb-1 \${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}\`}>
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                              <span>{mIdx + 1}.{lIdx + 1}</span>
                              <span>·</span>
                              <span>{lesson.is_preview ? 'Gratis' : getLessonTypeLabel(lesson.type)}</span>
                              {isLocked && (
                                <>
                                  <span>·</span>
                                  <FontAwesomeIcon icon={['fas', 'lock']} className="text-amber-500" />
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }) : (
              <div className="p-4 text-center text-slate-500 text-sm">
                Catatan Anda untuk kursus ini akan tampil di sini.
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col h-full relative overflow-hidden">
`;

// Then we preserve the inner rendering of 'selectedLesson' content, but change the wrapper.
// We extract the content from `<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">`
// up to `{/* Video Preview Modal */}`

const startLessonContent = code.indexOf(`{selectedLesson.type === 'video' && selectedLesson.video_url ? (`);
const endLessonContent = code.indexOf(`{/* Video Preview Modal */}`);

if (startLessonContent === -1 || endLessonContent === -1) {
  console.log("Could not find lesson content bounds");
  process.exit(1);
}

let lessonContent = code.substring(startLessonContent, endLessonContent);

// Fix the prose styling in reading type:
lessonContent = lessonContent.replace(
  `<div className="p-8 prose dark:prose-invert max-w-none">`,
  `<div className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed text-slate-800 dark:text-slate-200">`
);

// We need to inject the Header Title before the lesson content
let mainContent = `
          {selectedLesson ? (
            <div className="flex-1 overflow-y-auto pb-32 scroll-smooth">
              <div className="max-w-4xl mx-auto px-6 sm:px-12 py-10 sm:py-16">
                
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-10 leading-tight">
                  {selectedLesson.title}
                </h1>
                
                <div className="content-wrapper">
                  ${lessonContent}
`;

// Wait, the lessonContent string already contains the bottom navigation logic!
// Let's modify the navigation section in the extracted string.
let navStart = lessonContent.indexOf(`<div className="flex items-center justify-between pt-4 w-full">`);
if (navStart !== -1) {
  // Replace the whole div.flex.items-center.justify-between with a new footer
  mainContent = mainContent.substring(0, mainContent.length - (lessonContent.length - navStart));
  mainContent += `
                  {/* Bottom Navigation */}
                  <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      {prevLesson && (
                        <Button onClick={() => navigateToLesson(prevLesson)} variant="ghost" className="border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold px-6 py-2.5 rounded-xl">
                          ← Sebelumnya
                        </Button>
                      )}
                    </div>
                    <div>
                      {selectedLesson.type === 'quiz' ? (
                        quizAttempts[selectedLesson.id]?.is_passed ? (
                          nextLesson ? (
                            <Button onClick={() => navigateToLesson(nextLesson)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md">
                              Selanjutnya →
                            </Button>
                          ) : (
                            <Badge color="emerald" className="px-4 py-2 font-bold rounded-xl text-sm">
                              <FontAwesomeIcon icon={['fas', 'circle-check']} className="mr-1.5" /> Kuis Selesai
                            </Badge>
                          )
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold px-4">
                            Harus lulus kuis (min 60%) untuk lanjut
                          </span>
                        )
                      ) : (
                        <Button onClick={() => markLessonComplete(selectedLesson.id)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md">
                          {!nextLesson ? (
                            <><FontAwesomeIcon icon={['fas', 'check-double']} className="mr-2" /> Tandai Selesai</>
                          ) : progress[selectedLesson.id] ? (
                            <>Selanjutnya →</>
                          ) : (
                            <>Tandai Selesai & Lanjut →</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl">
                🎓
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Selamat Datang di {selectedCourse?.title}</h2>
              <p className="max-w-md mx-auto">Pilih materi pada daftar modul di sebelah kiri untuk memulai proses pembelajaran Anda.</p>
            </div>
          )}

          {/* Floating AI Helper Bar */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex justify-center">
            <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105">
              <FontAwesomeIcon icon={['fas', 'robot']} />
              Tanya Dibby AI tentang materi ini
            </button>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
`;
}

// Assemble the final code
const finalCode = code.substring(0, indexStart) + headerTop + layoutTop + mainContent + code.substring(endLessonContent);

fs.writeFileSync('resources/js/components/pages/Elearning/ElearningPage.jsx', finalCode);

