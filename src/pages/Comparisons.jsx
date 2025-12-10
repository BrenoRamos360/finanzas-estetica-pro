import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const Comparisons = () => { // Updated
    const { transactions, categories } = useFinance();

    // State for selectors
    const [metricType, setMetricType] = useState('total_income'); // total_income, total_expense, net_income, category_X
    const [periodA, setPeriodA] = useState(format(subMonths(new Date(), 1), 'yyyy-MM')); // Default: Last Month
    const [periodB, setPeriodB] = useState(format(new Date(), 'yyyy-MM')); // Default: Current Month

    // Helper to get available metrics
    const metrics = useMemo(() => {
        const baseMetrics = [
            { id: 'total_income', label: 'Facturación Total' },
            { id: 'total_expense', label: 'Gastos Totales' },
            { id: 'net_income', label: 'Beneficio Neto (Efectivo)' },
        ];

        const expenseCategories = (categories?.expense || []).map(cat => ({
            id: `cat_exp_${cat}`,
            label: `Gasto: ${cat}`
        }));

        // We could add income categories too if needed

        return [...baseMetrics, ...expenseCategories];
    }, [categories]);

    // Helper to calculate value for a period and metric
    const calculateValue = (period, metric) => {
        const start = `${period}-01`;
        // Calculate end of month correctly
        const dateObj = parseISO(start);
        const end = format(endOfMonth(dateObj), 'yyyy-MM-dd');

        const periodTrans = transactions.filter(t =>
            t.date >= start && t.date <= end && t.status === 'paid'
        );

        if (metric === 'total_income') {
            return periodTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
        }
        if (metric === 'total_expense') {
            return periodTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
        }
        if (metric === 'net_income') {
            const income = periodTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
            const expense = periodTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
            return income - expense;
        }
        if (metric.startsWith('cat_exp_')) {
            const catName = metric.replace('cat_exp_', '');
            return periodTrans
                .filter(t => t.type === 'expense' && (t.category || 'Otros') === catName)
                .reduce((acc, curr) => acc + curr.amount, 0);
        }
        return 0;
    };

    const valueA = useMemo(() => calculateValue(periodA, metricType), [periodA, metricType, transactions]);
    const valueB = useMemo(() => calculateValue(periodB, metricType), [periodB, metricType, transactions]);

    const difference = valueB - valueA;
    const percentChange = valueA !== 0 ? ((valueB - valueA) / valueA) * 100 : (valueB > 0 ? 100 : 0);

    const chartData = [
        {
            name: 'Comparativa',
            [format(parseISO(`${periodA}-01`), 'MMM yyyy', { locale: es })]: valueA,
            [format(parseISO(`${periodB}-01`), 'MMM yyyy', { locale: es })]: valueB,
        }
    ];

    // Helper for subMonths since I used it in initial state but didn't import it correctly or define it
    // Actually I imported it from date-fns but let's make sure
    // Wait, I didn't import subMonths in the code content above. I need to add it.

    // --- Multi-Year Comparison Logic ---
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
    const [yearsToCompare, setYearsToCompare] = useState(4);

    const multiYearData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: yearsToCompare }, (_, i) => currentYear - (yearsToCompare - 1) + i);

        return years.map(year => {
            const start = new Date(year, selectedMonth, 1);
            const end = endOfMonth(start);
            const startStr = format(start, 'yyyy-MM-dd');
            const endStr = format(end, 'yyyy-MM-dd');

            const monthTrans = transactions.filter(t =>
                t.date >= startStr && t.date <= endStr && t.status === 'paid'
            );

            const income = monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
            const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

            return {
                year: year.toString(),
                Ingresos: income,
                Gastos: expense,
                Neto: income - expense
            };
        });
    }, [selectedMonth, yearsToCompare, transactions]);

    // --- Expense History Logic ---
    const [historyType, setHistoryType] = useState('description'); // 'description' or 'category'
    const [historySearch, setHistorySearch] = useState('');
    const [historyCategory, setHistoryCategory] = useState(categories?.expense?.[0] || '');
    const [historyMonths, setHistoryMonths] = useState(12);

    const historyData = useMemo(() => {
        if (historyType === 'description' && !historySearch) return [];

        const endDate = new Date();
        const startDate = subMonths(endDate, historyMonths - 1); // -1 to include current month
        const startStr = format(startOfMonth(startDate), 'yyyy-MM-dd');

        // Filter relevant transactions first
        const relevantTrans = transactions.filter(t => {
            if (t.date < startStr || t.status !== 'paid' || t.type !== 'expense') return false;

            if (historyType === 'description') {
                return t.description.toLowerCase().includes(historySearch.toLowerCase());
            } else {
                return (t.category || 'Otros') === historyCategory;
            }
        });

        // Group by month
        const months = eachMonthOfInterval({ start: startDate, end: endDate });

        return months.map(month => {
            const mStart = format(startOfMonth(month), 'yyyy-MM-dd');
            const mEnd = format(endOfMonth(month), 'yyyy-MM-dd');

            const monthTotal = relevantTrans
                .filter(t => t.date >= mStart && t.date <= mEnd)
                .reduce((acc, curr) => acc + curr.amount, 0);

            return {
                name: format(month, 'MMM yy', { locale: es }),
                amount: monthTotal
            };
        });
    }, [historyType, historySearch, historyCategory, historyMonths, transactions]);

    return (
        <div className="space-y-12">
            {/* Section 1: Custom Period Comparison (Existing) */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Comparativas Personalizadas (v2)</h2>

                {/* Controls */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Métrica a Comparar</label>
                        <select
                            value={metricType}
                            onChange={(e) => setMetricType(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-gray-700"
                        >
                            {metrics.map(m => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Periodo A (Base)</label>
                            <input
                                type="month"
                                value={periodA}
                                onChange={(e) => setPeriodA(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-gray-700"
                            />
                        </div>
                        <div className="pt-6 text-slate-300">
                            <ArrowRight />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Periodo B (Actual)</label>
                            <input
                                type="month"
                                value={periodB}
                                onChange={(e) => setPeriodB(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stat Card A */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-bold text-slate-400 uppercase mb-2">
                            {format(parseISO(`${periodA}-01`), 'MMMM yyyy', { locale: es })}
                        </span>
                        <span className="text-3xl font-bold text-slate-700">€ {valueA.toFixed(2)}</span>
                    </div>

                    {/* Stat Card B */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 ${difference >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-bold text-slate-400 uppercase mb-2">
                            {format(parseISO(`${periodB}-01`), 'MMMM yyyy', { locale: es })}
                        </span>
                        <span className={`text-4xl font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            € {valueB.toFixed(2)}
                        </span>
                    </div>

                    {/* Difference Card */}
                    <div className={`p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-center ${difference >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <span className={`text-sm font-bold uppercase mb-2 ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Diferencia
                        </span>
                        <div className="flex items-center gap-2">
                            {difference > 0 ? <TrendingUp size={32} className="text-green-600" /> : difference < 0 ? <TrendingDown size={32} className="text-red-600" /> : <Minus size={32} className="text-slate-400" />}
                            <span className={`text-3xl font-bold ${difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {difference > 0 ? '+' : ''}€ {difference.toFixed(2)}
                            </span>
                        </div>
                        <span className={`text-sm font-bold mt-1 ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {difference > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Visualización Gráfica</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Legend />
                                <Bar dataKey={format(parseISO(`${periodA}-01`), 'MMM yyyy', { locale: es })} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey={format(parseISO(`${periodB}-01`), 'MMM yyyy', { locale: es })} fill={difference >= 0 ? '#22c55e' : '#ef4444'} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <div className="border-t border-slate-200"></div>

            {/* Section 2: Multi-Year Comparison */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Comparativa Anual (Mismo Mes)</h2>

                    <div className="flex gap-4">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>
                                    {format(new Date(2000, i, 1), 'MMMM', { locale: es })}
                                </option>
                            ))}
                        </select>

                        <select
                            value={yearsToCompare}
                            onChange={(e) => setYearsToCompare(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {[2, 3, 4, 5, 10].map(y => (
                                <option key={y} value={y}>Últimos {y} años</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={multiYearData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Legend />
                                <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <div className="border-t border-slate-200"></div>

            {/* Section 3: Expense History */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Histórico de Gastos Específicos</h2>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Buscar por</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setHistoryType('description')}
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${historyType === 'description' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Descripción
                            </button>
                            <button
                                onClick={() => setHistoryType('category')}
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${historyType === 'category' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Categoría
                            </button>
                        </div>
                    </div>

                    <div className="flex-[2] w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                            {historyType === 'description' ? 'Término de búsqueda' : 'Categoría'}
                        </label>
                        {historyType === 'description' ? (
                            <input
                                type="text"
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                placeholder="Ej: Mercadona, Luz, Alquiler..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                            />
                        ) : (
                            <select
                                value={historyCategory}
                                onChange={(e) => setHistoryCategory(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                            >
                                {(categories?.expense || []).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rango de Tiempo</label>
                        <select
                            value={historyMonths}
                            onChange={(e) => setHistoryMonths(parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        >
                            <option value={6}>Últimos 6 meses</option>
                            <option value={12}>Último año</option>
                            <option value={24}>Últimos 2 años</option>
                            <option value={60}>Últimos 5 años</option>
                            <option value={120}>Últimos 10 años</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="h-80">
                        {historyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={historyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="amount" name="Gasto" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Calendar size={48} className="mb-4 opacity-50" />
                                <p>Ingresa un término de búsqueda para ver el historial</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Comparisons;
