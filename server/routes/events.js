const express = require('express');
const router = express.Router();
const { getExternalEvents } = require('../services/eventService');
const { pool } = require('../config/db');

/**
 * @route GET /api/events
 * @desc Get all events with optional filtering
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      source,
      category,
      search,
      startDate,
      featured,
      limit = 10,
      page = 1
    } = req.query;

    // Get events from database
    let dbEvents = [];
    try {
      const connection = await pool.getConnection();
      
      // Build query dynamically based on filters
      let query = 'SELECT * FROM events WHERE 1=1';
      const params = [];
      
      // Add filters
      if (source) {
        // Handle multiple sources
        if (Array.isArray(source)) {
          const placeholders = source.map(() => '?').join(', ');
          query += ` AND source IN (${placeholders})`;
          params.push(...source);
        } else {
          query += ' AND source = ?';
          params.push(source);
        }
      }
      
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      
      if (search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      if (startDate) {
        query += ' AND start_datetime >= ?';
        params.push(new Date(startDate));
      }
      
      if (featured) {
        query += ' AND is_featured = ?';
        params.push(featured === 'true' ? 1 : 0);
      }
      
      // Filter for cryptography/cryptology events only
      query += ' AND (title LIKE ? OR description LIKE ? OR title LIKE ? OR description LIKE ? OR title LIKE ? OR description LIKE ?)';
      params.push('%cryptography%', '%cryptography%', '%cryptology%', '%cryptology%', '%cryptanalysis%', '%cryptanalysis%');
      
      // Add status filtering - only show approved events
      query += ' AND status = ?';
      params.push('approved');
      
      // Add sorting
      query += ' ORDER BY start_datetime ASC';
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const [rows] = await connection.execute(query, params);
      connection.release();
      
      // Transform database results to match our schema
      dbEvents = rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        startDate: row.start_datetime,
        endDate: row.end_datetime || new Date(new Date(row.start_datetime).getTime() + 86400000), // Default to next day
        location: row.location || 'Online',
        imageUrl: row.image_url || '',
        category: row.category || 'conference',
        source: row.source || 'college',
        organizerName: row.organizer_name || '',
        organizerImageUrl: '',
        registrationUrl: row.registration_link || '',
        isFeatured: row.is_featured === 1,
        approved: row.status === 'approved'
      }));
    } catch (dbError) {
      console.error('Database error:', dbError.message);
      // If database fails, proceed with external events only
    }
    
    // Get events from external sources if not specifically requesting DB events
    let externalEvents = [];
    if (source !== 'college') {
      // Convert string source to array for filtering
      const sourceFilter = source ? 
        (Array.isArray(source) ? source : [source]) : 
        null;
      
      externalEvents = await getExternalEvents(sourceFilter);
      
      // Apply additional filters to external events
      if (category) {
        externalEvents = externalEvents.filter(event => 
          event.category.toLowerCase() === category.toLowerCase());
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        externalEvents = externalEvents.filter(event => 
          event.title.toLowerCase().includes(searchLower) || 
          event.description.toLowerCase().includes(searchLower));
      }
      
      if (startDate) {
        const startDateObj = new Date(startDate);
        externalEvents = externalEvents.filter(event => 
          new Date(event.startDate) >= startDateObj);
      }
      
      if (featured === 'true') {
        externalEvents = externalEvents.filter(event => event.isFeatured);
      }
      
      // Filter to only include cryptography, cryptology, cryptanalysis related events
      externalEvents = externalEvents.filter(event => {
        const title = event.title.toLowerCase();
        const desc = event.description.toLowerCase();
        return (
          title.includes('crypt') || 
          desc.includes('crypt') || 
          title.includes('cipher') ||
          desc.includes('cipher') || 
          title.includes('encryption') || 
          desc.includes('encryption')
        );
      });
    }
    
    // Combine and sort results
    const allEvents = [...dbEvents, ...externalEvents].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    );
    
    // Apply pagination if needed to combined results
    const paginatedEvents = allEvents.slice(0, parseInt(limit));
    
    res.json(paginatedEvents);
  } catch (error) {
    console.error('Error fetching events:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/events/:id
 * @desc Get single event by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle numeric IDs (database) differently from string IDs (external)
    if (!isNaN(id)) {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM events WHERE id = ?', 
        [id]
      );
      connection.release();
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const row = rows[0];
      const event = {
        id: row.id,
        title: row.title,
        description: row.description,
        startDate: row.start_datetime,
        endDate: row.end_datetime,
        location: row.location,
        imageUrl: row.image_url || '',
        category: row.category,
        source: row.source,
        organizerName: row.organizer_name || '',
        organizerImageUrl: '',
        registrationUrl: row.registration_link || '',
        isFeatured: row.is_featured === 1,
        approved: row.status === 'approved'
      };
      
      return res.json(event);
    } else {
      // For external events, we'd need to maintain a cache or refetch
      // For this example, we'll return a not found
      return res.status(404).json({ message: 'External event details not available' });
    }
  } catch (error) {
    console.error('Error fetching event:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/events
 * @desc Create a new event
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    // Extract event data from request body
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      imageUrl,
      category,
      registrationUrl,
      organizerName
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !startDate || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Format dates for MySQL
    const formattedStartDate = new Date(startDate).toISOString().slice(0, 19).replace('T', ' ');
    const formattedEndDate = endDate ? new Date(endDate).toISOString().slice(0, 19).replace('T', ' ') : null;
    
    const connection = await pool.getConnection();
    
    // Insert the event
    const [result] = await connection.execute(
      `INSERT INTO events (
        title, description, start_datetime, end_datetime, 
        location, image_url, source, registration_link, 
        category, organizer_name, status, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        description, 
        formattedStartDate, 
        formattedEndDate, 
        location || 'Online', 
        imageUrl || '', 
        'college', // Default source for user-submitted events
        registrationUrl || '',
        category,
        organizerName || '',
        'pending', // New events require approval
        JSON.stringify(['cryptography', 'cryptology']) // Default tags
      ]
    );
    
    connection.release();
    
    // Return the created event
    res.status(201).json({
      id: result.insertId,
      title,
      description,
      startDate,
      endDate,
      location,
      imageUrl,
      category,
      source: 'college',
      organizerName,
      organizerImageUrl: '',
      registrationUrl,
      isFeatured: false,
      approved: false
    });
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route PUT /api/events/:id
 * @desc Update an event
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      imageUrl,
      category,
      registrationUrl,
      organizerName,
      isFeatured,
      approved
    } = req.body;
    
    // Format dates for MySQL
    const formattedStartDate = startDate ? new Date(startDate).toISOString().slice(0, 19).replace('T', ' ') : null;
    const formattedEndDate = endDate ? new Date(endDate).toISOString().slice(0, 19).replace('T', ' ') : null;
    
    // Build dynamic query based on provided fields
    let query = 'UPDATE events SET ';
    const params = [];
    const updates = [];
    
    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (formattedStartDate) {
      updates.push('start_datetime = ?');
      params.push(formattedStartDate);
    }
    
    if (formattedEndDate) {
      updates.push('end_datetime = ?');
      params.push(formattedEndDate);
    }
    
    if (location) {
      updates.push('location = ?');
      params.push(location);
    }
    
    if (imageUrl) {
      updates.push('image_url = ?');
      params.push(imageUrl);
    }
    
    if (category) {
      updates.push('category = ?');
      params.push(category);
    }
    
    if (registrationUrl) {
      updates.push('registration_link = ?');
      params.push(registrationUrl);
    }
    
    if (organizerName) {
      updates.push('organizer_name = ?');
      params.push(organizerName);
    }
    
    if (isFeatured !== undefined) {
      updates.push('is_featured = ?');
      params.push(isFeatured ? 1 : 0);
    }
    
    if (approved !== undefined) {
      updates.push('status = ?');
      params.push(approved ? 'approved' : 'pending');
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    query += updates.join(', ');
    query += ' WHERE id = ?';
    params.push(id);
    
    const connection = await pool.getConnection();
    await connection.execute(query, params);
    
    // Fetch the updated event
    const [rows] = await connection.execute('SELECT * FROM events WHERE id = ?', [id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const row = rows[0];
    const event = {
      id: row.id,
      title: row.title,
      description: row.description,
      startDate: row.start_datetime,
      endDate: row.end_datetime,
      location: row.location,
      imageUrl: row.image_url || '',
      category: row.category,
      source: row.source,
      organizerName: row.organizer_name || '',
      organizerImageUrl: '',
      registrationUrl: row.registration_link || '',
      isFeatured: row.is_featured === 1,
      approved: row.status === 'approved'
    };
    
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/events/:id
 * @desc Delete an event
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    const [result] = await connection.execute('DELETE FROM events WHERE id = ?', [id]);
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/events/:id/approve
 * @desc Approve an event
 * @access Private (Admin only)
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'UPDATE events SET status = ? WHERE id = ?', 
      ['approved', id]
    );
    
    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Fetch the updated event
    const [rows] = await connection.execute('SELECT * FROM events WHERE id = ?', [id]);
    connection.release();
    
    const row = rows[0];
    const event = {
      id: row.id,
      title: row.title,
      description: row.description,
      startDate: row.start_datetime,
      endDate: row.end_datetime,
      location: row.location,
      imageUrl: row.image_url || '',
      category: row.category,
      source: row.source,
      organizerName: row.organizer_name || '',
      organizerImageUrl: '',
      registrationUrl: row.registration_link || '',
      isFeatured: row.is_featured === 1,
      approved: true
    };
    
    res.json(event);
  } catch (error) {
    console.error('Error approving event:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;