import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { useFinance } from '../context/FinanceContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, X, Plus, Eye, EyeOff, TrendingUp, TrendingDown, LayoutGrid, Pencil } from 'lucide-react'; // Added Pencil

// ... (inside component)
const [editingTransaction, setEditingTransaction] = useState(null); // New state

// ... (inside render)
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {showAddForm ? (
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2">
                                        {editingTransaction ? 'Editar Movimiento' : 'Añadir Movimiento para este día'}
                                    </h4>
                                    <TransactionForm
                                        onClose={() => { setShowAddForm(false); setEditingTransaction(null); }}
                                        initialDate={format(date, 'yyyy-MM-dd')}
                                        initialData={editingTransaction}
                                        onEditComplete={() => { setShowAddForm(false); setEditingTransaction(null); }}
                                    />
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => { setEditingTransaction(null); setShowAddForm(true); }}
                                        className="w-full mb-4 py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg font-medium hover:bg-blue-50 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} /> Añadir Movimiento
                                    </button>

                                    {dayTransactions.length > 0 ? (
                                        <div className="space-y-3">
                                            {dayTransactions.map(t => (
                                                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        {t.type === 'income' ? (
                                                            <ArrowUpCircle className="text-green-500" size={20} />
                                                        ) : (
                                                            <ArrowDownCircle className="text-red-500" size={20} />
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-gray-900">{t.description}</p>
                                                            <p className="text-xs text-gray-500 capitalize">
                                                                {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                            € {t.amount.toFixed(2)}
                                                        </span>
                                                        <button
                                                            onClick={() => { setEditingTransaction(t); setShowAddForm(true); }}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <span className="font-medium text-gray-600">Balance del Día:</span>
                                                <span className="font-bold text-xl text-gray-900">
                                                    € {dayTransactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No hay movimientos para este día.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div >
                </div >
            )}
        </div >
    );
};

export default CalendarView;
