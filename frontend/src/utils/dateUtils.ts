/**
 * Date utilities for the application
 */

/**
 * Formats a date string into a relative time format (e.g., "just now", "5m ago", "2h ago")
 * @param dateString ISO date string or Date object
 * @returns Formatted relative time string
 */
export const timeAgo = (dateString: string | Date): string => {
  try {
    if (!dateString) {
      return 'Recently';
    }
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks}w ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths}mo ago`;
    } else {
      return `${diffYears}y ago`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently';
  }
};

/**
 * Formats a date to a standard format
 * @param dateString ISO date string
 * @param format Format to use (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, format = 'MMM d, yyyy'): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Simple formatter that mimics date-fns format
    // For a full-featured solution, consider using date-fns
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}; 