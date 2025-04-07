import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaCalendarAlt, FaMapMarkerAlt, FaBuilding, FaGlobe, FaSearch, FaFilter, FaSync, FaLaptopCode, FaChalkboardTeacher, FaTrophy, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';

// Create a custom axios instance for API calls
const apiClient = axios.create({
  baseURL: 'http://localhost:5001', 
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
});

// Sample event data for fallback use
const sampleEvents = [
  {
    id: '1',
    title: 'Cryptography Fundamentals Workshop',
    startDate: '2025-04-15T10:00:00.000Z',
    endDate: '2025-04-15T16:00:00.000Z',
    location: 'IIIT Delhi, New Delhi',
    description: 'An introductory workshop covering the basics of modern cryptography, including symmetric and asymmetric encryption, hash functions, and digital signatures.',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    organizerName: 'IIIT Delhi Cryptography Department',
    source: 'internal',
    eventType: 'workshop',
    externalUrl: ''
  },
  {
    id: '2',
    title: 'Blockchain Security Conference',
    startDate: '2025-05-20T09:00:00.000Z',
    endDate: '2025-05-22T18:00:00.000Z',
    location: 'Virtual Event',
    description: 'A three-day virtual conference focused on blockchain security, smart contract vulnerabilities, and decentralized finance (DeFi) security challenges.',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    organizerName: 'Blockchain Security Alliance',
    source: 'internal',
    eventType: 'conference',
    externalUrl: ''
  },
  {
    id: '3',
    title: 'Quantum Cryptography Symposium',
    startDate: '2025-06-10T08:30:00.000Z',
    endDate: '2025-06-11T17:00:00.000Z',
    location: 'India Habitat Centre, New Delhi',
    description: 'An exploration of quantum cryptography advancements and their implications for future security protocols. Leading researchers will present their latest findings.',
    imageUrl: 'https://via.placeholder.com/300x150?text=Quantum+Cryptography',
    organizerName: 'Indian Cryptographic Research Group',
    source: 'internal',
    eventType: 'symposium',
    externalUrl: ''
  },
  {
    id: '4',
    title: 'Ethical Hacking Bootcamp',
    startDate: '2025-04-05T09:00:00.000Z',
    endDate: '2025-04-09T18:00:00.000Z',
    location: 'Cyber Security Training Center, Bangalore',
    description: 'Intensive 5-day bootcamp on ethical hacking techniques, penetration testing, and security assessment methodologies.',
    imageUrl: 'https://via.placeholder.com/300x150?text=Ethical+Hacking',
    organizerName: 'CyberSec India',
    source: 'meetup',
    eventType: 'bootcamp',
    externalUrl: 'https://www.meetup.com/cybersec-india/events/123456789/'
  },
  {
    id: '5',
    title: 'Zero-Knowledge Proofs Workshop',
    startDate: '2025-07-12T10:00:00.000Z',
    endDate: '2025-07-12T16:00:00.000Z',
    location: 'IIT Mumbai, Mumbai',
    description: 'Technical workshop on implementing zero-knowledge proof systems for privacy-preserving applications and identity verification.',
    imageUrl: 'https://via.placeholder.com/300x150?text=ZK+Proofs',
    organizerName: 'Privacy Tech Foundation',
    source: 'infosec',
    eventType: 'workshop',
    externalUrl: 'https://infosecconference.org/zk-proofs-workshop'
  },
  {
    id: '6',
    title: 'Cybersecurity Summit 2025',
    startDate: '2025-09-25T08:00:00.000Z',
    endDate: '2025-09-27T18:00:00.000Z',
    location: 'Hyderabad International Convention Centre',
    description: 'India\'s largest cybersecurity conference featuring keynotes, technical sessions, and hands-on workshops covering the latest threats and defenses.',
    imageUrl: 'https://via.placeholder.com/300x150?text=Cybersecurity+Summit',
    organizerName: 'Indian Cybersecurity Alliance',
    source: 'eventbrite',
    eventType: 'summit',
    externalUrl: 'https://www.eventbrite.com/e/cybersecurity-summit-2025-tickets-987654321'
  }
];

