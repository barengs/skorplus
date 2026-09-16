const fs = require('fs');

let file = fs.readFileSync('resources/js/components/pages/Admin/Elearning/AdminElearningPage.jsx', 'utf8');

file = file.replace(/import Input from '\.\.\/\.\.\/\.\.\/atoms\/Input';\nimport FormField from '\.\.\/\.\.\/\.\.\/molecules\/FormField';\n/g, '');
file = file.replace(/createAdminCourse, updateAdminCourse, /g, '');
file = file.replace(/const \[modalOpen[\s\S]*?setUploading\(false\);\n  const /g, 'const ');
file = file.replace(/const openModal[\s\S]*?setModalOpen\(true\);\n  };\n\n  const handleImageChange[\s\S]*?finally \{\n      setUploading\(false\);\n    \}\n  };\n\n  const handleSave[\s\S]*?\}\n  };\n\n  const handleDelete/g, 'const handleDelete');
file = file.replace(/onClick=\{\(\) => openModal\(\)\}/g, "onClick={() => navigate('/admin/elearning/courses/create')}");
file = file.replace(/onClick=\{\(\) => openModal\(course\)\}/g, "onClick={() => navigate(`/admin/elearning/courses/${course.id}/edit`)}");
file = file.replace(/\{\/\* Modal Form \*\/\}[\s\S]*?<\/div>\n    <\/AppLayout>/g, '      </div>\n    </AppLayout>');

fs.writeFileSync('resources/js/components/pages/Admin/Elearning/AdminElearningPage.jsx', file);
