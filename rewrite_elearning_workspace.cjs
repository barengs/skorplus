const fs = require('fs');
let file = fs.readFileSync('resources/js/components/pages/Elearning/ElearningPage.jsx', 'utf8');

const replacement = `  // ===== WORKSPACE VIEW =====
  const currentTab = view === 'catatan' ? 'catatan' : 'modul';

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* ── TOP NAV ── */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 z-10 relative">
        <button
          onClick={() => navigate('/elearning')}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <FontAwesomeIcon icon={['fas', 'arrow-left']} /> Kembali ke Katalog
        </button>
        <div className="flex items-center gap-4">
          {/* Optional actions or profile can go here */}
        </div>
      </div>

      {/* ── SPLIT LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-[320px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col h-full overflow-hidden">
          
          {/* Course Info Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <h2 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3 line-clamp-2">
              {selectedCourse.title}
            </h2>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <Badge color="blue" className="text-[10px] px-2 py-0.5 mb-2 shadow-xs">{getLessonTypeLabel(selectedLesson?.type).toUpperCase()}</Badge>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 mb-4">
                {selectedLesson?.title || 'Pilih Materi'}
              </h3>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Progress Belajar</span>
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
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 px-2">
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
                                ? 'bg-slate-100 dark:bg-slate-800' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }\`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">
                                <FontAwesomeIcon icon={['fas', 'check']} />
                              </div>
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[8px] border border-blue-200 dark:border-blue-800">
                                <FontAwesomeIcon icon={['fas', 'play']} />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={\`text-sm font-semibold truncate \${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}\`}>
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 mt-1">
                              <span>{mIdx + 1}.{lIdx + 1}</span>
                              <span>·</span>
                              <span>{lesson.is_preview ? 'Gratis' : getLessonTypeLabel(lesson.type)}</span>
                              {lesson.type === 'video' && lesson.duration_seconds > 0 && (
                                <>
                                  <span>·</span>
                                  <span>{Math.round(lesson.duration_seconds/60)} mnt</span>
                                </>
                              )}
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
        <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col h-full relative">
          
          {selectedLesson ? (
            <div className="flex-1 overflow-y-auto pb-24 scroll-smooth" id="lesson-content-area">
              <div className="max-w-3xl mx-auto px-6 sm:px-12 py-10 sm:py-16">
                
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-8 leading-tight">
                  {selectedLesson.title}
                </h1>
                
                {selectedLesson.type === 'video' && selectedLesson.video_url ? (
                  <div className="rounded-2xl overflow-hidden shadow-xl bg-slate-900 border border-slate-200 dark:border-slate-800 aspect-video mb-8">
                    <iframe width="100%" height="100%" src={toEmbedUrl(selectedLesson.video_url)} title={selectedLesson.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                  </div>
                ) : selectedLesson.type === 'quiz' ? (
                  /* Quiz Content */
                  <div className="mb-8">
                    {/* Placeholder for quiz runner code so we don't break existing logic */}
                    {/* Usually we render the quiz UI here. Let's adapt it to the clean layout */}
`;
// We will replace the entire return portion from <AppLayout title={selectedCourse?.title || 'E-Learning'}>
// but since the file is large, I'll use a precise script.
