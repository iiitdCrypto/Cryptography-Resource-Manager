import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCalendarAlt, FaPlus, FaExclamationCircle } from 'react-icons/fa';
import AddEvent from './AddEvent';
import axios from 'axios';

const DashboardEvents = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'x-auth-token': token
      }
    };
  };

  useEffect(() => {
    // Check server status first
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if server is available
        try {
          const healthCheck = await axios.get('/api/health');
          
          if (healthCheck.data.status === 'ok') {
            console.log('Server is available, fetching events');
            const response = await axios.get('/api/events', getAuthHeader());
            setEvents(response.data);
          } else {
            console.log('Server reported issues, using mock data');
            loadMockData();
          }
        } catch (serverError) {
          console.error('Server health check failed, using mock data:', serverError);
          loadMockData();
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Mock data fallback
  const loadMockData = () => {
    const mockEvents = [
      {
        id: 1,
        title: 'International Cryptography Conference',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Virtual Event',
        organizerName: 'International Association for Cryptologic Research',
        eventType: 'Conference',
        description: 'Annual conference covering latest advances in cryptographic research.',
        imageUrl: 'https://via.placeholder.com/300x200?text=Crypto+Conference'
      },
      {
        id: 2,
        title: 'Blockchain Security Workshop',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'IIIT Delhi',
        organizerName: 'Cryptography Research Group',
        eventType: 'Workshop',
        description: 'Hands-on workshop exploring blockchain security mechanisms.',
        imageUrl: 'https://via.placeholder.com/300x200?text=Blockchain+Workshop'
      }
    ];
    
    setEvents(mockEvents);
  };

  const handleEventAdded = (newEvent) => {
    setEvents(prev => [...prev, newEvent]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    return date.toLocaleString();
  };

  return (
    <DashboardContainer>
      <Header>
        <div>
          <h1>Events Management</h1>
          <p>View and manage cryptography events</p>
        </div>
        <AddButton onClick={() => setShowAddModal(true)}>
          <FaPlus />
          <span>Add Event</span>
        </AddButton>
      </Header>

      {loading ? (
        <LoadingMessage>
          <Spinner />
          <span>Loading events...</span>
        </LoadingMessage>
      ) : error ? (
        <ErrorMessage>
          <FaExclamationCircle />
          <span>{error}</span>
        </ErrorMessage>
      ) : events.length === 0 ? (
        <ComingSoonMessage>
          <FaCalendarAlt />
          <h2>No Events Yet</h2>
          <p>Click the Add Event button to create your first event.</p>
        </ComingSoonMessage>
      ) : (
        <EventsGrid>
          {events.map(event => (
            <EventCard key={event.id}>
              {event.imageUrl && (
                <EventImage src={event.imageUrl} alt={event.title} />
              )}
              <EventContent>
                <EventTitle>{event.title}</EventTitle>
                <EventType>{event.eventType || 'Event'}</EventType>
                <EventMeta>
                  <MetaItem>
                    <FaCalendarAlt />
                    <span>Start: {formatDate(event.startDate)}</span>
                  </MetaItem>
                  <MetaItem>
                    <FaCalendarAlt />
                    <span>End: {formatDate(event.endDate)}</span>
                  </MetaItem>
                </EventMeta>
                <EventDescription>{event.description || 'No description available'}</EventDescription>
                <EventLocation>
                  <strong>Location:</strong> {event.location || 'Not specified'}
                </EventLocation>
                <EventOrganizer>
                  <strong>Organizer:</strong> {event.organizerName || 'Not specified'}
                </EventOrganizer>
              </EventContent>
            </EventCard>
          ))}
        </EventsGrid>
      )}

      {showAddModal && (
        <AddEvent 
          onClose={() => setShowAddModal(false)}
          onEventAdded={handleEventAdded}
        />
      )}
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 1rem;
  }
`;

const ComingSoonMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  
  svg {
    font-size: 3rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const EventCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const EventImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
`;

const EventContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EventTitle = styled.h3`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const EventType = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const EventMeta = styled.div`
  margin-bottom: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  
  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EventDescription = styled.p`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
  flex: 1;
`;

const EventLocation = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
`;

const EventOrganizer = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: ${({ theme }) => `${theme.colors.error}10`};
  color: ${({ theme }) => theme.colors.error};
  border-radius: 4px;

  svg {
    font-size: 1.2rem;
  }
`;

export default DashboardEvents;