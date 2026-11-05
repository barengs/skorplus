import React from 'react';
import { useSelector } from 'react-redux';
import AppLayout from '../../templates/AppLayout';
import StudentProfileView from '../Student/Profile/StudentProfileView';
import TutorProfileView from '../Tutor/Profile/TutorProfileView';
import SchoolAdminAccountProfileView from '../SchoolAdmin/Profile/SchoolAdminAccountProfileView';
import AdminProfileView from '../Admin/Profile/AdminProfileView';

export default function ProfilePage() {
  const user = useSelector((s) => s.auth.user);
  const primaryRole = user?.roles?.[0] || 'siswa';

  const renderRoleProfile = () => {
    if (primaryRole === 'admin') {
      return <AdminProfileView />;
    }
    if (primaryRole === 'admin_sekolah') {
      return <SchoolAdminAccountProfileView />;
    }
    if (primaryRole === 'tutor') {
      return <TutorProfileView />;
    }
    return <StudentProfileView />;
  };

  return <AppLayout title="Profil Saya">{renderRoleProfile()}</AppLayout>;
}
