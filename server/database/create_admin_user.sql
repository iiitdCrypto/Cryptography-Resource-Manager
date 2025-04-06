-- SQL Script to create admin user 'Bhargav Jani' with full permissions

-- First, create the user with admin role
INSERT INTO users (
  name, 
  surname, 
  email, 
  password, -- Using bcrypt hash for password 'admin123'
  role, 
  bio, 
  institution, 
  position, 
  account_status, 
  email_verified, 
  created_at, 
  updated_at
) VALUES (
  'Bhargav',
  'Jani',
  'bhargav.jani@example.com',
  '$2a$10$OMUlP0cLJRUFBsmFOyQfZOXSJvC5qjgEEEmc1xW/Xh4/c5Z3vH9.q', -- Hashed password for 'admin123'
  'admin',
  'Administrator with full system access',
  'IIITD',
  'System Administrator',
  'active',
  TRUE,
  NOW(),
  NOW()
);

-- Get the user ID of the newly created user
SET @user_id = LAST_INSERT_ID();

-- Create user settings
INSERT INTO user_settings (
  user_id, 
  theme, 
  language, 
  email_notifications, 
  created_at, 
  updated_at
) VALUES (
  @user_id,
  'system',
  'en',
  TRUE,
  NOW(),
  NOW()
);

-- Create user permissions with full access
INSERT INTO user_permissions (
  user_id,
  can_access_dashboard,
  can_update_content,
  can_manage_users,
  can_view_analytics,
  can_create_events,
  can_edit_events,
  can_delete_events,
  can_create_resources,
  can_edit_resources,
  can_delete_resources,
  can_view_audit_logs,
  can_manage_permissions,
  can_export_data,
  created_at,
  updated_at
) VALUES (
  @user_id,
  TRUE, -- can_access_dashboard
  TRUE, -- can_update_content
  TRUE, -- can_manage_users
  TRUE, -- can_view_analytics
  TRUE, -- can_create_events
  TRUE, -- can_edit_events
  TRUE, -- can_delete_events
  TRUE, -- can_create_resources
  TRUE, -- can_edit_resources
  TRUE, -- can_delete_resources
  TRUE, -- can_view_audit_logs
  TRUE, -- can_manage_permissions
  TRUE, -- can_export_data
  NOW(),
  NOW()
);

-- Log the creation in audit_logs
INSERT INTO audit_logs (
  user_id,
  action_type,
  entity_type,
  entity_id,
  new_value,
  created_at
) VALUES (
  @user_id,
  'CREATE',
  'USER',
  @user_id,
  JSON_OBJECT(
    'name', 'Bhargav',
    'surname', 'Jani',
    'email', 'bhargav.jani@example.com',
    'role', 'admin',
    'permissions', 'full'
  ),
  NOW()
);

-- Output confirmation message
SELECT CONCAT('Admin user Bhargav Jani created with ID: ', @user_id) AS result;