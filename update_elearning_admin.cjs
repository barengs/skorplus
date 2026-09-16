const fs = require('fs');

let file = fs.readFileSync('resources/js/components/pages/Admin/Elearning/AdminElearningPage.jsx', 'utf8');

file = file.replace("import { Link } from 'react-router-dom';", "import { Link, useNavigate } from 'react-router-dom';");
file = file.replace(/const dispatch = useDispatch\(\);\n/g, "const dispatch = useDispatch();\n  const navigate = useNavigate();\n");
file = file.replace(/onClick=\{\(\) => openModal\(\)\}/g, "onClick={() => navigate('/admin/elearning/courses/create')}");
file = file.replace(/onClick=\{\(\) => openModal\(course\)\}/g, "onClick={() => navigate(`/admin/elearning/courses/${course.id}/edit`)}");
file = file.replace(/\{\/\* Modal Form \*\/\}[\s\S]*?<\/div>\n    <\/AppLayout>/g, '      </div>\n    </AppLayout>');

fs.writeFileSync('resources/js/components/pages/Admin/Elearning/AdminElearningPage.jsx', file);

let currFile = fs.readFileSync('resources/js/components/pages/Admin/Elearning/AdminElearningCurriculumPage.jsx', 'utf8');
currFile = currFile.replace(/onClick=\{\(e\) => \{ e\.stopPropagation\(\); openLessonModal\(mod\.id, lesson\); \}\}/g, "onClick={(e) => { e.stopPropagation(); navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/${lesson.id}/edit`); }}");
currFile = currFile.replace(/onClick=\{\(\) => openLessonModal\(mod\.id, null, 'video'\)\}/g, "onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/create`)}");
currFile = currFile.replace(/onClick=\{\(\) => openLessonModal\(mod\.id, null, 'reading'\)\}/g, "onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/create`)}");
currFile = currFile.replace(/onClick=\{\(\) => openLessonModal\(mod\.id, null, 'quiz'\)\}/g, "onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/create`)}");
currFile = currFile.replace(/onClick=\{\(\) => openLessonModal\(mod\.id, null, 'assignment'\)\}/g, "onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/create`)}");
currFile = currFile.replace(/\{\/\* Modal Lesson \*\/\}[\s\S]*?\{\/\* Video Preview Modal \*\/\}/g, "{/* Video Preview Modal */}");
fs.writeFileSync('resources/js/components/pages/Admin/Elearning/AdminElearningCurriculumPage.jsx', currFile);

