
"use client";

import html2canvas from 'html2canvas';

export const exportElementAsPNG = async (elementId: string, fileName: string = 'tournament-export.png') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for export:', elementId);
    alert('Error: Could not find element to export.');
    return;
  }

  const isDarkMode = document.documentElement.classList.contains('dark');
  const originalClasses = element.className;

  try {
    // Light theme background: #F2F0F4 (from globals.css --background: 255 17% 95%;)
    // Dark theme background: #1C1A23 (from globals.css --background: 258 10% 12%;)
    const exportBackgroundColor = isDarkMode ? '#1C1A23' : '#F2F0F4';

    if (isDarkMode) {
      element.classList.add('dark');
    }

    const canvas = await html2canvas(element, {
      scale: 2, // Increase scale for better resolution
      useCORS: true, // If you have external images
      backgroundColor: exportBackgroundColor,
      logging: false, // Reduce console noise
    });
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting element as PNG:', error);
    alert('Error exporting image. Please try again.');
  } finally {
    // Restore original classes
    if (isDarkMode) {
      element.classList.remove('dark');
    }
    // If you manipulated other classes, ensure to restore them properly
    // For now, just removing 'dark' if it was added is sufficient.
    // If element.className was stored and modified beyond just adding 'dark',
    // then element.className = originalClasses; would be more robust.
  }
};

