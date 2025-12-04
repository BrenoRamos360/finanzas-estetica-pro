import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Trash2, Plus, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const FixedExpenses = () => {
    const { fixedExpenses, addFixedExpense, removeFixedExpense, processFixedExpense, transactions, removeTransaction } = useFinance();

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [day, setDay] = useState('');

    // Month Selection State
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Local state for editing amounts before confirmation
    const [editAmounts, setEditAmounts] = useState({});

    // Initialize edit amounts when fixed expenses change
    useEffect(() => {
        const initialAmounts = {};
        fixedExpenses.forEach(exp => {
            initialAmounts[exp.id] = exp.amount;
        });
        setEditAmounts(prev => ({ ...initialAmounts, ...prev }));
    }, [fixedExpenses]);

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!description || !amount || !day) return;

        addFixedExpense({
            description,
            amount: parseFloat(amount),
            day: parseInt(day),
        });

        setDescription('');
        setAmount('');
        setDay('');
    };

    const handleProcess = (expense) => {
        const actualAmount = editAmounts[expense.id] || expense.amount;
        // Construct date: Selected Month + Expense Day
        const year = selectedMonth.split('-')[0];
        const month = selectedMonth.split('-')[1];
        // Ensure day is valid (e.g., not Feb 30)
        const date = `${year}-${month}-${expense.day.toString().padStart(2, '0')}`;

        processFixedExpense(expense, actualAmount, date);
    };

    const handleAmountChange = (id, value) => {
        setEditAmounts(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Helper to check if expense is paid in selected month
    const getPaymentStatus = (expense) => {
        const year = selectedMonth.split('-')[0];
        const month = selectedMonth.split('-')[1];

        // Find transaction linked to this expense in this month
        const transaction = transactions.find(t => {
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

            {/* Add New Expense Form */}
            <form onSubmit={handleAddExpense} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-600" />
                    Configurar Nuevo Gasto Fijo
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
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Día de Pago</label>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            placeholder="1-31"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="mt-4 w-full bg-slate-900 text-white py-2 px-6 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                    Guardar Configuración
                </button>
            </form>

            {/* Monthly Status List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Estado de Pagos - {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: es })}</h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        {fixedExpenses.length} Gastos Configurados
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {fixedExpenses.map((expense) => {
                        const paidTransaction = getPaymentStatus(expense);
                        const isPaid = !!paidTransaction;

                        return (
                            <div key={expense.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${isPaid ? 'bg-green-50/30' : 'hover:bg-slate-50'}`}>
                                {/* Expense Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isPaid ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {expense.day}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{expense.description}</p>
                                        <p className="text-xs text-slate-500">Valor Base: € {expense.amount.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Action Area */}
                                <div className="flex items-center gap-4">
                                    {isPaid ? (
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="block text-xs font-bold text-green-600 uppercase tracking-wider">Pagado</span>
                                                <span className="font-bold text-gray-900 text-lg">€ {paidTransaction.amount.toFixed(2)}</span>
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
                                        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex flex-col px-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Confirmar Valor</label>
                                                <input
                                                    type="number"
                                                    value={editAmounts[expense.id] ?? expense.amount}
                                                    onChange={(e) => handleAmountChange(expense.id, e.target.value)}
                                                    className="w-24 font-bold text-gray-900 focus:outline-none border-b border-transparent focus:border-blue-500 transition-colors"
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

                                    {/* Delete Config Button (Only if not paid to avoid confusion, or always?) 
                                        Let's keep it separate to avoid accidental deletion of the config 
                                    */}
                                    {!isPaid && (
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
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {fixedExpenses.length === 0 && (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                            <AlertCircle size={32} className="text-slate-300" />
                            <p>No hay gastos fijos configurados.</p>
                            <p className="text-sm">Añade uno arriba para empezar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FixedExpenses;
