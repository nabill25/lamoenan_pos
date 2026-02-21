import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Search, Phone, Trash2, Loader2 } from 'lucide-react';


interface Member {
  id: string;
  name: string;
  phone: string;
  points: number;
  created_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // State untuk Form Tambah Member
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true });

    if (error) console.error('Error:', error);
    else setMembers(data || []);
    setLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    const { data, error } = await supabase
      .from('members')
      .insert([{ name: newName, phone: newPhone }])
      .select();

    if (error) {
      alert("Gagal menambah member: " + error.message);
    } else {
      setMembers([...(data || []), ...members]);
      setNewName('');
      setNewPhone('');
      alert("Member baru berhasil terdaftar!");
    }
    setIsAdding(false);
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Pelanggan</h1>
          <p className="text-gray-500">Kelola member loyalitas Lamoenan Cafe & Bistro.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KIRI: Form Tambah Member */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <UserPlus size={20} className="text-indigo-600" />
            Daftar Member Baru
          </h2>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nama Lengkap</label>
              <input
                type="text" required
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Andi Wijaya"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nomor WhatsApp</label>
              <input
                type="text" required
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0812..."
              />
            </div>
            <button
              disabled={isAdding}
              className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="animate-spin mx-auto" /> : "Simpan Member"}
            </button>
          </form>
        </div>

        {/* KANAN: Daftar Tabel Member */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama atau nomor HP..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3">Nama Pelanggan</th>
                  <th className="px-6 py-3">Kontak</th>
                  <th className="px-6 py-3">Poin</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400">Memuat data...</td></tr>
                ) : filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold">
                          {member.name[0]}
                        </div>
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 flex items-center gap-1">
                      <Phone size={14} /> {member.phone}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        {member.points} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}