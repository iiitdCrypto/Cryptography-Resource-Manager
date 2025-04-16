import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/events');
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const categorizeEvents = () => {
    const now = new Date();
    const ongoing = [];
    const upcoming = [];
    const completed = [];

    events.forEach(event => {
      const eventDate = new Date(event.date);
      const [startTime, endTime] = (event.time || '').split('-');
      const eventStartTime = startTime ? new Date(`${event.date} ${startTime}`) : eventDate;
      const eventEndTime = endTime ? new Date(`${event.date} ${endTime}`) : eventDate;

      if (now >= eventStartTime && now <= eventEndTime) {
        ongoing.push(event);
      } else if (now < eventStartTime) {
        upcoming.push(event);
      } else {
        completed.push(event);
      }
    });

    return { ongoing, upcoming, completed };
  };

  const renderEventSection = (title, events) => (
    <SectionContainer>
      <SectionTitle>{title}</SectionTitle>
      <EventsGrid>
        {events.map(event => (
          <EventCard key={event._id}>
            <EventImage src={event.thumbnail || 'default-event-image.jpg'} alt={event.title} />
            <EventContent>
              <EventTitle>{event.title}</EventTitle>
              <EventInfo>
                <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {event.time}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Organizer:</strong> {event.organizerName}</p>
                <p><strong>Event Type:</strong> {event.eventType}</p>
              </EventInfo>
              <EventDescription>{event.description}</EventDescription>
            </EventContent>
          </EventCard>
        ))}
      </EventsGrid>
    </SectionContainer>
  );

  if (loading) return <div>Loading events...</div>;

  const { ongoing, upcoming, completed } = categorizeEvents();

  return (
    <EventsContainer>
      <EventsHeader>
        <h1>Cryptography Events</h1>
        <p>All cryptography events</p>
      </EventsHeader>

      {ongoing.length > 0 && renderEventSection('Ongoing Events', ongoing)}
      {upcoming.length > 0 && renderEventSection('Upcoming Events', upcoming)}
      {completed.length > 0 && renderEventSection('Completed Events', completed)}
    </EventsContainer>
  );
};

const EventsContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const EventsHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }

  p {
    color: ${({ theme }) => theme.colors.textLight};
    font-size: 1.2rem;
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem;
`;

const EventCard = styled.div`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const EventImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const EventContent = styled.div`
  padding: 1.5rem;
`;

const EventTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
`;

const EventInfo = styled.div`
  margin-bottom: 1rem;

  p {
    margin: 0.2rem 0;
  }
`;

const EventDescription = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1.5rem;
`;

const EventSection = styled.div`
  margin-bottom: 3rem;
`;

const SectionContainer = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 2rem;
  font-size: 2rem;
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
`;

export default Events;