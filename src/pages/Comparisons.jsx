import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Line, LabelList, LineChart } from 'recharts';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Calendar, Plus, Trash2 } from 'lucide-react';
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

    // Helper to get available years from transactions
    const availableYears = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            const currentYear = new Date().getFullYear();
            return [currentYear, currentYear - 1];
        }
        const years = new Set(transactions.map(t => parseInt(t.date.substring(0, 4))));
        // Ensure current year and previous year are always available
        years.add(new Date().getFullYear());
        years.add(new Date().getFullYear() - 1);

        return Array.from(years).sort((a, b) => b - a);
    }, [transactions]);

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
    const [yearsToCompare, setYearsToCompare] = useState(3);
    const [annualMode, setAnnualMode] = useState('ytd'); // 'ytd' or 'full'
    const [annualMetric, setAnnualMetric] = useState('all'); // 'all', 'income', 'expense', 'net'

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
                Ingresos: Number(income.toFixed(2)),
                Gastos: Number(expense.toFixed(2)),
                Neto: Number((income - expense).toFixed(2))
            };
        });
    }, [selectedMonth, yearsToCompare, transactions]);

    // --- Monthly Evolution Sequence Logic ---
    const [monthlyEvolutionMonths, setMonthlyEvolutionMonths] = useState(12);

    const monthlyEvolutionData = useMemo(() => {
        const endDate = new Date();
        const startDate = subMonths(endDate, monthlyEvolutionMonths - 1);
        const months = eachMonthOfInterval({ start: startDate, end: endDate });

        return months.map(month => {
            const mStart = format(startOfMonth(month), 'yyyy-MM-dd');
            const mEnd = format(endOfMonth(month), 'yyyy-MM-dd');

            const monthTrans = transactions.filter(t =>
                t.date >= mStart && t.date <= mEnd && t.status === 'paid'
            );

            const income = monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
            const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

            return {
                name: format(month, 'MMM yy', { locale: es }),
                Ingresos: Number(income.toFixed(2)),
                Gastos: Number(expense.toFixed(2)),
                Beneficio: Number((income - expense).toFixed(2))
            };
        });
    }, [monthlyEvolutionMonths, transactions]);

    // --- Flexible Stacked Comparison Logic ---
    const [flexibleCharts, setFlexibleCharts] = useState([
        { id: 1, year: new Date().getFullYear(), metric: 'income' },
        { id: 2, year: new Date().getFullYear() - 1, metric: 'income' }
    ]);

    const addFlexibleChart = () => {
        if (flexibleCharts.length >= 4) return;
        const newId = Math.max(...flexibleCharts.map(c => c.id)) + 1;
        setFlexibleCharts([...flexibleCharts, { id: newId, year: new Date().getFullYear(), metric: 'income' }]);
    };

    const removeFlexibleChart = (id) => {
        setFlexibleCharts(flexibleCharts.filter(c => c.id !== id));
    };

    const updateFlexibleChart = (id, field, value) => {
        setFlexibleCharts(flexibleCharts.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const getFlexibleChartData = (year, metric) => {
        const months = eachMonthOfInterval({
            start: new Date(year, 0, 1),
            end: new Date(year, 11, 31)
        });

        return months.map(month => {
            const mStart = format(startOfMonth(month), 'yyyy-MM-dd');
            const mEnd = format(endOfMonth(month), 'yyyy-MM-dd');

            const monthTrans = transactions.filter(t =>
                t.date >= mStart && t.date <= mEnd && t.status === 'paid'
            );

            let value = 0;
            if (metric === 'income') {
                value = monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
            } else if (metric === 'expense') {
                value = monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
            } else {
                const income = monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
                const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
                value = income - expense;
            }

            return {
                name: format(month, 'MMM', { locale: es }),
                value: Number(value.toFixed(2))
            };
        });
    };

    // --- Master Comparison Overlay Logic ---
    const [overlayYears, setOverlayYears] = useState([new Date().getFullYear(), new Date().getFullYear() - 1]);
    const [overlayMetric, setOverlayMetric] = useState('income');

    const toggleOverlayYear = (year) => {
        setOverlayYears(prev =>
            prev.includes(year)
                ? prev.filter(y => y !== year)
                : [...prev, year]
        );
    };

    const overlayData = useMemo(() => {
        const months = eachMonthOfInterval({
            start: new Date(2024, 0, 1), // Dummy year just for month names
            end: new Date(2024, 11, 31)
        });

        return months.map(month => {
            const monthName = format(month, 'MMM', { locale: es });
            const dataPoint = { name: monthName };

            overlayYears.forEach(year => {
                const mStart = format(new Date(year, month.getMonth(), 1), 'yyyy-MM-dd');
                const mEnd = format(endOfMonth(new Date(year, month.getMonth(), 1)), 'yyyy-MM-dd');

                const monthTrans = transactions.filter(t =>
                    t.date >= mStart && t.date <= mEnd && t.status === 'paid'
                );

                let value = 0;
                if (overlayMetric === 'income') {
                    value = monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
                } else if (overlayMetric === 'expense') {
                    value = monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
                } else {
                    const income = monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
                    const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
                    value = income - expense;
                }
                dataPoint[year] = Number(value.toFixed(2));
            });

            return dataPoint;
        });
    }, [overlayYears, overlayMetric, transactions]);

    const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

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
                <h2 className="text-2xl font-bold text-gray-800">Comparativa entre Periodos</h2>

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
                                {/* Render bars chronologically */}
                                {periodA < periodB ? (
                                    <>
                                        <Bar dataKey={format(parseISO(`${periodA}-01`), 'MMM yyyy', { locale: es })} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey={format(parseISO(`${periodB}-01`), 'MMM yyyy', { locale: es })} fill={difference >= 0 ? '#22c55e' : '#ef4444'} radius={[4, 4, 0, 0]} />
                                    </>
                                ) : (
                                    <>
                                        <Bar dataKey={format(parseISO(`${periodB}-01`), 'MMM yyyy', { locale: es })} fill={difference >= 0 ? '#22c55e' : '#ef4444'} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey={format(parseISO(`${periodA}-01`), 'MMM yyyy', { locale: es })} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    </>
                                )}
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
                            <BarChart data={multiYearData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Legend />
                                <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="Ingresos" position="top" style={{ fill: '#22c55e', fontSize: '10px', fontWeight: 'bold' }} formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} />
                                </Bar>
                                <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="Gastos" position="top" style={{ fill: '#ef4444', fontSize: '10px', fontWeight: 'bold' }} formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <div className="border-t border-slate-200"></div>

            {/* Section 3: Annual Comparison (YTD vs Full Year) */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Comparativa Anual</h2>
                        <p className="text-sm text-slate-500">
                            Analiza el rendimiento anual. Puedes ver el año completo o solo hasta la fecha actual (YTD).
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {/* Time Range Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setAnnualMode('ytd')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${annualMode === 'ytd' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                YTD (Hasta hoy)
                            </button>
                            <button
                                onClick={() => setAnnualMode('full')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${annualMode === 'full' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Año Completo
                            </button>
                        </div>

                        {/* Metric Toggle */}
                        <select
                            value={annualMetric}
                            onChange={(e) => setAnnualMetric(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Ingresos y Gastos</option>
                            <option value="income">Solo Ingresos</option>
                            <option value="expense">Solo Gastos</option>
                            <option value="net">Beneficio Neto</option>
                        </select>

                        {/* Years Selector */}
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
                            <BarChart data={useMemo(() => {
                                const currentYear = new Date().getFullYear();
                                const currentMonth = new Date().getMonth();
                                const currentDay = new Date().getDate();
                                const years = Array.from({ length: yearsToCompare }, (_, i) => currentYear - (yearsToCompare - 1) + i);

                                return years.map(year => {
                                    const startStr = format(new Date(year, 0, 1), 'yyyy-MM-dd');
                                    let endStr;

                                    if (annualMode === 'ytd') {
                                        // End date is today's day/month in that year
                                        endStr = format(new Date(year, currentMonth, currentDay), 'yyyy-MM-dd');
                                    } else {
                                        // End date is Dec 31st of that year
                                        endStr = format(new Date(year, 11, 31), 'yyyy-MM-dd');
                                    }

                                    const periodTrans = transactions.filter(t =>
                                        t.date >= startStr && t.date <= endStr && t.status === 'paid'
                                    );

                                    const income = periodTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
                                    const expense = periodTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

                                    return {
                                        year: year.toString(),
                                        Ingresos: Number(income.toFixed(2)),
                                        Gastos: Number(expense.toFixed(2)),
                                        Neto: Number((income - expense).toFixed(2))
                                    };
                                });
                            }, [yearsToCompare, annualMode, transactions])} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Legend />

                                {(annualMetric === 'all' || annualMetric === 'income') && (
                                    <Bar dataKey="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="Ingresos" position="top" style={{ fill: '#3b82f6', fontSize: '10px', fontWeight: 'bold' }} formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} />
                                    </Bar>
                                )}
                                {(annualMetric === 'all' || annualMetric === 'expense') && (
                                    <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="Gastos" position="top" style={{ fill: '#ef4444', fontSize: '10px', fontWeight: 'bold' }} formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} />
                                    </Bar>
                                )}
                                {(annualMetric === 'net') && (
                                    <Bar dataKey="Neto" fill="#10b981" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="Neto" position="top" style={{ fill: '#10b981', fontSize: '10px', fontWeight: 'bold' }} formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} />
                                    </Bar>
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <div className="border-t border-slate-200"></div>

            {/* Section 4: Monthly Evolution Sequence */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Evolución Mensual (Secuencia)</h2>
                    <select
                        value={monthlyEvolutionMonths}
                        onChange={(e) => setMonthlyEvolutionMonths(parseInt(e.target.value))}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={6}>Últimos 6 meses</option>
                        <option value={12}>Últimos 12 meses</option>
                        <option value={24}>Últimos 24 meses</option>
                    </select>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyEvolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Legend />
                                <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                <Line type="monotone" dataKey="Beneficio" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <div className="border-t border-slate-200"></div>

            {/* Section 5: Flexible Stacked Comparison (Playground) */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Comparador Flexible (Playground)</h2>
                        <p className="text-sm text-gray-500">Añade gráficos para comparar años y métricas libremente.</p>
                    </div>
                    <button
                        onClick={addFlexibleChart}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} /> Añadir Gráfico
                    </button>
                </div>

                <div className="space-y-6">
                    {flexibleCharts.map((chart) => {
                        const chartData = getFlexibleChartData(chart.year, chart.metric);
                        const metricLabel = chart.metric === 'income' ? 'Ingresos' : chart.metric === 'expense' ? 'Gastos' : 'Beneficio';
                        const metricColor = chart.metric === 'income' ? '#22c55e' : chart.metric === 'expense' ? '#ef4444' : '#3b82f6';

                        return (
                            <div key={chart.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <select
                                            value={chart.year}
                                            onChange={(e) => updateFlexibleChart(chart.id, 'year', parseInt(e.target.value))}
                                            className="px-3 py-1 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {availableYears.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={chart.metric}
                                            onChange={(e) => updateFlexibleChart(chart.id, 'metric', e.target.value)}
                                            className="px-3 py-1 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="income">Ingresos</option>
                                            <option value="expense">Gastos</option>
                                            <option value="profit">Beneficio</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => removeFlexibleChart(chart.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar gráfico"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                            <Bar dataKey="value" name={metricLabel} fill={metricColor} radius={[4, 4, 0, 0]} barSize={40}>
                                                <LabelList dataKey="value" position="top" style={{ fill: metricColor, fontSize: '10px', fontWeight: 'bold' }} formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="border-t border-slate-200"></div>

            {/* Section 6: Master Comparison Overlay (Year vs Year) */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Comparativa Maestra (Superposición)</h2>
                        <p className="text-sm text-gray-500">Superpone años para ver tendencias estacionales.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={overlayMetric}
                            onChange={(e) => setOverlayMetric(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="income">Ingresos</option>
                            <option value="expense">Gastos</option>
                            <option value="profit">Beneficio</option>
                        </select>
                        <div className="flex gap-2">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => toggleOverlayYear(year)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${overlayYears.includes(year)
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={overlayData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Legend />
                                {overlayYears.map((year, index) => (
                                    <Line
                                        key={year}
                                        type="monotone"
                                        dataKey={year}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <div className="border-t border-slate-200"></div>

            {/* Section 7: Expense History */}
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
