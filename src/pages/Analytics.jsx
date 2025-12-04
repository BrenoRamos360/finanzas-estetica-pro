import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, eachDayOfInterval, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, Activity, Wallet } from 'lucide-react';
import DateRangePicker from '../components/Finance/DateRangePicker';

const Analytics = () => {
    const { filteredTransactions, dateRange } = useFinance();

    // --- KPI Calculations ---
    const kpis = useMemo(() => {
        const totalIncome = filteredTransactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
        const totalExpenses = filteredTransactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
        const savings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

        // Average Daily (based on selected range duration)
        const start = parseISO(dateRange.startDate);
        const end = parseISO(dateRange.endDate);
        const daysDiff = Math.max(1, differenceInDays(end, start) + 1);

        const avgDailyExpense = totalExpenses / daysDiff;

        return {
            totalIncome,
            totalExpenses,
            savings,
            savingsRate,
            avgDailyExpense
        };
    }, [filteredTransactions, dateRange]);

    // --- Evolution Chart Data (Dynamic Grouping) ---
    const evolutionData = useMemo(() => {
        const start = parseISO(dateRange.startDate);
        const end = parseISO(dateRange.endDate);
        const daysDiff = differenceInDays(end, start);

        let data = [];

        if (daysDiff > 60) {
            // Group by Month
            const months = eachMonthOfInterval({ start, end });
            data = months.map(month => {
                const monthStart = startOfMonth(month).toISOString().split('T')[0];
                const monthEnd = endOfMonth(month).toISOString().split('T')[0];

                // Filter transactions for this month AND within the global selected range
                const monthTrans = filteredTransactions.filter(t => {
                    return t.date >= monthStart && t.date <= monthEnd && t.status === 'paid';
                });

                return {
                    name: format(month, 'MMM yyyy', { locale: es }),
                    Ingresos: monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0),
                    Gastos: monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0),
                };
            });
        } else {
            // Group by Day
            const days = eachDayOfInterval({ start, end });
            data = days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTrans = filteredTransactions.filter(t => t.date === dateStr && t.status === 'paid');

                return {
                    name: format(day, 'dd MMM', { locale: es }),
                    Ingresos: dayTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0),
                    Gastos: dayTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0),
                };
            });
        }
        return data;
    }, [filteredTransactions, dateRange]);

    // --- Category Breakdown Data ---
    const categoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === 'expense' && t.status === 'paid');
        const byCategory = expenses.reduce((acc, curr) => {
            const cat = curr.category || 'Otros';
            acc[cat] = (acc[cat] || 0) + curr.amount;
            return acc;
        }, {});

        return Object.keys(byCategory)
            .map(key => ({ name: key, value: byCategory[key] }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Reportes y Análisis</h2>
                <DateRangePicker />
            </div>

            {/* Payment Method Analysis Section */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Análisis de Ingresos por Método</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Cash vs Digital Cards */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                <Wallet size={20} />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Total Efectivo</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            € {filteredTransactions
                                .filter(t => t.type === 'income' && t.status === 'paid' && t.paymentMethod === 'Efectivo')
                                .reduce((acc, curr) => acc + curr.amount, 0)
                                .toFixed(2)}
                        </h3>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Total Digital (Banco/Web)</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            € {filteredTransactions
                                .filter(t => t.type === 'income' && t.status === 'paid' && t.paymentMethod !== 'Efectivo')
                                .reduce((acc, curr) => acc + curr.amount, 0)
                                .toFixed(2)}
                        </h3>
                    </div>

                    {/* Detailed Breakdown List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Desglose Detallado</h4>
                        <div className="space-y-3">
                            {['Efectivo', 'Tarjeta', 'Transferencia', 'Bizum', 'Web'].map(method => {
                                const amount = filteredTransactions
                                    .filter(t => t.type === 'income' && t.status === 'paid' && t.paymentMethod === method)
                                    .reduce((acc, curr) => acc + curr.amount, 0);

                                if (amount === 0) return null;

                                return (
                                    <div key={method} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${method === 'Efectivo' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                            <span className="text-gray-600">{method}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">€ {amount.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                            {filteredTransactions.filter(t => t.type === 'income' && t.status === 'paid').length === 0 && (
                                <p className="text-xs text-gray-400 italic">No hay ingresos registrados.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPIs Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Tasa de Ahorro</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{kpis.savingsRate.toFixed(1)}%</h3>
                    <p className="text-xs text-slate-400 mt-1">Del total de ingresos</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Gasto Diario Prom.</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">€ {kpis.avgDailyExpense.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-1">En el periodo seleccionado</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Ingresos Totales</span>
                    </div>
                    <h3 className="text-2xl font-bold text-green-600">€ {kpis.totalIncome.toFixed(0)}</h3>
                    <p className="text-xs text-slate-400 mt-1">En el periodo</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><DollarSign size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Ahorro Total</span>
                    </div>
                    <h3 className="text-2xl font-bold text-blue-600">€ {kpis.savings.toFixed(0)}</h3>
                    <p className="text-xs text-slate-400 mt-1">En el periodo</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Evolution Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Evolución Financiera</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evolutionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} minTickGap={30} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="Ingresos" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Distribución de Gastos</h3>
                    <div className="h-80">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                No hay gastos en este periodo
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
