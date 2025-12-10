import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, eachDayOfInterval, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, Activity, Wallet, Check } from 'lucide-react';
import DateRangePicker from '../components/Finance/DateRangePicker';

const Analytics = () => {
    const { filteredTransactions, dateRange } = useFinance();
    const allMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Bizum', 'Web', 'General'];
    const [selectedMethods, setSelectedMethods] = useState(allMethods);

    const toggleMethod = (method) => {
        setSelectedMethods(prev =>
            prev.includes(method)
                ? prev.filter(m => m !== method)
                : [...prev, method]
        );
    };

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
                const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
                const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

                const monthTrans = filteredTransactions.filter(t => {
                    return t.date >= monthStart && t.date <= monthEnd && t.status === 'paid';
                });

                const income = monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
                const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
                const profit = income - expense;

                return {
                    name: format(month, 'MMM yyyy', { locale: es }),
                    Ingresos: Number(income.toFixed(2)),
                    Gastos: Number(expense.toFixed(2)),
                    Beneficio: Number(profit.toFixed(2))
                };
            });
        } else {
            // Group by Day
            const days = eachDayOfInterval({ start, end });
            data = days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTrans = filteredTransactions.filter(t => t.date === dateStr && t.status === 'paid');

                const income = dayTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
                const expense = dayTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
                const profit = income - expense;

                return {
                    name: format(day, 'dd MMM', { locale: es }),
                    Ingresos: Number(income.toFixed(2)),
                    Gastos: Number(expense.toFixed(2)),
                    Beneficio: Number(profit.toFixed(2))
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

    // --- Expense Category Analysis Data ---
    const { categories } = useFinance();
    const allCategories = categories?.expense || [];
    const [selectedCategories, setSelectedCategories] = useState(allCategories);

    const toggleCategory = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const categoryAnalysisTotal = useMemo(() => {
        return filteredTransactions
            .filter(t => t.type === 'expense' && t.status === 'paid' && selectedCategories.includes(t.category || 'Otros'))
            .reduce((acc, curr) => acc + curr.amount, 0);
    }, [filteredTransactions, selectedCategories]);

    const methodAnalysisTotal = useMemo(() => {
        return filteredTransactions
            .filter(t => t.type === 'income' && t.status === 'paid' && selectedMethods.includes(t.paymentMethod))
            .reduce((acc, curr) => acc + curr.amount, 0);
    }, [filteredTransactions, selectedMethods]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Reportes y Análisis</h2>
                <DateRangePicker />
            </div>

            {/* Payment Method Analysis Section (Income) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h3 className="text-lg font-bold text-gray-800">Análisis de Ingresos por Método</h3>

                    {/* Method Selector */}
                    <div className="flex flex-wrap gap-2">
                        {allMethods.map(method => (
                            <button
                                key={method}
                                onClick={() => toggleMethod(method)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${selectedMethods.includes(method)
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {selectedMethods.includes(method) && <Check size={12} />}
                                {method}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Selected Card */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Wallet size={20} />
                            </div>
                            <span className="text-sm font-bold text-blue-800 uppercase">Total Ingresos</span>
                        </div>
                        <h3 className="text-3xl font-bold text-blue-900">
                            € {methodAnalysisTotal.toFixed(2)}
                        </h3>
                        <p className="text-xs text-blue-600 mt-2">
                            Métodos seleccionados: {selectedMethods.length}
                        </p>
                    </div>

                    {/* Detailed Breakdown List (Filtered) */}
                    <div className="md:col-span-2">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Desglose por Método</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedMethods.map(method => {
                                const amount = filteredTransactions
                                    .filter(t => t.type === 'income' && t.status === 'paid' && t.paymentMethod === method)
                                    .reduce((acc, curr) => acc + curr.amount, 0);

                                return (
                                    <div key={method} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full bg-blue-500`}></div>
                                            <span className="text-slate-700 font-medium">{method}</span>
                                        </div>
                                        <span className="font-bold text-slate-900">€ {amount.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                            {selectedMethods.length === 0 && (
                                <p className="text-sm text-slate-400 italic">Selecciona métodos para ver el desglose.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Category Analysis Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h3 className="text-lg font-bold text-gray-800">Análisis de Gastos por Categoría</h3>

                    {/* Category Selector */}
                    <div className="flex flex-wrap gap-2">
                        {allCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${selectedCategories.includes(cat)
                                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {selectedCategories.includes(cat) && <Check size={12} />}
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Selected Card */}
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <TrendingDown size={20} />
                            </div>
                            <span className="text-sm font-bold text-red-800 uppercase">Total Gastos</span>
                        </div>
                        <h3 className="text-3xl font-bold text-red-900">
                            € {categoryAnalysisTotal.toFixed(2)}
                        </h3>
                        <p className="text-xs text-red-600 mt-2">
                            Categorías seleccionadas: {selectedCategories.length}
                        </p>
                    </div>

                    {/* Detailed Breakdown List (Filtered) */}
                    <div className="md:col-span-2">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Desglose por Categoría</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedCategories.map(cat => {
                                const amount = filteredTransactions
                                    .filter(t => t.type === 'expense' && t.status === 'paid' && (t.category || 'Otros') === cat)
                                    .reduce((acc, curr) => acc + curr.amount, 0);

                                return (
                                    <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full bg-red-500`}></div>
                                            <span className="text-slate-700 font-medium">{cat}</span>
                                        </div>
                                        <span className="font-bold text-slate-900">€ {amount.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                            {selectedCategories.length === 0 && (
                                <p className="text-sm text-slate-400 italic">Selecciona categorías para ver el desglose.</p>
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Evolución Financiera y Beneficio</h3>
                <div className="h-96"> {/* Increased height slightly for better visibility */}
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={evolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend />
                            <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line type="monotone" dataKey="Beneficio" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Breakdown - Full Width */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Distribución de Gastos</h3>
                <div className="h-80">
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
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
        </div >
    );
};

export default Analytics;
