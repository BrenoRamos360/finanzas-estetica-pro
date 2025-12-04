import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Trash2, Plus, CheckCircle } from 'lucide-react';

const FixedExpenses = () => {
    const { fixedExpenses, addFixedExpense, removeFixedExpense, processFixedExpense } = useFinance();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [day, setDay] = useState('');

    const handleSubmit = (e) => {
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

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gastos Fijos Mensuales</h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Nuevo Gasto Fijo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Alquiler"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor (€)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Día del Mes</label>
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
                    className="mt-4 w-full md:w-auto bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Añadir Gasto Fijo
                </button>
            </form>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Día</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Descripción</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Valor</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {fixedExpenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">Día {expense.day}</td>
                                <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{expense.description}</td>
                                <td className="px-6 py-4 text-sm font-bold text-red-600">
                                    € {expense.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('¿Procesar este gasto ahora? Se añadirá a los movimientos de hoy.')) {
                                                processFixedExpense(expense);
                                            }
                                        }}
                                        title="Procesar este mes"
                                        className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100"
                                    >
                                        <CheckCircle size={14} /> PAGAR
                                    </button>
                                    <button
                                        onClick={() => removeFixedExpense(expense.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {fixedExpenses.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                    No hay gastos fijos configurados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FixedExpenses;
