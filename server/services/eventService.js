const axios = require('axios');
const { executeQuery, executeTransaction } = require('../config/db');
const { format, parseISO, addDays } = require('date-fns');

/**
 * Fetch external events related to cryptology, cryptography, and cryptanalysis
 * @param {string} source Optional source filter
 * @returns {Promise<Array>} Array of events
 */
async function getExternalEvents(source) {
  try {
    let events = [];
    
    if (!source || source === 'iacr') {
      const iacrEvents = await getIACREvents();
      events = [...events, ...iacrEvents];
    }
    
    if (!source || source === 'cryptologyconference') {
      const cryptologyEvents = await getCryptologyConferenceEvents();
      events = [...events, ...cryptologyEvents];
    }
    
    if (!source || source === 'eventbrite') {
      const eventbriteEvents = await getEventbriteEvents();
      events = [...events, ...eventbriteEvents];
    }
    
    if (!source || source === 'defcon') {
      const defconEvents = await getDefconEvents();
      events = [...events, ...defconEvents];
    }
    
    return events;
  } catch (error) {
    console.error('Error fetching external events:', error.message);
    return [];
  }
}

/**
 * Import external events to database
 * @param {string} source Source filter
 * @param {number} userId User ID who initiated the import
 * @returns {Promise<Object>} Import results
 */
async function importExternalEvents(source, userId) {
  try {
    const events = await getExternalEvents(source);
    if (!events.length) {
      return { 
        success: false, 
        message: 'कोई इवेंट नहीं मिला' 
      };
    }

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        // Check if event already exists to avoid duplicates
        const existingEvents = await executeQuery(
          `SELECT id FROM events WHERE title = ? AND start_datetime = ?`,
          [event.title, new Date(event.startDate)]
        );

        if (existingEvents.length > 0) {
          skippedCount++;
          continue;
        }

        // Insert event into database with updated schema
        await executeQuery(
          `INSERT INTO events (
            title, description, short_description, location, is_online, 
            start_datetime, end_datetime, timezone, image_url, registration_url,
            organizer_name, organizer_email, event_type, is_featured, status, 
            created_by, created_at, updated_at, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
          [
            event.title,
            event.description,
            event.description.length > 200 ? event.description.substring(0, 197) + '...' : event.description,
            event.location,
            event.location.toLowerCase().includes('online') || event.location.toLowerCase().includes('virtual'),
            new Date(event.startDate),
            new Date(event.endDate),
            'UTC',
            event.imageUrl,
            event.registrationUrl,
            event.organizerName,
            '',  // No organizer email in external events
            event.category,
            false, // Not featured by default
            'scheduled',
            userId,
            JSON.stringify(["imported", source, event.category])
          ]
        );
        
        addedCount++;
      } catch (error) {
        console.error(`Error importing event '${event.title}':`, error.message);
        errorCount++;
      }
    }

    // Create an audit log entry for this import
    await executeQuery(
      `INSERT INTO audit_logs (
        user_id, action_type, entity_type, entity_id, 
        new_value, ip_address, success, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        'CREATE',
        'EVENT',
        0,  // No specific entity ID
        JSON.stringify({ source, added: addedCount, skipped: skippedCount, errors: errorCount }),
        '', // No IP address available
        true,
        `${addedCount} इवेंट्स को आयात किया गया, ${skippedCount} छोड़े गए, ${errorCount} त्रुटियां`
      ]
    );

    return {
      success: true,
      added: addedCount,
      skipped: skippedCount,
      errors: errorCount,
      message: `${addedCount} इवेंट्स को आयात किया गया, ${skippedCount} छोड़े गए, ${errorCount} त्रुटियां`
    };
  } catch (error) {
    console.error('Error in importExternalEvents:', error.message);
    return { 
      success: false, 
      message: `इवेंट्स आयात करने में त्रुटि: ${error.message}` 
    };
  }
}

/**
 * Create a new event
 * @param {Object} eventData Event data
 * @param {number} userId User ID who is creating the event
 * @returns {Promise<Object>} Created event
 */
