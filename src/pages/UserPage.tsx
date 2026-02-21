import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, UserCog, Loader2, Mail, Trash2 } from 'lucide-react';


interface StaffMember {
  id: string;
  email: string;
  user_roles: {
    role: 'owner' | 'headbar' | 'barista';
  } | null;
}

export default function UsersPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, user_roles(role)')
      .order('email');

    if (error) console.error('Error fetching staff:', error);
    else setStaff((data as any) || []);
    setLoading(false);
  };

  const updateRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });

      if (error) throw error;
      setStaff(staff.map(s => s.id === userId ? { ...s, user_roles: { role: newRole as any } } : s));
      alert('Jabatan staff berhasil diperbarui!');
    } catch (err: any) {
      alert('Gagal update jabatan: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteStaff = async (userId: string, email: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus staff ${email}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        // Karena kita menggunakan cascade delete di database, 
        // menghapus dari 'profiles' akan membersihkan data terkait.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;

        setStaff(staff.filter(s => s.id !== userId));
        alert('Staff berhasil dihapus dari sistem.');
      } catch (err: any) {
        alert('Gagal menghapus staff: ' + err.message);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Staff</h1>
          <p className="text-gray-500">Kelola anggota tim Lamoenan Cafe & Bistro.</p>
        </div>
        <button
          onClick={fetchStaff}
          className="text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-5 bg-gray-50 p-4 border-b border-gray-100 font-bold text-[10px] uppercase tracking-wider text-gray-500">
          <div className="col-span-2">Email Staff</div>
          <div>Jabatan</div>
          <div className="col-span-2 text-right">Aksi & Pengaturan</div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin" /> Memuat daftar staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-medium">Belum ada staff terdaftar.</div>
          ) : staff.map((member) => (
            <div key={member.id} className="grid grid-cols-5 p-4 items-center hover:bg-gray-50 transition-colors">

              <div className="col-span-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                  {member.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {member.email}
                    {member.user_roles?.role === 'owner' && (
                      <span title="Owner Access">
                        <ShieldCheck size={14} className="text-amber-600" />
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Mail size={10} /> Akun Terverifikasi
                  </div>
                </div>
              </div>

              <div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${member.user_roles?.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                    member.user_roles?.role === 'headbar' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                  }`}>
                  {member.user_roles?.role || 'Tanpa Jabatan'}
                </span>
              </div>

              <div className="col-span-2 flex justify-end gap-3 items-center">
                <select
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-medium"
                  value={member.user_roles?.role || ''}
                  disabled={updatingId === member.id}
                  onChange={(e) => updateRole(member.id, e.target.value)}
                >
                  <option value="" disabled>Pilih Role</option>
                  <option value="owner">Owner</option>
                  <option value="headbar">Headbar</option>
                  <option value="barista">Barista</option>
                </select>

                <button
                  onClick={() => deleteStaff(member.id, member.email)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Hapus Staff"
                >
                  <Trash2 size={18} />
                </button>

                {updatingId === member.id && <Loader2 className="animate-spin text-indigo-600" size={16} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <UserCog className="text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Perhatian:</strong> Menghapus staff akan mencabut seluruh akses mereka ke aplikasi. Gunakan jabatan <strong>Barista</strong> untuk staff operasional harian agar data stok dan pengaturan tetap aman.
        </p>
      </div>
    </div>
  );
}