const Events = () => {
  const [events, setEvents] = useState(sampleEvents); 
  const [filteredEvents, setFilteredEvents] = useState(sampleEvents);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [isFromApi, setIsFromApi] = useState(false);
  const [filters, setFilters] = useState({
    source: 'all',
    dateRange: 'upcoming',
    search: '',
    eventType: 'all'
  });
  const [eventTypeStats, setEventTypeStats] = useState({
    hackathon: 0,
    workshop: 0,
    conference: 0,
    competition: 0,
    other: 0
  });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching events from API...');
      
      const response = await apiClient.get('/api/events');
      console.log('API Response:', response.data);
      
      if (response.data && response.data.events && response.data.events.length > 0) {
        console.log('Events count:', response.data.events.length);
        setEvents(response.data.events);
        setFilteredEvents(response.data.events); 
        setIsFromApi(true);
        setError(null);
        
        if (response.data.meta && response.data.meta.types) {
          setEventTypeStats(response.data.meta.types);
        } else {
          const stats = {
            hackathon: 0,
            workshop: 0,
            conference: 0,
            competition: 0,
            other: 0
          };
          
          response.data.events.forEach(event => {
            const type = event.eventType || 'other';
            if (stats[type] !== undefined) {
              stats[type]++;
            } else {
              stats.other++;
            }
          });
          
          setEventTypeStats(stats);
        }
      } else {
        console.error('Invalid response format or empty events:', response.data);
        setIsFromApi(false);
        setError('Using sample data - API returned empty results');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Using sample data - Failed to load events from API');
      setIsFromApi(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    console.log('Applying filters:', filters);
    
    let filtered = [...events];
    
    if (filters.source !== 'all') {
      filtered = filtered.filter(event => event.source === filters.source);
    }
    
    if (filters.eventType !== 'all') {
      if (filters.eventType === 'other') {
        filtered = filtered.filter(event => 
          !['hackathon', 'workshop', 'conference', 'competition'].includes(event.eventType || '')
        );
      } else {
        filtered = filtered.filter(event => event.eventType === filters.eventType);
      }
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm) || 
        (event.description && event.description.toLowerCase().includes(searchTerm)) ||
        (event.location && event.location.toLowerCase().includes(searchTerm))
      );
    }
    
    const now = new Date();
    if (filters.dateRange === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.startDate) >= now);
    } else if (filters.dateRange === 'past') {
      filtered = filtered.filter(event => new Date(event.startDate) < now);
    }
    
    console.log('Filtered events:', filtered);
    setFilteredEvents(filtered);
  }, [events, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getEventTypeIcon = (eventType) => {
    switch(eventType) {
      case 'hackathon':
        return <FaLaptopCode />;
      case 'workshop':
        return <FaChalkboardTeacher />;
      case 'conference':
        return <FaUsers />;
      case 'competition':
        return <FaTrophy />;
      default:
        return <FaCalendarAlt />;
    }
  };

  const getEventTypeLabel = (eventType) => {
    switch(eventType) {
      case 'hackathon':
        return 'Hackathon';
      case 'workshop':
        return 'Workshop';
      case 'conference':
        return 'Conference';
      case 'competition':
        return 'Competition';
      case 'webinar':
        return 'Webinar';
      default:
        return 'Event';
    }
  };

  return (
    <EventsContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <EventsHeader>
        <h1>Cryptography & Security Events</h1>
        <p>Stay updated with the latest events in cryptography and security</p>
        {!isFromApi && error && (
          <DataSourceNote>
            {error}
            <RefreshButton onClick={fetchEvents}>
              <FaSync /> Try Again
            </RefreshButton>
          </DataSourceNote>
        )}
      </EventsHeader>
      
      <EventTypeFilters>
        <EventTypeButton 
          active={filters.eventType === 'all'} 
          onClick={() => handleFilterChange('eventType', 'all')}
        >
          <FaCalendarAlt />
          <span>All Events</span>
          <Count>{events.length}</Count>
        </EventTypeButton>
        
        <EventTypeButton 
          active={filters.eventType === 'hackathon'} 
          color="#3498db"
          onClick={() => handleFilterChange('eventType', 'hackathon')}
        >
          <FaLaptopCode />
          <span>Hackathons</span>
          <Count>{eventTypeStats.hackathon}</Count>
        </EventTypeButton>
        
        <EventTypeButton 
          active={filters.eventType === 'workshop'} 
          color="#2ecc71"
          onClick={() => handleFilterChange('eventType', 'workshop')}
        >
          <FaChalkboardTeacher />
          <span>Workshops</span>
          <Count>{eventTypeStats.workshop}</Count>
        </EventTypeButton>
        
        <EventTypeButton 
          active={filters.eventType === 'conference'} 
          color="#9b59b6"
          onClick={() => handleFilterChange('eventType', 'conference')}
        >
          <FaUsers />
          <span>Conferences</span>
          <Count>{eventTypeStats.conference}</Count>
        </EventTypeButton>
        
        <EventTypeButton 
          active={filters.eventType === 'competition'} 
          color="#e74c3c"
          onClick={() => handleFilterChange('eventType', 'competition')}
        >
          <FaTrophy />
          <span>Competitions</span>
          <Count>{eventTypeStats.competition}</Count>
        </EventTypeButton>
      </EventTypeFilters>
      
      <FiltersContainer>
        <FilterGroup>
          <FilterLabel>
            <FaFilter />
            <span>Source:</span>
          </FilterLabel>
          <FilterSelect 
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="internal">College Events</option>
            <option value="eventbrite">Eventbrite</option>
            <option value="knowafest">KnowaFest</option>
            <option value="infosec">InfoSec</option>
          </FilterSelect>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>
            <FaCalendarAlt />
            <span>When:</span>
          </FilterLabel>
          <FilterSelect 
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All Dates</option>
          </FilterSelect>
        </FilterGroup>
        
        <SearchContainer>
          <SearchInput 
            type="text"
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
        </SearchContainer>
      </FiltersContainer>
      
      {loading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <p>Loading events...</p>
        </LoadingContainer>
      ) : filteredEvents.length === 0 ? (
        <NoEventsMessage>
          <FaCalendarAlt size={40} />
          <h3>No events found</h3>
          <p>Try adjusting your filters or check back later for new events.</p>
        </NoEventsMessage>
      ) : (
        <EventsGrid>
          {filteredEvents.map((event) => (
            <EventCard 
              key={event._id || event.id}
              whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}
            >
              <EventImageContainer>
                <EventImage src={event.imageUrl || 'https://via.placeholder.com/300x150?text=Event'} alt={event.title} />
                <EventSource isInternal={event.source === 'internal'}>
                  {event.source === 'internal' ? 'College Event' : event.source}
                </EventSource>
                <EventTypeTag type={event.eventType || 'event'}>
                  {getEventTypeIcon(event.eventType)}
                  <span>{getEventTypeLabel(event.eventType)}</span>
                </EventTypeTag>
              </EventImageContainer>
              
              <EventContent>
                <EventTitle>{event.title}</EventTitle>
                <EventDate>
                  <FaCalendarAlt />
                  <span>{formatDate(event.startDate)}</span>
                </EventDate>
                
                <EventLocation>
                  <FaMapMarkerAlt />
                  <span>{event.location || 'Virtual Event'}</span>
                </EventLocation>
                
                <EventOrganizer>
                  <FaBuilding />
                  <span>{event.organizerName || 'Unknown Organizer'}</span>
                </EventOrganizer>
                
                <EventDescription>
                  {event.description?.substring(0, 120)}
                  {event.description?.length > 120 ? '...' : ''}
                </EventDescription>
                
                {event.externalUrl && (
                  <EventLink href={event.externalUrl} target="_blank" rel="noopener noreferrer">
                    <FaGlobe />
                    <span>View Details</span>
                  </EventLink>
                )}
              </EventContent>
            </EventCard>
          ))}
        </EventsGrid>
      )}
    </EventsContainer>
  );
};