async function createEvent(eventData, userId) {
  try {
    // Validate required fields
    if (!eventData.title || !eventData.start_datetime) {
      throw new Error('शीर्षक और प्रारंभ तिथि आवश्यक हैं');
    }

    // Set end date to start date + 1 day if not provided
    if (!eventData.end_datetime) {
      eventData.end_datetime = addDays(parseISO(eventData.start_datetime), 1);
    }

    // Set default values for optional fields
    const data = {
      ...eventData,
      short_description: eventData.short_description || (eventData.description ? (
        eventData.description.length > 200 ? 
        eventData.description.substring(0, 197) + '...' : 
        eventData.description
      ) : ''),
      is_online: eventData.is_online || false,
      timezone: eventData.timezone || 'UTC',
      status: eventData.status || 'draft',
      is_featured: eventData.is_featured || false,
      event_type: eventData.event_type || 'workshop',
      created_by: userId,
      tags: eventData.tags ? JSON.stringify(eventData.tags) : null
    };

    // Insert event into database
    const result = await executeQuery(
      `INSERT INTO events (
        title, description, short_description, location, is_online, 
        online_meeting_link, start_datetime, end_datetime, timezone, 
        image_url, registration_url, capacity, organizer_name, 
        organizer_email, event_type, is_featured, status, 
        created_by, created_at, updated_at, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
      [
        data.title,
        data.description,
        data.short_description,
        data.location,
        data.is_online,
        data.online_meeting_link,
        new Date(data.start_datetime),
        new Date(data.end_datetime),
        data.timezone,
        data.image_url,
        data.registration_url,
        data.capacity,
        data.organizer_name,
        data.organizer_email,
        data.event_type,
        data.is_featured,
        data.status,
        data.created_by,
        data.tags
      ]
    );

    const eventId = result.insertId;

    // Create audit log entry
    await executeQuery(
      `INSERT INTO audit_logs (
        user_id, action_type, entity_type, entity_id, 
        new_value, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        'CREATE',
        'EVENT',
        eventId,
        JSON.stringify({ ...data, id: eventId })
      ]
    );

    // Return created event
    const [createdEvent] = await executeQuery(
      `SELECT * FROM events WHERE id = ?`,
      [eventId]
    );

    return {
      success: true,
      event: createdEvent
    };
  } catch (error) {
    console.error('Error in createEvent:', error.message);
    return { 
      success: false, 
      message: `इवेंट बनाने में त्रुटि: ${error.message}` 
    };
  }
}

/**
 * Update an existing event
 * @param {number} eventId Event ID
 * @param {Object} eventData Updated event data
 * @param {number} userId User ID who is updating the event
 * @returns {Promise<Object>} Update result
 */
