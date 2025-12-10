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

                return {
                    name: format(month, 'MMM yyyy', { locale: es }),
                    Ingresos: income,
                    Gastos: expense,
                    Beneficio: income - expense
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
                    Beneficio: dayTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0) - dayTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)
                };
            });
        }
        return data;
    }, [filteredTransactions, dateRange]);

    // ... (rest of the file)

    {/* Evolution Chart - Full Width */ }
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

    {/* Category Breakdown - Full Width */ }
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
