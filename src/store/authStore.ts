import { create } from 'zustand';
import { api } from '../lib/api';
import type { User, Pet } from '../types';

interface AuthState {
    user: User | null;
    currentPet: Pet | null;
    pets: Pet[];
    hasPet: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ hasPet: boolean }>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchMe: () => Promise<void>;
    setCurrentPet: (pet: Pet) => void;
    fetchMyPets: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    currentPet: null,
    pets: [],
    hasPet: false,
    isAuthenticated: false,
    isLoading: false,

    login: async (email: string, password: string) => {
        const response = await api.post<{
            success: boolean;
            data: { user: User; petId?: number };
        }>('/auth/login', { email, password });

        const newUser = response.data.user;
        set({ user: newUser, isAuthenticated: true });

        await get().fetchMyPets();

        const hasPet = get().pets.length > 0;
        set({ hasPet });

        return { hasPet };
    },

    register: async (name: string, email: string, password: string) => {
        await api.post('/auth/register', { name, email, password });
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('selectedPetId');
        set({
            user: null,
            currentPet: null,
            pets: [],
            hasPet: false,
            isAuthenticated: false,
        });
    },

    fetchMe: async () => {
        try {
            set({ isLoading: true });
            const response = await api.get<{
                message: string;
                petId: number;
                user: { id: number; name: string; email: string };
            }>('/me');

            const userData: User = {
                id: response.user.id,
                name: response.user.name || '',
                email: response.user.email || '',
            };

            set({
                user: userData,
                isAuthenticated: true,
                isLoading: false,
            });

            await get().fetchMyPets();

            const hasPet = get().pets.length > 0;
            set({ hasPet });
        } catch (error) {
            set({
                isAuthenticated: false,
                user: null,
                currentPet: null,
                pets: [],
                hasPet: false,
                isLoading: false,
            });
        }
    },

    setCurrentPet: (pet: Pet) => {
        set({ currentPet: pet });
        localStorage.setItem('selectedPetId', String(pet.id));
    },

    fetchMyPets: async () => {
        try {
            const response = await api.get<Pet[]>('/pets/me');

            set({ pets: response });
            if (response.length > 0 && !get().currentPet) {
                const savedId = localStorage.getItem('selectedPetId');
                const savedPet = savedId
                    ? response.find((p) => p.id === Number(savedId))
                    : null;
                set({
                    currentPet: savedPet || response[0],
                    hasPet: true,
                });
            }
        } catch {
            set({ pets: [], hasPet: false });
        }
    },
}));