async function updateEvent(eventId, eventData, userId) {
  try {
    // Get current event data for audit log
    const [currentEvent] = await executeQuery(
      `SELECT * FROM events WHERE id = ?`,
      [eventId]
    );

    if (!currentEvent) {
      return { 
        success: false, 
        message: 'इवेंट नहीं मिला' 
      };
    }

    // Process tags
    const tags = eventData.tags ? 
      (typeof eventData.tags === 'string' ? 
        eventData.tags : 
        JSON.stringify(eventData.tags)
      ) : 
      currentEvent.tags;

    // Update event
    await executeQuery(
      `UPDATE events SET
        title = ?,
        description = ?,
        short_description = ?,
        location = ?,
        is_online = ?,
        online_meeting_link = ?,
        start_datetime = ?,
        end_datetime = ?,
        timezone = ?,
        image_url = ?,
        registration_url = ?,
        capacity = ?,
        organizer_name = ?,
        organizer_email = ?,
        event_type = ?,
        is_featured = ?,
        status = ?,
        updated_at = NOW(),
        tags = ?
      WHERE id = ?`,
      [
        eventData.title || currentEvent.title,
        eventData.description || currentEvent.description,
        eventData.short_description || (
          eventData.description ? 
            (eventData.description.length > 200 ? 
              eventData.description.substring(0, 197) + '...' : 
              eventData.description) : 
            currentEvent.short_description
        ),
        eventData.location || currentEvent.location,
        eventData.is_online !== undefined ? eventData.is_online : currentEvent.is_online,
        eventData.online_meeting_link || currentEvent.online_meeting_link,
        eventData.start_datetime ? new Date(eventData.start_datetime) : currentEvent.start_datetime,
        eventData.end_datetime ? new Date(eventData.end_datetime) : currentEvent.end_datetime,
        eventData.timezone || currentEvent.timezone,
        eventData.image_url || currentEvent.image_url,
        eventData.registration_url || currentEvent.registration_url,
        eventData.capacity !== undefined ? eventData.capacity : currentEvent.capacity,
        eventData.organizer_name || currentEvent.organizer_name,
        eventData.organizer_email || currentEvent.organizer_email,
        eventData.event_type || currentEvent.event_type,
        eventData.is_featured !== undefined ? eventData.is_featured : currentEvent.is_featured,
        eventData.status || currentEvent.status,
        tags,
        eventId
      ]
    );

    // Create audit log entry
    await executeQuery(
      `INSERT INTO audit_logs (
        user_id, action_type, entity_type, entity_id, 
        old_value, new_value, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        'UPDATE',
        'EVENT',
        eventId,
        JSON.stringify(currentEvent),
        JSON.stringify({ ...currentEvent, ...eventData, id: eventId })
      ]
    );

    // Return updated event
    const [updatedEvent] = await executeQuery(
      `SELECT * FROM events WHERE id = ?`,
      [eventId]
    );

    return {
      success: true,
      event: updatedEvent
    };
  } catch (error) {
    console.error('Error in updateEvent:', error.message);
    return { 
      success: false, 
      message: `इवेंट अपडेट करने में त्रुटि: ${error.message}` 
    };
  }
}

/**
 * Register user for an event
 * @param {number} eventId Event ID
 * @param {number} userId User ID
 * @returns {Promise<Object>} Registration result
 */
async function registerForEvent(eventId, userId) {
  try {
    // Check if event exists and has capacity
    const [event] = await executeQuery(
      `SELECT id, title, capacity, registered_count, start_datetime 
       FROM events 
       WHERE id = ?`,
      [eventId]
    );

    if (!event) {
      return { 
        success: false, 
        message: 'इवेंट नहीं मिला' 
      };
    }

    // Check if event is in the past
    if (new Date(event.start_datetime) < new Date()) {
      return {
        success: false,
        message: 'आप एक पुराने इवेंट के लिए पंजीकरण नहीं कर सकते'
      };
    }

    // Check if event has reached capacity
    if (event.capacity && event.registered_count >= event.capacity) {
      return {
        success: false,
        message: 'इवेंट की क्षमता पूरी हो गई है'
      };
    }

    // Check if user is already registered
    const [existingRegistration] = await executeQuery(
      `SELECT id FROM event_registrations 
       WHERE event_id = ? AND user_id = ?`,
      [eventId, userId]
    );

    if (existingRegistration) {
      return {
        success: false,
        message: 'आप पहले से ही इस इवेंट के लिए पंजीकृत हैं'
      };
    }

    // Create a unique QR code for the registration
    const qrCode = `EVT-${eventId}-USR-${userId}-${Date.now().toString(36)}`;

    // Start transaction
    const queries = [
      {
        sql: `INSERT INTO event_registrations 
              (event_id, user_id, registration_date, status, qr_code)
              VALUES (?, ?, NOW(), 'registered', ?)`,
        params: [eventId, userId, qrCode]
      },
      {
        sql: `UPDATE events 
              SET registered_count = registered_count + 1
              WHERE id = ?`,
        params: [eventId]
      },
      {
        sql: `INSERT INTO notifications
              (user_id, title, message, type, action_url, created_at)
              VALUES (?, ?, ?, ?, ?, NOW())`,
        params: [
          userId,
          `इवेंट पंजीकरण: ${event.title}`,
          `आप सफलतापूर्वक इवेंट के लिए पंजीकृत हो गए हैं: ${event.title}`,
          'success',
          `/events/${eventId}`
        ]
      },
      {
        sql: `INSERT INTO audit_logs 
              (user_id, action_type, entity_type, entity_id, new_value, created_at)
              VALUES (?, ?, ?, ?, ?, NOW())`,
        params: [
          userId, 
          'CREATE', 
          'EVENT_REGISTRATION', 
          eventId,
          JSON.stringify({ eventId, userId, registrationDate: new Date() })
        ]
      }
    ];

    await executeTransaction(queries);

    return {
      success: true,
      message: 'आप सफलतापूर्वक इवेंट के लिए पंजीकृत हो गए हैं',
      qrCode
    };
  } catch (error) {
    console.error('Error in registerForEvent:', error.message);
    return { 
      success: false, 
      message: `इवेंट के लिए पंजीकरण में त्रुटि: ${error.message}` 
    };
  }
}

/**
 * Get upcoming events with optional filters
 * @param {Object} filters Filter options (type, featured, etc.)
 * @returns {Promise<Array>} Filtered events
 */
async function getEvents(filters = {}) {
  try {
    let query = `
      SELECT e.*, 
        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as registration_count,
        u.name as creator_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (filters.type) {
      query += ` AND e.event_type = ?`;
      params.push(filters.type);
    }

    if (filters.featured) {
      query += ` AND e.is_featured = TRUE`;
    }

    if (filters.status) {
      query += ` AND e.status = ?`;
      params.push(filters.status);
    }

    if (filters.upcoming) {
      query += ` AND e.start_datetime >= NOW()`;
    }

    if (filters.past) {
      query += ` AND e.end_datetime < NOW()`;
    }

    if (filters.search) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Apply sorting
    if (filters.sort === 'date-asc') {
      query += ` ORDER BY e.start_datetime ASC`;
    } else if (filters.sort === 'date-desc') {
      query += ` ORDER BY e.start_datetime DESC`;
    } else if (filters.sort === 'popular') {
      query += ` ORDER BY registration_count DESC`;
    } else {
      query += ` ORDER BY e.start_datetime ASC`;
    }

    // Apply pagination
    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(filters.limit));
      
      if (filters.offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(filters.offset));
      }
    }

    const events = await executeQuery(query, params);

    // Format the tags field if it exists
    return events.map(event => ({
      ...event,
      tags: event.tags ? JSON.parse(event.tags) : []
    }));
  } catch (error) {
    console.error('Error in getEvents:', error.message);
    return [];
  }
}

