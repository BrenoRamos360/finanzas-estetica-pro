import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart, LabelList } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, eachDayOfInterval } from 'date-fns';
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

        // Average Daily (based on business days: Mon-Sat)
        const start = parseISO(dateRange.startDate);
        const end = parseISO(dateRange.endDate);

        const daysInInterval = eachDayOfInterval({ start, end });
        // Filter out Sundays (0)
        const businessDays = Math.max(1, daysInInterval.filter(day => day.getDay() !== 0).length);

        const avgDailyExpense = totalExpenses / businessDays;
        const avgDailyIncome = totalIncome / businessDays;

        return {
            totalIncome,
            totalExpenses,
            savings,
            savingsRate,
            avgDailyExpense,
            avgDailyIncome,
            businessDays
        };
    }, [filteredTransactions, dateRange]);

    // ... (rest of the file until return)

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Reportes y Análisis</h2>
                <DateRangePicker />
            </div>

            {/* KPIs Row - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Balance Card (Hero) */}
                <div className="md:col-span-4 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg"><Wallet size={24} className="text-white" /></div>
                            <span className="text-sm font-bold text-blue-100 uppercase tracking-wider">Balance del Periodo</span>
                        </div>
                        <span className="text-xs bg-white/20 px-3 py-1 rounded-full text-blue-50">Ingresos - Gastos</span>
                    </div>
                    <h3 className="text-5xl font-bold text-white mb-2">
                        € {kpis.savings.toFixed(2)}
                    </h3>
                    <p className="text-sm text-blue-100 opacity-90">
                        Resultado neto del periodo seleccionado
                    </p>
                </div>

                {/* Secondary KPIs */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Ingresos Totales</span>
                    </div>
                    <h3 className="text-2xl font-bold text-green-600">€ {kpis.totalIncome.toFixed(0)}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Gastos Totales</span>
                    </div>
                    <h3 className="text-2xl font-bold text-red-600">€ {kpis.totalExpenses.toFixed(0)}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Prom. Diario Ingresos</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">€ {kpis.avgDailyIncome.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-1">Lun-Sáb ({kpis.businessDays} días)</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><TrendingDown size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Prom. Diario Gastos</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">€ {kpis.avgDailyExpense.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-1">Lun-Sáb ({kpis.businessDays} días)</p>
                </div>

                {/* Smaller KPIs */}
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-slate-200 text-slate-600 rounded-md"><Activity size={16} /></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Tasa de Ahorro</span>
                    </div>
                    <span className="text-lg font-bold text-slate-700">{kpis.savingsRate.toFixed(1)}%</span>
                </div>

                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-slate-200 text-slate-600 rounded-md"><DollarSign size={16} /></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Ahorro Total</span>
                    </div>
                    <span className="text-lg font-bold text-slate-700">€ {kpis.savings.toFixed(0)}</span>
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
                            <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20}>
                                <LabelList dataKey="Ingresos" position="top" style={{ fill: '#15803d', fontSize: '10px', fontWeight: 'bold' }} formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)} k` : value} />
                            </Bar>
                            <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20}>
                                <LabelList dataKey="Gastos" position="top" style={{ fill: '#b91c1c', fontSize: '10px', fontWeight: 'bold' }} formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)} k` : value} />
                            </Bar>
                            <Line type="monotone" dataKey="Beneficio" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}>
                                <LabelList dataKey="Beneficio" position="top" offset={10} style={{ fill: '#1d4ed8', fontSize: '10px', fontWeight: 'bold' }} formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)} k` : value} />
                            </Line>
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
                                        <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
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
            {/* Section 4: Average Profit Analysis */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={20} />
                    Proyección de Beneficios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm font-bold text-blue-600 uppercase mb-1">Media Mensual</p>
                        <p className="text-3xl font-bold text-gray-800">€ {averageProfitData.monthlyAverage.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Basado en {averageProfitData.monthsDiff} mes{averageProfitData.monthsDiff !== 1 ? 'es' : ''} seleccionados
                        </p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-sm font-bold text-indigo-600 uppercase mb-1">Media Trimestral (Est.)</p>
                        <p className="text-3xl font-bold text-gray-800">€ {averageProfitData.quarterlyAverage.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Proyección cada 3 meses
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Analytics;
