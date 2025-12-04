import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for saved user session
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = (username, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!username || !password) {
                    reject('Usuario y contraseña requeridos');
                    return;
                }

                const cleanUsername = username.trim();
                const userId = cleanUsername.toLowerCase().replace(/\s+/g, '_');

                // Get existing users database
                const usersDb = JSON.parse(localStorage.getItem('users_db') || '{}');

                if (usersDb[userId]) {
                    // User exists, check password
                    if (usersDb[userId].password === password) {
                        const user = usersDb[userId];
                        localStorage.setItem('currentUser', JSON.stringify(user));
                        setUser(user);
                        resolve(user);
                    } else {
                        reject('Contraseña incorrecta');
                    }
                } else {
                    // New user, register them
                    const newUser = {
                        id: userId,
                        name: cleanUsername,
                        email: `${userId}@example.com`,
                        password: password // In a real app, never store plain passwords!
                    };

                    usersDb[userId] = newUser;
                    localStorage.setItem('users_db', JSON.stringify(usersDb));

                    localStorage.setItem('currentUser', JSON.stringify(newUser));
                    setUser(newUser);
                    resolve(newUser);
                }
            }, 500);
        });
    };

    const logout = () => {
        localStorage.removeItem('currentUser');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