/**
 * Convert external event data to our schema format
 * @param {Object} event The external event object
 * @param {string} source The source name
 * @returns {Object} Formatted event object
 */
function convertExternalEvent(event, source) {
  // Map the category based on source and event info
  const category = mapCategoryFromSource(event.category || event.type || 'conference', source);
  
  // Basic conversion template
  return {
    title: event.title || event.name || 'Untitled Event',
    description: event.description || event.summary || 'No description available',
    imageUrl: event.image_url || event.imageUrl || event.banner_url || '',
    startDate: new Date(event.start_date || event.start_time || event.startDate || Date.now()),
    endDate: new Date(event.end_date || event.end_time || event.endDate || Date.now() + 86400000), // Default to 1 day
    location: event.location || event.venue || event.place || 'Online',
    category,
    source,
    organizerName: event.organizer_name || event.organizerName || source,
    organizerImageUrl: event.organizer_logo || event.organizerLogo || '',
    registrationUrl: event.url || event.registration_url || event.link || '',
    isFeatured: false,
    approved: true // External events are pre-approved
  };
}

/**
 * Map category based on source and raw category
 * @param {string} category Raw category from source
 * @param {string} source Event source
 * @returns {string} Mapped category
 */
function mapCategoryFromSource(category, source) {
  category = category.toLowerCase();
  
  // Cryptology-specific mappings
  if (category.includes('crypt') || category.includes('secur') || category.includes('cipher')) {
    if (category.includes('workshop') || category.includes('tutorial')) {
      return 'workshop';
    } else if (category.includes('hackathon') || category.includes('challenge')) {
      return 'hackathon';
    } else if (category.includes('webinar') || category.includes('online')) {
      return 'webinar';
    } else if (category.includes('lecture') || category.includes('talk')) {
      return 'lecture';
    } else if (category.includes('meetup') || category.includes('gathering')) {
      return 'meetup';
    } else {
      return 'conference';
    }
  }
  
  // Source-specific defaults
  switch (source) {
    case 'iacr':
      return 'conference';
    case 'defcon':
      return 'conference';
    case 'eventbrite':
      return category.includes('workshop') ? 'workshop' : 'conference';
    default:
      return 'conference';
  }
}

