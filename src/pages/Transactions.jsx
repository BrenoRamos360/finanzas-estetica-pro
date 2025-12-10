import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import TransactionForm from '../components/Finance/TransactionForm';
import { Trash2, ArrowUpCircle, ArrowDownCircle, Download, Edit, CheckCircle, Clock, Filter, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import DateRangePicker from '../components/Finance/DateRangePicker';

const Transactions = () => {
    const { filteredTransactions, removeTransaction, editTransaction, dateRange } = useFinance();
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');

    // Filter logic
    const displayedTransactions = filteredTransactions.filter(t => {
        const matchesSearch =
            (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (t.category?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesPayment = paymentFilter === 'all' || t.paymentMethod === paymentFilter;

        return matchesSearch && matchesPayment;
    });

    const handleExport = () => {
        // Prepare data for export (using displayedTransactions to respect filters)
        const allData = displayedTransactions.map(t => ({
            Fecha: t.date,
            Descripción: t.description,
            Categoría: t.category || 'Sin Categoría',
            'Método de Pago': t.paymentMethod || 'Efectivo',
            Tipo: t.type === 'income' ? 'Ingreso' : 'Gasto',
            Estado: t.status === 'pending' ? 'Pendiente' : 'Pagado',
            Importe: t.amount,
            'Ingreso (€)': t.type === 'income' ? t.amount : 0,
            'Gasto (€)': t.type === 'expense' ? t.amount : 0,
        }));

        const incomeData = displayedTransactions
            .filter(t => t.type === 'income')
            .map(t => ({
                Fecha: t.date,
                Descripción: t.description,
                Categoría: t.category || 'Sin Categoría',
                'Método de Pago': t.paymentMethod || 'Efectivo',
                Estado: t.status === 'pending' ? 'Pendiente' : 'Pagado',
                Importe: t.amount
            }));

        const expenseData = displayedTransactions
            .filter(t => t.type === 'expense')
            .map(t => ({
                Fecha: t.date,
                Descripción: t.description,
                Categoría: t.category || 'Sin Categoría',
                'Método de Pago': t.paymentMethod || 'Efectivo',
                Estado: t.status === 'pending' ? 'Pendiente' : 'Pagado',
                Importe: t.amount
            }));

        const wb = XLSX.utils.book_new();

        // Sheet 1: All Transactions
        const wsAll = XLSX.utils.json_to_sheet(allData);
        XLSX.utils.book_append_sheet(wb, wsAll, "Todos");

        // Sheet 2: Income
        const wsIncome = XLSX.utils.json_to_sheet(incomeData);
        XLSX.utils.book_append_sheet(wb, wsIncome, "Ingresos");

        // Sheet 3: Expenses
        const wsExpenses = XLSX.utils.json_to_sheet(expenseData);
        XLSX.utils.book_append_sheet(wb, wsExpenses, "Gastos");

        XLSX.writeFile(wb, `Finanzas_Pro_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleStatus = (transaction) => {
        const newStatus = transaction.status === 'pending' ? 'paid' : 'pending';
        editTransaction({ ...transaction, status: newStatus });
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Movimientos</h2>

                <div className="flex flex-col md:flex-row items-center gap-3">
                    {/* Search Input */}
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Payment Filter */}
                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Todos los Métodos</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Bizum">Bizum</option>
                        <option value="Web">Web</option>
                        <option value="General">General (Histórico)</option>
                    </select>

                    <DateRangePicker />

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm whitespace-nowrap"
                    >
                        <Download size={18} /> Exportar
                    </button>
                </div>
            </div>

            <TransactionForm
                initialData={editingTransaction}
                onEditComplete={() => setEditingTransaction(null)}
                onClose={() => setEditingTransaction(null)}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Fecha</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Descripción</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Método</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Tipo</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Valor</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayedTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{transaction.date}</td>
                                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{transaction.description}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                                            {transaction.category || 'Sin Categoría'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {transaction.paymentMethod || 'Efectivo'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {transaction.type === 'income' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                <ArrowUpCircle size={14} /> Ingreso
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                <ArrowDownCircle size={14} /> Gasto
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(transaction)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${transaction.status === 'pending'
                                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                                } `}
                                        >
                                            {transaction.status === 'pending' ? (
                                                <><Clock size={14} /> Pendiente</>
                                            ) : (
                                                <><CheckCircle size={14} /> Pagado</>
                                            )}
                                        </button>
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'} `}>
                                        € {transaction.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(transaction)}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => removeTransaction(transaction.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-slate-50 rounded-full">
                                                <Filter size={24} className="text-slate-300" />
                                            </div>
                                            <p>No hay movimientos que coincidan con tu búsqueda.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
