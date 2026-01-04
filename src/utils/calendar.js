/**
 * Formats a date string (YYYY-MM-DD) into a format suitable for Google Calendar (YYYYMMDD)
 * @param {string} dateString 
 * @returns {string}
 */
const formatDateForGoogle = (dateString) => {
    if (!dateString) return '';
    return dateString.replace(/-/g, '');
};

/**
 * Generates a Google Calendar event URL
 * @param {Object} task 
 * @returns {string}
 */
export const generateGoogleCalendarUrl = (task) => {
    if (!task.due_date) return '#';

    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const text = `&text=${encodeURIComponent(task.title)}`;
    // Google Calendar expects dates in YYYYMMDD format for all-day events
    const date = formatDateForGoogle(task.due_date);
    // For all-day events, start and end date are the same (or end is next day, but same day works for single day)
    // Actually for single day all-day event: YYYYMMDD/YYYYMMDD+1
    // But let's keep it simple: YYYYMMDD/YYYYMMDD works effectively as a one day event in many contexts or strictly YYYYMMDD to YYYYMMDD
    const nextDayDate = new Date(task.due_date);
    nextDayDate.setDate(nextDayDate.getDate() + 1);
    const nextDayStr = nextDayDate.toISOString().split('T')[0].replace(/-/g, '');

    const dates = `&dates=${date}/${nextDayStr}`;
    const details = `&details=${encodeURIComponent('Task from Second Brain App')}`;

    return `${baseUrl}${text}${dates}${details}`;
};

/**
 * Generates and downloads an ICS file for the task
 * @param {Object} task 
 */
export const downloadIcsFile = (task) => {
    if (!task.due_date) return;

    // Create a simpler date format without hyphens for the ICS content
    const date = task.due_date.replace(/-/g, '');
    const nextDayDate = new Date(task.due_date);
    nextDayDate.setDate(nextDayDate.getDate() + 1);
    const nextDayStr = nextDayDate.toISOString().split('T')[0].replace(/-/g, '');

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Second Brain App//Tasks//EN',
        'BEGIN:VEVENT',
        `UID:${task.id || Date.now()}@secondbrain.app`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${nextDayStr}`,
        `SUMMARY:${task.title}`,
        'DESCRIPTION:Task from Second Brain App',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_task.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
