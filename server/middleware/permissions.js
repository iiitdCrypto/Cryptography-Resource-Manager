const { executeQuery } = require('../config/db');

// Helper function to get user permissions
const getUserPermissions = async (userId) => {
  try {
    const permissions = await executeQuery(
      `SELECT * FROM user_permissions WHERE user_id = ?`, 
      [userId]
    );
    
    if (permissions.length === 0) {
      // Create default permissions if none exist
      await executeQuery(
        `INSERT INTO user_permissions 
         (user_id, can_access_dashboard, can_update_content, created_at, updated_at) 
         VALUES (?, ?, ?, NOW(), NOW())`,
        [userId, false, false]
      );
      return { 
        canAccessDashboard: false,
        canUpdateContent: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canCreateEvents: false,
        canEditEvents: false,
        canDeleteEvents: false,
        canCreateResources: false,
        canEditResources: false,
        canDeleteResources: false,
        canViewAuditLogs: false,
        canManagePermissions: false,
        canExportData: false
      };
    }
    
    return {
      canAccessDashboard: permissions[0].can_access_dashboard === 1,
      canUpdateContent: permissions[0].can_update_content === 1,
      canManageUsers: permissions[0].can_manage_users === 1,
      canViewAnalytics: permissions[0].can_view_analytics === 1,
      canCreateEvents: permissions[0].can_create_events === 1,
      canEditEvents: permissions[0].can_edit_events === 1,
      canDeleteEvents: permissions[0].can_delete_events === 1,
      canCreateResources: permissions[0].can_create_resources === 1,
      canEditResources: permissions[0].can_edit_resources === 1,
      canDeleteResources: permissions[0].can_delete_resources === 1,
      canViewAuditLogs: permissions[0].can_view_audit_logs === 1,
      canManagePermissions: permissions[0].can_manage_permissions === 1,
      canExportData: permissions[0].can_export_data === 1
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return null;
  }
};

// Middleware to add permissions to user object
const attachPermissions = async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  try {
    const permissions = await getUserPermissions(req.user.id);
    
    if (!permissions) {
      return res.status(500).json({ message: 'Error retrieving user permissions' });
    }
    
    req.user.permissions = permissions;
    next();
  } catch (error) {
    console.error('Permission middleware error:', error);
    res.status(500).json({ message: 'Server error getting permissions' });
  }
};

// Admin role check
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

// Check if user can access dashboard
const canAccessDashboard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role === 'admin' || req.user.permissions.canAccessDashboard) {
    return next();
  }
  
  res.status(403).json({ message: 'Access to dashboard denied' });
};

// Check if user can manage users
const canManageUsers = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role === 'admin' || req.user.permissions.canManageUsers) {
    return next();
  }
  
  res.status(403).json({ message: 'Permission to manage users denied' });
};

// Check if user can view analytics
const canViewAnalytics = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role === 'admin' || req.user.permissions.canViewAnalytics) {
    return next();
  }
  
  res.status(403).json({ message: 'Permission to view analytics denied' });
};

// Check if user can update content
const canUpdateContent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role === 'admin' || req.user.permissions.canUpdateContent) {
    return next();
  }
  
  res.status(403).json({ message: 'Permission to update content denied' });
};

// Flexible permission check creator
const hasPermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (req.user.role === 'admin' || req.user.permissions[permissionName]) {
      return next();
    }
    
    res.status(403).json({ message: `Permission ${permissionName} denied` });
  };
};

// Resource owner check - for API endpoints that allow creators to edit their own content
const isResourceOwner = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const resourceId = req.params.id;
    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID is required' });
    }
    
    try {
      let tableName;
      switch (resourceType) {
        case 'resource':
          tableName = 'resources';
          break;
        case 'event':
          tableName = 'events';
          break;
        case 'article':
          tableName = 'articles';
          break;
        case 'project':
          tableName = 'projects';
          break;
        case 'lecture':
          tableName = 'lectures';
          break;
        default:
          return res.status(400).json({ message: 'Invalid resource type' });
      }
      
      const resource = await executeQuery(
        `SELECT created_by FROM ${tableName} WHERE id = ?`,
        [resourceId]
      );
      
      if (resource.length === 0) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      if (resource[0].created_by === req.user.id || req.user.role === 'admin') {
        return next();
      }
      
      // Check for specific permission based on action and resource type
      const action = req.method === 'DELETE' ? 'Delete' : 'Edit';
      const permissionName = `can${action}${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}s`;
      
      if (req.user.permissions[permissionName]) {
        return next();
      }
      
      res.status(403).json({ message: 'You do not have permission to modify this resource' });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Server error checking permissions' });
    }
  };
};

module.exports = {
  getUserPermissions,
  attachPermissions,
  isAdmin,
  canAccessDashboard,
  canManageUsers,
  canViewAnalytics, 
  canUpdateContent,
  hasPermission,
  isResourceOwner
};
