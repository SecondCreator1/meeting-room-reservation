document.addEventListener('DOMContentLoaded', () => {
    const token = window.app.getToken();
    if (!token) {
      window.location.href = '../auth/login.html';
      return;
    }
    
    const roomsTableBody = document.getElementById('rooms-table-body');
    const addRoomForm = document.getElementById('add-room-form');
    const messageDiv = document.getElementById('message');
    
    // Load rooms on page load
    loadRooms();
    
    // Handle form submission
    addRoomForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const roomData = {
        name: document.getElementById('room-name').value,
        capacity: parseInt(document.getElementById('room-capacity').value),
        equipment: document.getElementById('room-equipment').value || null
      };
      
      try {
        const response = await fetch(`${window.app.API_BASE.room}/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(roomData)
        });
        
        if (response.ok) {
          const newRoom = await response.json();
          showMessage('Room added successfully!', 'success');
          addRoomForm.reset();
          loadRooms();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add room');
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
          renderRooms(rooms);
        } else {
          throw new Error('Failed to load rooms');
        }
      } catch (error) {
        showMessage(error.message, 'error');
      }
    }
    
    function renderRooms(rooms) {
      roomsTableBody.innerHTML = '';
      
      if (rooms.length === 0) {
        roomsTableBody.innerHTML = '<tr><td colspan="4">No rooms available</td></tr>';
        return;
      }
      
      rooms.forEach(room => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${room.name}</td>
          <td>${room.capacity}</td>
          <td>${room.equipment || 'None'}</td>
          <td>
            <button class="btn-book" data-room-id="${room.id}">Book</button>
            ${window.app.currentUser()?.role === 'Admin' ? 
              `<button class="btn-delete" data-room-id="${room.id}">Delete</button>` : ''}
          </td>
        `;
        
        roomsTableBody.appendChild(row);
      });
      
      // Add event listeners to book buttons
      document.querySelectorAll('.btn-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const roomId = e.target.getAttribute('data-room-id');
          window.location.href = `../reservations/reservations.html?room=${roomId}`;
        });
      });
      
      // Add event listeners to delete buttons (for admins)
      if (window.app.currentUser()?.role === 'Admin') {
        document.querySelectorAll('.btn-delete').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const roomId = e.target.getAttribute('data-room-id');
            if (confirm('Are you sure you want to delete this room?')) {
              try {
                const response = await fetch(`${window.app.API_BASE.room}/rooms/${roomId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (response.ok) {
                  showMessage('Room deleted successfully!', 'success');
                  loadRooms();
                } else {
                  throw new Error('Failed to delete room');
                }
              } catch (error) {
                showMessage(error.message, 'error');
              }
            }
          });
        });
      }
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