const EventsContainer = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const EventsHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  flex-grow: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 10px;
  color: ${({ theme }) => theme.colors.primary};
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const EventCard = styled(motion.div)`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
`;

const EventImageContainer = styled.div`
  position: relative;
  height: 150px;
`;

const EventImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const EventSource = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: ${props => props.isInternal ? '#4f46e5' : '#e5464f'};
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const EventTypeTag = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  background: ${({ type }) => {
    switch(type) {
      case 'hackathon': return 'rgba(52, 152, 219, 0.85)';
      case 'workshop': return 'rgba(46, 204, 113, 0.85)';
      case 'conference': return 'rgba(155, 89, 182, 0.85)';
      case 'competition': return 'rgba(231, 76, 60, 0.85)';
      default: return 'rgba(52, 73, 94, 0.85)';
    }
  }};
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const EventTypeFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const EventTypeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background-color: ${({ active, color }) => active ? (color || '#3498db') : '#f5f5f5'};
  color: ${({ active }) => active ? 'white' : '#333'};
  font-size: 14px;
  font-weight: ${({ active }) => active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ color, active }) => active ? (color || '#3498db') : '#e0e0e0'};
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 16px;
  }
`;

const Count = styled.span`
  background-color: rgba(255, 255, 255, ${props => props.active ? '0.3' : '0.2'});
  color: ${props => props.active ? 'white' : 'inherit'};
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 12px;
  margin-left: 5px;
`;

const EventContent = styled.div`
  padding: 1.5rem;
`;

const EventTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const EventDate = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
  
  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EventLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
  
  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EventOrganizer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
  
  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EventDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1.5rem;
`;

const EventLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.3s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const NoEventsMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  
  h3 {
    margin: 1rem 0;
    color: ${({ theme }) => theme.colors.primary};
  }
  
  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DataSourceNote = styled.div`
  background-color: #fff3e0;
  color: #e65100;
  padding: 10px 15px;
  border-radius: 4px;
  margin-top: 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const RefreshButton = styled.button`
  background-color: #e65100;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #bf360c;
  }
  
  svg {
    font-size: 12px;
  }
`;

export default Events;