import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Calendar, FileText, LogOut, Settings, BarChart3, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Panel Principal', path: '/' },
        { icon: Wallet, label: 'Movimientos', path: '/movimentacoes' },
        { icon: Calendar, label: 'Calendario', path: '/calendario' },
        { icon: FileText, label: 'Gastos Fijos', path: '/gastos-fixos' },
        { icon: BarChart3, label: 'Reportes', path: '/reportes' },
        { icon: ArrowLeftRight, label: 'Comparativas', path: '/comparativas' },
        { icon: Settings, label: 'Configuración', path: '/configuracion' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40 shadow-xl transition-transform duration-300 ease-in-out
                md:translate-x-0 md:static md:z-10
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Wallet className="text-white" size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Estética<span className="text-blue-400">Pro</span></h1>
                    </div>
                    {/* Close button for mobile */}
                    {/* We can import X from lucide-react if needed, or just let backdrop handle close */}
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Usuario'}</p>
                            <p className="text-xs text-slate-400 truncate">Conectado</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
