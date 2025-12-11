import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Trash2, Plus, CheckCircle, Calendar, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const FixedExpenses = () => {
    const { fixedExpenses, addFixedExpense, removeFixedExpense, updateFixedExpense, processFixedExpense, transactions, removeTransaction, categories } = useFinance();

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [day, setDay] = useState('');
    const [category, setCategory] = useState('');
    const [editingId, setEditingId] = useState(null); // ID of expense being edited

    // Month Selection State
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Local state for editing amounts and dates before confirmation
    const [confirmValues, setConfirmValues] = useState({});

    // Initialize confirm values when fixed expenses change or month changes
    // Calculate default values based on fixed expenses and selected month
    const defaultValues = useMemo(() => {
        const values = {};
        fixedExpenses.forEach(exp => {
            const defaultDay = exp.day ? exp.day.toString().padStart(2, '0') : '01';
            values[exp.id] = {
                amount: exp.amount,
                date: `${selectedMonth}-${defaultDay}`
            };
        });
        return values;
    }, [fixedExpenses, selectedMonth]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description || !amount || !category) return;

        const expenseData = {
            description,
            amount: parseFloat(amount),
            day: day ? parseInt(day) : null,
            category
        };

        if (editingId) {
            updateFixedExpense(editingId, expenseData);
            setEditingId(null);
        } else {
            addFixedExpense(expenseData);
        }

        setDescription('');
        setAmount('');
        setDay('');
        setCategory('');
    };

    const handleEditClick = (expense) => {
        setDescription(expense.description);
        setAmount(expense.amount);
        setDay(expense.day || '');
        setCategory(expense.category || '');
        setEditingId(expense.id);
    };

    const handleCancelEdit = () => {
        setDescription('');
        setAmount('');
        setDay('');
        setCategory('');
        setEditingId(null);
    };

    const handleProcess = (expense) => {
        const userValue = confirmValues[expense.id] || {};
        const defaultValue = defaultValues[expense.id] || { amount: expense.amount, date: `${selectedMonth}-01` };
        const values = { ...defaultValue, ...userValue };
        // Pass the category to the process function if needed, or ensure processFixedExpense uses the expense's category
        // The current processFixedExpense sets category to 'Fijos', we might want to change that later or keep it generic.
        // For now, let's keep 'Fijos' as the main category for the transaction, or update FinanceContext to use the specific category.
        // Checking FinanceContext... it hardcodes 'Fijos'. Let's update it to use the expense category if available.
        // Wait, I can't update FinanceContext here. I'll stick to the current implementation and maybe update FinanceContext later if requested.
        // Actually, for reports, it would be better if the transaction had the specific category.
        // But for now, let's focus on the UI grouping.
        processFixedExpense(expense, values.amount, values.date);
    };

    const handleConfirmValueChange = (id, field, value) => {
        setConfirmValues(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    // Helper to check if expense is paid in selected month
    const getPaymentStatus = (expense) => {
        if (!transactions) return null;

        const year = selectedMonth.split('-')[0];
        const month = selectedMonth.split('-')[1];

        // Find transaction linked to this expense in this month
        const transaction = transactions.find(t => {
            if (!t.date) return false; // Safety check for missing date

            const tDate = t.date; // YYYY-MM-DD
            const tYear = tDate.split('-')[0];
            const tMonth = tDate.split('-')[1];

            // Match by ID (new way) or Description (legacy compatibility)
            const isMatch = (t.fixedExpenseId === expense.id) ||
                (!t.fixedExpenseId && t.description === expense.description && t.amount === expense.amount);

            return isMatch && tYear === year && tMonth === month;
        });

        return transaction;
    };

    // Helper to get last month's payment for reference
    const getLastMonthPayment = (expense) => {
        if (!transactions) return null;

        const current = parseISO(selectedMonth + '-01');
        const prevDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
        const prevYear = prevDate.getFullYear().toString();
        const prevMonth = (prevDate.getMonth() + 1).toString().padStart(2, '0');

        const transaction = transactions.find(t => {
            if (!t.date) return false; // Safety check for missing date

            const tDate = t.date;
            const tYear = tDate.split('-')[0];
            const tMonth = tDate.split('-')[1];

            const isMatch = (t.fixedExpenseId === expense.id) ||
                (!t.fixedExpenseId && t.description === expense.description); // Relaxed match for history

            return isMatch && tYear === prevYear && tMonth === prevMonth;
        });

        return transaction ? transaction.amount : null;
    };

    // Group expenses by category
    const groupedExpenses = fixedExpenses.reduce((acc, expense) => {
        const cat = expense.category || 'Sin Categoría';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(expense);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Gastos Fijos Mensuales</h2>

                {/* Month Selector */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <Calendar size={20} className="text-blue-600" />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="text-sm font-medium text-gray-700 focus:outline-none bg-transparent"
                    />
                </div>
            </div>

            {/* Add/Edit Expense Form */}
            <form onSubmit={handleSubmit} className={`p-6 rounded-xl shadow-sm border transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${editingId ? 'text-blue-800' : 'text-gray-800'}`}>
                    {editingId ? <Edit2 size={20} /> : <Plus size={20} className="text-blue-600" />}
                    {editingId ? 'Editar Gasto Fijo' : 'Configurar Nuevo Gasto Fijo'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Alquiler Local"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Seleccionar...</option>
                            {categories?.expense?.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Base (€)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Día de Pago (Opcional)</label>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            placeholder="Ej: 5"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        type="submit"
                        className={`flex-1 py-2 px-6 rounded-lg font-medium transition-colors ${editingId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                    >
                        {editingId ? 'Actualizar Gasto' : 'Guardar Configuración'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            {/* Monthly Status List - Grouped by Category */}
            <div className="space-y-6">
                {Object.keys(groupedExpenses).length === 0 && (
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-400 flex flex-col items-center gap-2">
                        <AlertCircle size={32} className="text-slate-300" />
                        <p>No hay gastos fijos configurados.</p>
                        <p className="text-sm">Añade uno arriba para empezar.</p>
                    </div>
                )}

                {Object.entries(groupedExpenses).map(([catName, expenses]) => {
                    const totalCategory = expenses.reduce((acc, curr) => acc + curr.amount, 0);

                    return (
                        <div key={catName} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                    {catName}
                                </h3>
                                <span className="text-sm font-bold text-slate-600">
                                    Total: € {totalCategory.toFixed(2)}
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {expenses.map((expense) => {
                                    const paidTransaction = getPaymentStatus(expense);
                                    const isPaid = !!paidTransaction;
                                    const lastMonthAmount = getLastMonthPayment(expense);

                                    const userValue = confirmValues[expense.id] || {};
                                    const defaultValue = defaultValues[expense.id] || { amount: expense.amount, date: '' };
                                    const confirmData = { ...defaultValue, ...userValue };

                                    return (
                                        <div key={expense.id} className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${isPaid ? 'bg-green-50/30' : 'hover:bg-slate-50'}`}>
                                            {/* Expense Info */}
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isPaid ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {expense.day || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{expense.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>Base: € {expense.amount.toFixed(2)}</span>
                                                        {lastMonthAmount !== null && (
                                                            <span className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                                                Mes anterior: € {lastMonthAmount.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Area */}
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                {isPaid ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <span className="block text-xs font-bold text-green-600 uppercase tracking-wider">Pagado</span>
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-bold text-gray-900 text-lg">€ {paidTransaction.amount.toFixed(2)}</span>
                                                                <span className="text-xs text-slate-400">{format(parseISO(paidTransaction.date), 'd MMM', { locale: es })}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('¿Deshacer este pago? Se eliminará el movimiento.')) {
                                                                    removeTransaction(paidTransaction.id);
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                            title="Deshacer pago"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                                        <div className="flex flex-col px-2 border-r border-slate-100">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha</label>
                                                            <input
                                                                type="date"
                                                                value={confirmData.date}
                                                                onChange={(e) => handleConfirmValueChange(expense.id, 'date', e.target.value)}
                                                                className="w-28 text-xs font-medium text-gray-700 focus:outline-none bg-transparent"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col px-2">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Valor</label>
                                                            <input
                                                                type="number"
                                                                value={confirmData.amount}
                                                                onChange={(e) => handleConfirmValueChange(expense.id, 'amount', e.target.value)}
                                                                className="w-20 font-bold text-gray-900 focus:outline-none border-b border-transparent focus:border-blue-500 transition-colors"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleProcess(expense)}
                                                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                            title="Confirmar y Pagar"
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Edit/Delete Actions */}
                                                {!isPaid && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleEditClick(expense)}
                                                            className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                                                            title="Editar configuración"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('¿Eliminar esta configuración de gasto fijo?')) {
                                                                    removeFixedExpense(expense.id);
                                                                }
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                            title="Eliminar configuración"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FixedExpenses;
