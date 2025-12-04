import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, Tag, Save } from 'lucide-react';

const Settings = () => {
    const { categories, addCategory, removeCategory } = useFinance();
    const [newIncomeCategory, setNewIncomeCategory] = useState('');
    const [newExpenseCategory, setNewExpenseCategory] = useState('');

    const handleAddCategory = (type) => {
        const value = type === 'income' ? newIncomeCategory : newExpenseCategory;
        const setValue = type === 'income' ? setNewIncomeCategory : setNewExpenseCategory;

        if (value.trim()) {
            addCategory(type, value.trim());
            setValue('');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Income Categories */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <Tag size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Categorías de Ingresos</h3>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newIncomeCategory}
                            onChange={(e) => setNewIncomeCategory(e.target.value)}
                            placeholder="Nueva categoría..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory('income')}
                        />
                        <button
                            onClick={() => handleAddCategory('income')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {categories.income.map((cat, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                <span className="font-medium text-gray-700">{cat}</span>
                                <button
                                    onClick={() => removeCategory('income', cat)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expense Categories */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Tag size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Categorías de Gastos</h3>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newExpenseCategory}
                            onChange={(e) => setNewExpenseCategory(e.target.value)}
                            placeholder="Nueva categoría..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory('expense')}
                        />
                        <button
                            onClick={() => handleAddCategory('expense')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {categories.expense.map((cat, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                <span className="font-medium text-gray-700">{cat}</span>
                                <button
                                    onClick={() => removeCategory('expense', cat)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
