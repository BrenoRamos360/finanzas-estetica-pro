import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

const DateRangePicker = () => {
    const { dateRange, setDateRange } = useFinance();
    const [isOpen, setIsOpen] = React.useState(false);

    const presets = [
        {
            label: 'Este Mes',
            getValue: () => ({
                startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
            })
        },
        {
            label: 'Mes Anterior',
            getValue: () => {
                const lastMonth = subMonths(new Date(), 1);
                return {
                    startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
                    endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
                };
            }
        },
        {
            label: 'Últimos 3 Meses',
            getValue: () => ({
                startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
            })
        },
        {
            label: 'Este Año',
            getValue: () => ({
                startDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
                endDate: format(endOfYear(new Date()), 'yyyy-MM-dd')
            })
        }
    ];

    const handlePresetClick = (preset) => {
        setDateRange(preset.getValue());
        setIsOpen(false);
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
                <CalendarIcon size={18} className="text-gray-500" />
                <span>
                    {format(new Date(dateRange.startDate), 'dd MMM', { locale: es })} - {format(new Date(dateRange.endDate), 'dd MMM, yyyy', { locale: es })}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {presets.map((preset, index) => (
                            <button
                                key={index}
                                onClick={() => handlePresetClick(preset)}
                                className="px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors text-left"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3 pt-3 border-t border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desde</label>
                            <input
                                type="date"
                                name="startDate"
                                value={dateRange.startDate}
                                onChange={handleDateChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hasta</label>
                            <input
                                type="date"
                                name="endDate"
                                value={dateRange.endDate}
                                onChange={handleDateChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
