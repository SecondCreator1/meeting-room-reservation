document.addEventListener('DOMContentLoaded', () => {
    const token = window.app.getToken();
    if (!token) {
      window.location.href = '../auth/login.html';
      return;
    }
    
    const bookingsTableBody = document.getElementById('bookings-table-body');
    const newBookingForm = document.getElementById('new-booking-form');
    const bookingRoomSelect = document.getElementById('booking-room');
    const messageDiv = document.getElementById('message');
    
    // Check if we have a room ID in the URL (coming from Rooms page)
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    // Load data
    loadRooms();
    loadBookings();
    
    // Handle form submission
    newBookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const bookingData = {
        room_id: parseInt(bookingRoomSelect.value),
        start_time: document.getElementById('booking-start').value + ':00Z',
        end_time: document.getElementById('booking-end').value + ':00Z'
      };
      
      try {
        const response = await fetch(`${window.app.API_BASE.reservation}/reservations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });
        
        if (response.ok) {
          const newBooking = await response.json();
          showMessage('Room booked successfully!', 'success');
          newBookingForm.reset();
          loadBookings();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to book room');
        }
      } catch (error) {
        showMessage(error.message, 'error');
      }
    });
    
    // Set up logout link
    document.getElementById('logout-link').addEventListener('click', window.app.handleLogout);
    
    async function loadRooms() {
      try {
        const response = await fetch(`${window.app.API_BASE.room}/rooms`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const rooms = await response.json();
          renderRoomOptions(rooms);
          
          // If we came from the Rooms page with a specific room selected
          if (roomId) {
            bookingRoomSelect.value = roomId;
          }
        } else {
          throw new Error('Failed to load rooms');
        }
      } catch (error) {
        showMessage(error.message, 'error');
      }
    }
    
    function renderRoomOptions(rooms) {
      bookingRoomSelect.innerHTML = '<option value="">Select a room</option>';
      
      rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.name} (Capacity: ${room.capacity})`;
        bookingRoomSelect.appendChild(option);
      });
    }
    
    async function loadBookings() {
      try {
        const response = await fetch(`${window.app.API_BASE.reservation}/reservations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const bookings = await response.json();
          renderBookings(bookings);
        } else {
          throw new Error('Failed to load bookings');
        }
      } catch (error) {
        showMessage(error.message, 'error');
      }
    }
    
    function renderBookings(bookings) {
      bookingsTableBody.innerHTML = '';
      
      if (bookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="4">No bookings found</td></tr>';
        return;
      }
      
      // We need to get room names for each booking
      Promise.all(bookings.map(async booking => {
        try {
          const response = await fetch(`${window.app.API_BASE.room}/rooms/${booking.room_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const room = await response.json();
            return { ...booking, room_name: room.name };
          }
          return { ...booking, room_name: `Room ${booking.room_id}` };
        } catch (error) {
          return { ...booking, room_name: `Room ${booking.room_id}` };
        }
      })).then(bookingsWithRoomNames => {
        bookingsWithRoomNames.forEach(booking => {
          const row = document.createElement('tr');
          
          const startTime = new Date(booking.start_time);
          const endTime = new Date(booking.end_time);
          
          row.innerHTML = `
            <td>${booking.room_name}</td>
            <td>${formatDateTime(startTime)}</td>
            <td>${formatDateTime(endTime)}</td>
            <td>
              <button class="btn-cancel" data-booking-id="${booking.id}">Cancel</button>
            </td>
          `;
          
          bookingsTableBody.appendChild(row);
        });
        
        // Add event listeners to cancel buttons
        document.querySelectorAll('.btn-cancel').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const bookingId = e.target.getAttribute('data-booking-id');
            if (confirm('Are you sure you want to cancel this booking?')) {
              try {
                const response = await fetch(`${window.app.API_BASE.reservation}/reservations/${bookingId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (response.ok) {
                  showMessage('Booking cancelled successfully!', 'success');
                  loadBookings();
                } else {
                  throw new Error('Failed to cancel booking');
                }
              } catch (error) {
                showMessage(error.message, 'error');
              }
            }
          });
        });
      });
    }
    
    function formatDateTime(date) {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    function showMessage(message, type) {
      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type}`;
      
      setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
      }, 5000);
    }
  });