/**
 * Fetch events from International Association for Cryptologic Research
 * @returns {Promise<Array>} IACR events
 */
async function getIACREvents() {
  try {
    // In a real application, you would fetch from the IACR API
    // For now, we'll use sample data based on typical IACR events
    return [
      {
        title: 'Eurocrypt 2025',
        description: 'The 44th Annual International Conference on the Theory and Applications of Cryptographic Techniques',
        start_date: '2025-05-15T09:00:00Z',
        end_date: '2025-05-19T18:00:00Z',
        location: 'Vienna, Austria',
        url: 'https://eurocrypt.iacr.org/2025/',
        category: 'conference',
        organizer_name: 'International Association for Cryptologic Research',
        image_url: 'https://iacr.org/logo/logo-iacr.png'
      },
      {
        title: 'Crypto 2025',
        description: 'The 45th Annual International Cryptology Conference',
        start_date: '2025-08-18T09:00:00Z',
        end_date: '2025-08-22T18:00:00Z',
        location: 'Santa Barbara, USA',
        url: 'https://crypto.iacr.org/2025/',
        category: 'conference',
        organizer_name: 'International Association for Cryptologic Research',
        image_url: 'https://iacr.org/logo/logo-iacr.png'
      },
      {
        title: 'Asiacrypt 2024',
        description: 'The 30th Annual International Conference on the Theory and Application of Cryptology and Information Security',
        start_date: '2024-12-01T09:00:00Z',
        end_date: '2024-12-05T18:00:00Z',
        location: 'Tokyo, Japan',
        url: 'https://asiacrypt.iacr.org/2024/',
        category: 'conference',
        organizer_name: 'International Association for Cryptologic Research',
        image_url: 'https://iacr.org/logo/logo-iacr.png'
      },
      {
        title: 'CHES 2024: Cryptographic Hardware and Embedded Systems',
        description: 'Workshop on Cryptographic Hardware and Embedded Systems focusing on the design and analysis of cryptographic hardware and software implementations',
        start_date: '2024-09-09T09:00:00Z',
        end_date: '2024-09-12T18:00:00Z',
        location: 'Brussels, Belgium',
        url: 'https://ches.iacr.org/2024/',
        category: 'workshop',
        organizer_name: 'International Association for Cryptologic Research',
        image_url: 'https://iacr.org/logo/logo-iacr.png'
      }
    ].map(event => convertExternalEvent(event, 'iacr'));
  } catch (error) {
    console.error('Error fetching IACR events:', error.message);
    return [];
  }
}

/**
 * Fetch events from Cryptology Conference website
 * @returns {Promise<Array>} Cryptology Conference events
 */
async function getCryptologyConferenceEvents() {
  try {
    // In a real app, you would scrape or use API
    return [
      {
        title: 'International Conference on Post-Quantum Cryptography (PQCrypto)',
        description: 'Conference focusing on cryptographic systems that can resist attacks by quantum computers',
        startDate: '2024-09-25',
        endDate: '2024-09-27',
        location: 'Zurich, Switzerland',
        url: 'https://pqcrypto2024.org',
        category: 'conference',
        organizerName: 'ETH Zurich',
        imageUrl: 'https://pqcrypto2024.org/assets/images/logo.png'
      },
      {
        title: 'Workshop on Cryptographic Protocols and Zero-Knowledge Proofs',
        description: 'Intensive workshop on latest advancements in zero-knowledge proofs and their applications in privacy-preserving protocols',
        startDate: '2024-11-12',
        endDate: '2024-11-14',
        location: 'London, UK',
        url: 'https://zk-workshop.org',
        category: 'workshop',
        organizerName: 'University College London',
        imageUrl: ''
      },
      {
        title: 'Applied Cryptanalysis Summer School',
        description: 'Hands-on training in modern cryptanalytic techniques for graduate students and industry professionals',
        startDate: '2025-06-15',
        endDate: '2025-06-20',
        location: 'Paris, France',
        url: 'https://applied-crypto-school.fr',
        category: 'workshop',
        organizerName: 'CNRS & Sorbonne University',
        imageUrl: 'https://applied-crypto-school.fr/logo.png'
      }
    ].map(event => convertExternalEvent(event, 'cryptologyconference'));
  } catch (error) {
    console.error('Error fetching Cryptology Conference events:', error.message);
    return [];
  }
}

