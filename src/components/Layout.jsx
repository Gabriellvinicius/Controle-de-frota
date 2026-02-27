import React from 'react';
import { LayoutDashboard, Map, Wrench, ClipboardList, LogOut, Menu, X, Droplets, FileText, Car, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Outlet, Link, useLocation } from 'react-router-dom';

const CarIcon = (props) => <Car strokeWidth={1} {...props} />;
const UsersIcon = (props) => <Users strokeWidth={1} {...props} />;

const Layout = () => {
    const { user, isGestor, signOut, profile } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'CHECK-LIST', href: '/checklists', icon: ClipboardList },
        { name: 'Cadastro de Motorista', href: '/condutores', icon: UsersIcon },
        { name: 'Veículos', href: '/veiculos', icon: CarIcon },
        { name: 'Planilha de Viagem', href: '/rotas', icon: Map },
        { name: 'Multas', href: '/multas', icon: AlertTriangle },
        { name: 'Manutenção', href: '/manutencao', icon: Wrench },
        { name: 'Abastecimento', href: '/abastecimento', icon: Droplets },
        { name: 'Relatórios', href: '/relatorios', icon: FileText, gestorOnly: true },
        { name: 'Criação de Acessos', href: '/acessos', icon: Users, adminOnly: true },
    ].filter(item => {
        // Show if no restriction
        if (!item.gestorOnly && !item.adminOnly) return true;
        // Show if isGestor (includes Admin essentially, or we need separate logic) and item is gestorOnly
        if (item.gestorOnly && (isGestor || profile?.role === 'admin')) return true;
        // Show if item is adminOnly and role is admin
        if (item.adminOnly && profile?.role === 'admin') return true;
        return false;
    });

    const [showPasswordModal, setShowPasswordModal] = React.useState(false);
    const [newPassword, setNewPassword] = React.useState('');
    const [loadingPassword, setLoadingPassword] = React.useState(false);

    const handleLogout = async () => {
        await signOut();
        window.location.reload();
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoadingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            alert('Senha alterada com sucesso!');
            setShowPasswordModal(false);
            setNewPassword('');
        } catch (error) {
            alert('Erro ao alterar senha: ' + error.message);
        } finally {
            setLoadingPassword(false);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 z-20">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            Gestão<span className="text-sky-500">Frota</span>
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.href)
                                ? 'bg-sky-600 text-white'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <item.icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-slate-500'}`} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-950">
                    <div className="mb-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Usuário</p>
                        <p className="text-sm font-bold text-white tracking-wide">
                            {profile?.name || 'Usuário do Sistema'}
                        </p>
                        <p className="text-xs text-sky-500 font-bold uppercase tracking-widest mt-0.5 mb-3">
                            {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'gestor' ? 'Gestor' : 'Motorista'}
                        </p>

                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="text-[10px] text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4 transition-all"
                        >
                            Alterar Senha
                        </button>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-2"
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-slate-800 text-white rounded-lg shadow-md border border-slate-700"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-slate-950/95 md:hidden backdrop-blur-sm">
                    <div className="flex flex-col h-full p-6">
                        <div className="mb-8 flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-white">
                                Gestão<span className="text-sky-500">Frota</span>
                            </h1>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-800 rounded-lg text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="space-y-2">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center px-4 py-3 text-base font-medium rounded-lg ${isActive(item.href)
                                        ? 'bg-sky-600 text-white'
                                        : 'text-slate-400'
                                        }`}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-slate-500'}`} />
                                    {item.name}
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full px-4 py-3 text-base font-medium text-slate-500 mt-6 border-t border-slate-800 pt-6"
                            >
                                <LogOut className="mr-3 h-5 w-5" />
                                Sair do Sistema
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-900 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Alterar Senha</h3>
                        <form onSubmit={handleChangePassword}>
                            <input
                                type="password"
                                placeholder="Nova senha"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 outline-none mb-4"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 text-sm font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingPassword}
                                    className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-bold"
                                >
                                    {loadingPassword ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
