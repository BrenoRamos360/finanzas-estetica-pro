import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const { user } = useAuth();

    // Initialize state with empty arrays or default values
    const [transactions, setTransactions] = useState([]);
    const [fixedExpenses, setFixedExpenses] = useState([]);

    // Default Categories
    const defaultCategories = {
        income: ['Servicios', 'Productos', 'Cursos', 'Otros'],
        expense: ['Alquiler', 'Insumos', 'Productos', 'Luz', 'Salarios', 'Marketing', 'Impuestos', 'Servicios Públicos', 'Personal', 'Otros']
    };

    const [categories, setCategories] = useState(defaultCategories);

    // Load data when user changes (Real-time Sync)
    useEffect(() => {
        if (user) {
            // Transactions Listener
            const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.id));
            const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
                const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort by date descending (optional, but good for UI)
                transData.sort((a, b) => new Date(b.date) - new Date(a.date));
                setTransactions(transData);
            });

            // Fixed Expenses Listener
            const qFixed = query(collection(db, 'fixedExpenses'), where('userId', '==', user.id));
            const unsubscribeFixed = onSnapshot(qFixed, (snapshot) => {
                const fixedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFixedExpenses(fixedData);
            });

            // Categories Listener (Optional: if we want custom categories per user)
            // For now, we'll keep categories local/default or implement basic sync later if needed.
            // Let's stick to default for simplicity unless requested.

            return () => {
                unsubscribeTransactions();
                unsubscribeFixed();
            };
        } else {
            // Clear data on logout
            setTransactions([]);
            setFixedExpenses([]);
            setCategories(defaultCategories);
        }
    }, [user]);

    // We don't need useEffect to SAVE data anymore, we do it directly in the functions.

    const addTransaction = async (transaction) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'transactions'), {
                ...transaction,
                userId: user.id,
                createdAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error adding transaction: ", e);
        }
    };

    const removeTransaction = async (id) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'transactions', id));
        } catch (e) {
            console.error("Error deleting transaction: ", e);
        }
    };

    const addFixedExpense = async (expense) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'fixedExpenses'), {
                ...expense,
                userId: user.id
            });
        } catch (e) {
            console.error("Error adding fixed expense: ", e);
        }
    };

    const removeFixedExpense = async (id) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'fixedExpenses', id));
        } catch (e) {
            console.error("Error deleting fixed expense: ", e);
        }
    };

    const updateFixedExpense = async (id, updatedExpense) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'fixedExpenses', id), updatedExpense);
        } catch (e) {
            console.error("Error updating fixed expense: ", e);
        }
    };

    const addCategory = (type, category) => {
        // Local state only for now, or implement Firestore sync if critical
        setCategories(prev => ({
            ...prev,
            [type]: [...prev[type], category]
        }));
    };

    const removeCategory = (type, category) => {
        // Local state only for now
        setCategories(prev => ({
            ...prev,
            [type]: prev[type].filter(c => c !== category)
        }));
    };

    const editTransaction = async (updatedTransaction) => {
        if (!user) return;
        try {
            const { id, ...data } = updatedTransaction;
            await updateDoc(doc(db, 'transactions', id), data);
        } catch (e) {
            console.error("Error updating transaction: ", e);
        }
    };

    const processFixedExpense = (expense, actualAmount, date) => {
        addTransaction({
            description: expense.description,
            amount: parseFloat(actualAmount),
            type: 'expense',
            date: date,
            category: 'Fijos',
            status: 'paid', // Usually fixed expenses are paid immediately when processed
            paymentMethod: 'Efectivo', // Default, can be changed later if needed
            fixedExpenseId: expense.id // Link to the fixed expense definition
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
            updateFixedExpense,
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