/**
 * Fetch events from Eventbrite
 * @returns {Promise<Array>} Eventbrite events
 */
async function getEventbriteEvents() {
  try {
    // In a real app, you would use the Eventbrite API
    // For now, we'll simulate API response
    const apiKey = process.env.EVENTBRITE_API_KEY;
    const oauthToken = process.env.EVENTBRITE_OAUTH_TOKEN;
    
    if (!apiKey && !oauthToken) {
      console.warn('Eventbrite API credentials not configured. Using sample data.');
      return getSampleEventbriteEvents();
    }
    
    // Simulate API response
    return getSampleEventbriteEvents();
  } catch (error) {
    console.error('Error fetching Eventbrite events:', error.message);
    return [];
  }
}

/**
 * Get sample Eventbrite events (for demo purposes)
 * @returns {Array} Sample Eventbrite events
 */
function getSampleEventbriteEvents() {
  return [
    {
      name: 'Cryptography Fundamentals Workshop',
      description: 'Learn the basics of modern cryptography including symmetric and asymmetric encryption, hash functions, and digital signatures.',
      start_time: '2024-10-18T10:00:00Z',
      end_time: '2024-10-18T16:00:00Z',
      venue: 'Online',
      url: 'https://www.eventbrite.com/e/cryptography-fundamentals-workshop-tickets-123456789',
      category: 'workshop',
      organizer_name: 'CryptoEdu',
      organizer_logo: 'https://img.evbuc.com/cryptoedu-logo.png'
    },
    {
      name: 'Blockchain Security Symposium',
      description: 'Dive deep into the security aspects of blockchain technology, including cryptographic foundations, consensus mechanisms, and smart contract auditing.',
      start_time: '2024-11-05T09:00:00Z',
      end_time: '2024-11-07T17:00:00Z',
      venue: 'New York, NY',
      url: 'https://www.eventbrite.com/e/blockchain-security-symposium-tickets-987654321',
      category: 'conference',
      organizer_name: 'Blockchain Security Alliance',
      organizer_logo: 'https://img.evbuc.com/bsa-logo.png'
    }
  ].map(event => convertExternalEvent(event, 'eventbrite'));
}

/**
 * Fetch events from DEFCON
 * @returns {Promise<Array>} DEFCON events
 */
async function getDefconEvents() {
  try {
    // In a real app, you would scrape DEFCON website or use API if available
    return [
      {
        title: 'DEF CON 33',
        description: 'One of the world\'s largest and most notable hacker conventions, with significant focus on cryptography and security',
        start_date: '2025-08-07T09:00:00Z',
        end_date: '2025-08-10T18:00:00Z',
        location: 'Las Vegas, USA',
        url: 'https://defcon.org',
        category: 'conference',
        organizer_name: 'DEFCON',
        image_url: 'https://defcon.org/images/defcon-logo.png'
      },
      {
        title: 'DEFCON Cryptography Village',
        description: 'Specialized track at DEFCON focused on cryptographic research, challenges, and applications',
        start_date: '2025-08-07T10:00:00Z',
        end_date: '2025-08-10T17:00:00Z',
        location: 'Las Vegas, USA',
        url: 'https://cryptovillage.org',
        category: 'workshop',
        organizer_name: 'DEFCON Crypto Village',
        image_url: 'https://cryptovillage.org/logo.png'
      }
    ].map(event => convertExternalEvent(event, 'defcon'));
  } catch (error) {
    console.error('Error fetching DEFCON events:', error.message);
    return [];
  }
}

module.exports = {
  getExternalEvents,
  importExternalEvents,
  createEvent,
  updateEvent,
  registerForEvent,
  getEvents
};