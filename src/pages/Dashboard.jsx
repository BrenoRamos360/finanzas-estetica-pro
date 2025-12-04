import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle, ArrowUpCircle, ArrowDownCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import DateRangePicker from '../components/Finance/DateRangePicker';

const Dashboard = () => {
    const {
        balance,
        projectedBalance,
        periodIncome,
        periodExpenses,
        periodPendingIncome,
        periodPendingExpenses,
        filteredTransactions,
        dateRange,
        prevPeriodIncome,
        prevPeriodExpenses
    } = useFinance();

    // Calculate Percentage Changes
    const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const incomeChange = calculateChange(periodIncome, prevPeriodIncome);
    const expenseChange = calculateChange(periodExpenses, prevPeriodExpenses);

    // Top Expenses
    const topExpenses = filteredTransactions
        .filter(t => t.type === 'expense' && t.status === 'paid')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    // Chart Data: Based on selected range
    const start = parseISO(dateRange.startDate);
    const end = parseISO(dateRange.endDate);

    // Generate array of days in range
    // Limit to avoid performance issues on huge ranges, though eachDayOfInterval is fast.
    // If range is huge, we might want to group, but for now let's try to render.
    // If > 60 days, maybe we should group by month?
    let days = [];
    try {
        if (start <= end) {
            days = eachDayOfInterval({ start, end });
        } else {
            // Fallback or empty if invalid range
            console.warn("Invalid date range: start > end");
        }
    } catch (e) {
        console.error("Error generating days interval:", e);
    }

    let chartData = [];

    // Simple logic: if days < 40, show daily. If more, show daily but it will be crowded (Recharts handles it by skipping ticks usually).
    // Ideally we'd group by week or month.
    chartData = days.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayTransactions = filteredTransactions.filter(t => t.date === dateStr && t.status === 'paid');

        return {
            name: format(date, 'dd MMM', { locale: es }),
            Ingresos: dayTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0),
            Gastos: dayTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0),
        };
    });

    // Pie Chart Data: Expenses by Category (Filtered)
    const expensesByCategory = filteredTransactions
        .filter(t => t.type === 'expense' && t.status === 'paid')
        .reduce((acc, curr) => {
            const cat = curr.category || 'Otros';
            acc[cat] = (acc[cat] || 0) + curr.amount;
            return acc;
        }, {});

    const pieData = Object.keys(expensesByCategory).map(key => ({
        name: key,
        value: expensesByCategory[key]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Panel General <span className="text-xs text-gray-400 font-normal">(v1.2)</span></h2>
                <DateRangePicker />
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Saldo Real (Global) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Wallet size={22} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Actual</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Disponible Hoy</p>
                    <h3 className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                        € {balance.toFixed(2)}
                    </h3>
                </div>

                {/* Balance del Periodo */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <TrendingUp size={22} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance Periodo</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Ingresos - Gastos</p>
                    <h3 className={`text-2xl font-bold mt-1 ${(periodIncome - periodExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        € {(periodIncome - periodExpenses).toFixed(2)}
                    </h3>
                </div>

                {/* Ingresos Periodo */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <ArrowUpCircle size={22} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">En este periodo</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className="text-2xl font-bold text-green-600">€ {periodIncome.toFixed(2)}</h3>
                        <span className={`text-xs font-bold mb-1 flex items-center ${incomeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {incomeChange >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {Math.abs(incomeChange).toFixed(0)}%
                        </span>
                    </div>
                </div>

                {/* Gastos Periodo */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 rounded-xl text-red-600">
                            <ArrowDownCircle size={22} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">En este periodo</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className="text-2xl font-bold text-red-600">€ {periodExpenses.toFixed(2)}</h3>
                        <span className={`text-xs font-bold mb-1 flex items-center ${expenseChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {expenseChange > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {Math.abs(expenseChange).toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Comparison & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Bar Chart */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bar Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Flujo de Caja (Periodo Seleccionado)</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} minTickGap={30} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column: Category Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Gastos por Categoría</h3>
                    <div className="h-80 w-full">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                No hay gastos en este periodo
                            </div>
                        )}
                    </div>
                    <div className="mt-4 space-y-3">
                        {pieData.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-slate-600">{entry.name}</span>
                                </div>
                                <span className="font-semibold text-slate-900">€ {entry.value.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Expenses Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Gastos</h3>
                    <div className="space-y-3">
                        {topExpenses.length > 0 ? (
                            topExpenses.map(expense => (
                                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 text-red-600 rounded-full">
                                            <ArrowDownCircle size={16} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{expense.description}</p>
                                            <p className="text-xs text-gray-500">{expense.category || 'Sin categoría'}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-red-600">€ {expense.amount.toFixed(2)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No hay gastos registrados en este periodo.</p>
                        )}
                    </div>
                </div>

                {/* Projected Balance Summary */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Proyección a Fin de Mes</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <span className="text-blue-800 font-medium">Saldo Actual</span>
                            <span className="text-blue-800 font-bold">€ {balance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 flex items-center gap-2"><Clock size={16} /> Ingresos Pendientes</span>
                            <span className="text-green-600 font-medium">+ € {periodPendingIncome.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 flex items-center gap-2"><Clock size={16} /> Gastos Pendientes</span>
                            <span className="text-red-600 font-medium">- € {periodPendingExpenses.toFixed(2)}</span>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="font-bold text-gray-800">Saldo Proyectado</span>
                            <span className={`text-xl font-bold ${projectedBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                € {projectedBalance.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
