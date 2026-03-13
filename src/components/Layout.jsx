import React from 'react';
import { LayoutDashboard, Map, Wrench, ClipboardList, LogOut, Menu, X, Droplets, FileText, Car, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Outlet, Link, useLocation } from 'react-router-dom';

const CarIcon = (props) => <Car strokeWidth={1} {...props} />;
const UsersIcon = (props) => <Users strokeWidth={1} {...props} />;

const Layout = () => {
    const { user, isGestor, signOut, profile } = useAuth();
    const { theme, toggleTheme } = useTheme();
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
        { name: 'Usuários', href: '/acessos', icon: Users, gestorOnly: true },
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
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-20 transition-colors">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Gestão<span className="text-sky-500">Frota</span>
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive(item.href)
                                ? 'bg-sky-600 text-white shadow-md'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-slate-200'}`} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-colors">
                    <div className="mb-4">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Usuário</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">
                            {profile?.name || 'Usuário do Sistema'}
                        </p>
                        <p className="text-xs text-sky-600 dark:text-sky-500 font-bold uppercase tracking-widest mt-0.5 mb-3">
                            {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'gestor' ? 'Gestor' : 'Motorista'}
                        </p>

                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4 transition-all"
                        >
                            Alterar Senha
                        </button>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors mt-2"
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
                    className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg shadow-md border border-slate-200 dark:border-slate-700"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white/95 dark:bg-slate-950/95 md:hidden backdrop-blur-sm transition-colors">
                    <div className="flex flex-col h-full p-6">
                        <div className="mb-8 flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Gestão<span className="text-sky-500">Frota</span>
                            </h1>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white shadow-sm">
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="space-y-2">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center px-4 py-3 text-base font-medium rounded-lg group ${isActive(item.href)
                                        ? 'bg-sky-600 text-white'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-slate-200'}`} />
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
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#0f172a] transition-colors relative">

                {/* Header Strip with Theme Toggle */}
                <header className="h-16 border-b border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#1e293b] flex items-center justify-end px-4 md:px-8 shrink-0 transition-colors z-10 w-full shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-400 hover:text-sky-500 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800/50 rounded-full transition-all"
                            title="Alternar Tema"
                        >
                            {theme === 'dark' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                            )}
                        </button>
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Alterar Senha</h3>
                        <form onSubmit={handleChangePassword}>
                            <input
                                type="password"
                                placeholder="Nova senha"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none mb-4"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingPassword}
                                    className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-bold transition-colors"
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
