import api from '@/lib/api';
import { Booking, BookingCreate, BookingUpdate } from '@/types/booking';

export const bookingService = {
    /**
     * Get bookings for the current user (as student or expert)
     */
    getBookings: async (skip = 0, limit = 100): Promise<Booking[]> => {
        const response = await api.get('bookings/', {
            params: { skip, limit }
        });
        return response.data;
    },

    /**
     * Create a new booking
     */
    createBooking: async (data: BookingCreate): Promise<Booking> => {
        const response = await api.post('bookings/', data);
        return response.data;
    },

    /**
     * Update booking status or details
     */
    updateBooking: async (id: number, data: BookingUpdate): Promise<Booking> => {
        const response = await api.put(`bookings/${id}`, data);
        return response.data;
    },

    /**
     * Check-in for a session
     */
    checkin: async (id: number): Promise<Booking> => {
        const response = await api.post(`bookings/${id}/checkin`);
        return response.data;
    },

    /**
     * Resolve no-show for a session
     */
    resolveNoshow: async (id: number): Promise<Booking> => {
        const response = await api.post(`bookings/${id}/resolve-noshow`);
        return response.data;
    }
};
