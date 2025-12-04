import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Map Firebase user to our app's user structure
                setUser({
                    id: currentUser.uid,
                    name: currentUser.displayName || currentUser.email.split('@')[0],
                    email: currentUser.email
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (username, password) => {
        // We need an email for Firebase. Since we used "username" before,
        // we'll construct a fake email if it's not one, or ask user to migrate.
        // For simplicity/speed, let's assume username is email or append a domain.
        // BETTER: Let's assume the input IS the email for now, or append @app.com

        const email = username.includes('@') ? username : `${username}@finanzas.pro`;

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            // If user not found, try to register automatically (legacy behavior support)
            // OR return error. Let's try to register if it's a "user-not-found" to keep the "easy entry" feel
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                // Try to create account
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(userCredential.user, {
                        displayName: username
                    });
                } catch (createError) {
                    throw createError;
                }
            } else {
                throw error;
            }
        }
    };

    const logout = () => {
        return signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
