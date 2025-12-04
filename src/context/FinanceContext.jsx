import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const { user } = useAuth();

    // Initialize state with empty arrays or default values
    // We will load the actual user data in a useEffect when 'user' changes
    const [transactions, setTransactions] = useState([]);
    const [fixedExpenses, setFixedExpenses] = useState([]);

    // Default Categories
    const defaultCategories = {
        income: ['Servicios', 'Productos', 'Cursos', 'Otros'],
        expense: ['Alquiler', 'Insumos', 'Marketing', 'Impuestos', 'Servicios Públicos', 'Personal', 'Otros']
    };

    const [categories, setCategories] = useState(defaultCategories);

    // Load data when user changes
    useEffect(() => {
        if (user) {
            const userTransactions = localStorage.getItem(`transactions_${user.id}`);
            const userFixedExpenses = localStorage.getItem(`fixedExpenses_${user.id}`);
            const userCategories = localStorage.getItem(`categories_${user.id}`);

            if (userTransactions) {
                setTransactions(JSON.parse(userTransactions));
            } else {
                // Default data for new users? Or empty? Let's give them empty for now, or the demo data if it's a demo user.
                // Let's start fresh for new users to avoid confusion.
                setTransactions([]);
            }

            if (userFixedExpenses) {
                setFixedExpenses(JSON.parse(userFixedExpenses));
            } else {
                setFixedExpenses([]);
            }

            if (userCategories) {
                setCategories(JSON.parse(userCategories));
            } else {
                setCategories(defaultCategories);
            }
        } else {
            // Clear data on logout
            setTransactions([]);
            setFixedExpenses([]);
            setCategories(defaultCategories);
        }
    }, [user]);

    // Save data when it changes (only if user is logged in)
    useEffect(() => {
        if (user) {
            localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));
        }
    }, [transactions, user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`fixedExpenses_${user.id}`, JSON.stringify(fixedExpenses));
        }
    }, [fixedExpenses, user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`categories_${user.id}`, JSON.stringify(categories));
        }
    }, [categories, user]);

    const addTransaction = (transaction) => {
        setTransactions(prev => [{ ...transaction, id: Date.now(), status: transaction.status || 'paid' }, ...prev]);
    };

    const removeTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const addFixedExpense = (expense) => {
        setFixedExpenses(prev => [{ ...expense, id: Date.now() }, ...prev]);
    };

    const removeFixedExpense = (id) => {
        setFixedExpenses(prev => prev.filter(e => e.id !== id));
    };

    const addCategory = (type, category) => {
        setCategories(prev => ({
            ...prev,
            [type]: [...prev[type], category]
        }));
    };

    const removeCategory = (type, category) => {
        setCategories(prev => ({
            ...prev,
            [type]: prev[type].filter(c => c !== category)
        }));
    };

    const editTransaction = (updatedTransaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    };

    const processFixedExpense = (expense) => {
        const today = new Date().toISOString().split('T')[0];
        addTransaction({
            description: expense.description,
            amount: expense.amount,
            type: 'expense',
            date: today,
            category: 'Fijos',
            status: 'pending'
        });
    };

    // --- Date Range Filtering ---
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('en-CA')
    });

    const getFilteredTransactions = () => {
        return transactions.filter(t => {
            return t.date >= dateRange.startDate && t.date <= dateRange.endDate;
        });
    };

    // --- Metrics Calculations (Based on Date Range) ---

    const filteredTransactions = getFilteredTransactions();

    // GLOBAL Balance (All time)
    const balance = transactions.reduce((acc, curr) => {
        if (curr.status === 'pending') return acc;
        return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);

    // GLOBAL Projected (All time)
    const projectedBalance = transactions.reduce((acc, curr) => {
        return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);

    // PERIOD Metrics (Based on Date Range)
    const periodIncome = filteredTransactions
        .filter(t => t.type === 'income' && t.status === 'paid')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const periodExpenses = filteredTransactions
        .filter(t => t.type === 'expense' && t.status === 'paid')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const periodPendingIncome = filteredTransactions
        .filter(t => t.type === 'income' && t.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const periodPendingExpenses = filteredTransactions
        .filter(t => t.type === 'expense' && t.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0);

    // --- Previous Period Metrics ---
    const getPreviousPeriod = () => {
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        const duration = end - start;

        const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
        const prevStart = new Date(prevEnd.getTime() - duration);

        return {
            startDate: prevStart.toLocaleDateString('en-CA'),
            endDate: prevEnd.toLocaleDateString('en-CA')
        };
    };

    const prevPeriod = getPreviousPeriod();
    const prevPeriodTransactions = transactions.filter(t =>
        t.date >= prevPeriod.startDate && t.date <= prevPeriod.endDate
    );

    const prevPeriodIncome = prevPeriodTransactions
        .filter(t => t.type === 'income' && t.status === 'paid')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const prevPeriodExpenses = prevPeriodTransactions
        .filter(t => t.type === 'expense' && t.status === 'paid')
        .reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <FinanceContext.Provider value={{
            transactions,
            addTransaction,
            removeTransaction,
            fixedExpenses,
            addFixedExpense,
            removeFixedExpense,
            processFixedExpense,
            editTransaction,
            // Global
            balance,
            projectedBalance,
            // Date Range
            dateRange,
            setDateRange,
            filteredTransactions,
            // Period Metrics
            periodIncome,
            periodExpenses,
            periodPendingIncome,
            periodPendingExpenses,
            // Legacy support
            income: periodIncome,
            expenses: periodExpenses,
            pendingIncome: periodPendingIncome,
            pendingExpenses: periodPendingExpenses,
            // Previous Period Metrics
            prevPeriodIncome,
            prevPeriodExpenses,
            // Categories
            categories,
            addCategory,
            removeCategory
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
