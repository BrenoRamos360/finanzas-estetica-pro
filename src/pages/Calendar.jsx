import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { useFinance } from '../context/FinanceContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, X, Plus } from 'lucide-react';
import TransactionForm from '../components/Finance/TransactionForm';
import 'react-calendar/dist/Calendar.css';

const CalendarView = () => {
    const { transactions } = useFinance();
    const [date, setDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const onChange = (newDate) => {
        setDate(newDate);
        setShowModal(true);
        setShowAddForm(false);
    };

    // Filter transactions for the selected date
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter(t => t.date === selectedDateStr);

    // Function to add content to calendar tiles
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dailyTransactions = transactions.filter(t => t.date === dateStr);

            if (dailyTransactions.length > 0) {
                const income = dailyTransactions
                    .filter(t => t.type === 'income')
                    .reduce((acc, curr) => acc + curr.amount, 0);

                const expense = dailyTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((acc, curr) => acc + curr.amount, 0);

                const balance = income - expense;

                return (
                    <div className="w-full px-1 mt-1 flex flex-col gap-0.5 text-[10px] font-medium">
                        {income > 0 && (
                            <div className="text-green-600 flex justify-between">
                                <span>Ing:</span>
                                <span>{income.toFixed(0)}</span>
                            </div>
                        )}
                        {expense > 0 && (
                            <div className="text-red-600 flex justify-between">
                                <span>Gas:</span>
                                <span>{expense.toFixed(0)}</span>
                            </div>
                        )}
                        <div className={`border-t border-gray-100 mt-0.5 pt-0.5 flex justify-between font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            <span>Bal:</span>
                            <span>{balance.toFixed(0)}</span>
                        </div>
                    </div>
                );
            }
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Calendario Financiero</h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <style>{`
          .react-calendar { 
            width: 100%; 
            border: none; 
            font-family: inherit;
          }
          .react-calendar__tile {
            height: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding-top: 10px;
          }
          .react-calendar__tile--active {
            background: #eff6ff !important;
            color: #2563eb !important;
          }
          .react-calendar__tile--now {
            background: #fef3c7;
          }
        `}</style>
                <Calendar
                    onClickDay={onChange}
                    value={date}
                    tileContent={tileContent}
                    locale="es-ES"
                />
            </div>

            {/* Modal for Day Details */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">
                                {format(date, "d 'de' MMMM, yyyy", { locale: es })}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {showAddForm ? (
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2">Añadir Movimiento para este día</h4>
                                    <TransactionForm
                                        onClose={() => setShowAddForm(false)}
                                        initialDate={format(date, 'yyyy-MM-dd')}
                                    />
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="w-full mb-4 py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg font-medium hover:bg-blue-50 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} /> Añadir Movimiento
                                    </button>

                                    {dayTransactions.length > 0 ? (
                                        <div className="space-y-3">
                                            {dayTransactions.map(t => (
                                                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                                                    <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                        € {t.amount.toFixed(2)}
                                                    </span>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
