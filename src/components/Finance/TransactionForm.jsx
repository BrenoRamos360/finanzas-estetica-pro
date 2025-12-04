import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

const TransactionForm = ({ onClose, initialDate, initialData, onEditComplete }) => {
    const { addTransaction, editTransaction, categories } = useFinance();
    const [type, setType] = useState(initialData?.type || 'income');
    const [description, setDescription] = useState(initialData?.description || '');
    const [amount, setAmount] = useState(initialData?.amount || '');
    const [date, setDate] = useState(initialData?.date || initialDate || new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD in local time
    const [category, setCategory] = useState(initialData?.category || '');
    const [status, setStatus] = useState(initialData?.status || 'paid');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description || !amount || !category) return;

        const parsedAmount = parseFloat(amount.toString().replace(',', '.'));
        if (isNaN(parsedAmount) || parsedAmount <= 0) return;

        const transactionData = {
            description,
            amount: parsedAmount,
            type,
            date,
            category,
            status
        };

        if (initialData) {
            editTransaction({ ...transactionData, id: initialData.id });
            if (onEditComplete) onEditComplete();
        } else {
            addTransaction(transactionData);
        }

        if (!initialData) {
            setDescription('');
            setAmount('');
            setCategory('');
            setStatus('paid');
        }

        if (onClose) onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {initialData ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </h3>

            <div className="flex gap-4 mb-4">
                <button
                    type="button"
                    onClick={() => { setType('income'); setCategory(''); }}
                    className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${type === 'income'
                        ? 'bg-green-100 text-green-700 border-2 border-green-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                >
                    <Plus size={18} /> Ingreso
                </button>
                <button
                    type="button"
                    onClick={() => { setType('expense'); setCategory(''); }}
                    className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${type === 'expense'
                        ? 'bg-red-100 text-red-700 border-2 border-red-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                >
                    <Minus size={18} /> Gasto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                    >
                        <option value="">Seleccionar Categoría</option>
                        {categories[type].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Venta de Producto"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (€)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Pago</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="status"
                                value="paid"
                                checked={status === 'paid'}
                                onChange={() => setStatus('paid')}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">Pagado / Cobrado</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="status"
                                value="pending"
                                checked={status === 'pending'}
                                onChange={() => setStatus('pending')}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">Pendiente</span>
                        </label>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
                {initialData ? 'Guardar Cambios' : 'Añadir Movimiento'}
            </button>
        </form>
    );
};

export default TransactionForm;
